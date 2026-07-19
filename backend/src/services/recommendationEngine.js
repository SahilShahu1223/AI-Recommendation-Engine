/**
 * Recommendation Engine
 * ---------------------
 * A transparent, rule-based scoring engine (not an LLM call) that ranks
 * destinations for a user based on:
 *   - stated interests / purpose (text match against category & description)
 *   - budget
 *   - age (derived from date_of_birth) & age-appropriateness
 *   - preferred travel style
 *   - season
 *   - destination rating / popularity
 *   - previously liked / visited destinations (avoid repeats, boost similar categories)
 *   - search history keywords
 *
 * Domestic/international mixing:
 *   If the user does not specify a location preference, the result set is
 *   deliberately blended: destinations from the user's own country, nearby
 *   countries/region, and popular international/trending spots.
 */

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function textMatchScore(interests, destination) {
  if (!interests) return 0;
  const terms = interests.toLowerCase().split(/[,\s]+/).filter(Boolean);
  const haystack = `${destination.name} ${destination.description || ''} ${destination.category || ''}`.toLowerCase();
  let hits = 0;
  for (const term of terms) {
    if (term.length > 2 && haystack.includes(term)) hits++;
  }
  return Math.min(hits * 2, 8); // cap contribution
}

function budgetScore(budgetUsd, destination) {
  if (!budgetUsd || !destination.avg_cost_per_day_usd) return 0;
  const diff = Math.abs(budgetUsd - Number(destination.avg_cost_per_day_usd));
  const ratio = diff / Math.max(budgetUsd, 1);
  if (ratio <= 0.15) return 6;
  if (ratio <= 0.4) return 3;
  if (ratio <= 0.8) return 1;
  return -3; // heavily out of budget, penalize
}

function ageScore(age, destination) {
  if (age === null) return 0;
  if (destination.min_age_recommended && age < destination.min_age_recommended) return -5;
  if (age < 12 && destination.kid_friendly) return 4;
  if (age >= 12 && age < 18 && destination.kid_friendly) return 2;
  return 0;
}

function travelStyleScore(style, destination) {
  if (!style || !destination.category) return 0;
  const cat = destination.category.toLowerCase();
  const map = {
    budget: ['budget', 'beach'],
    luxury: ['luxury', 'romantic'],
    adventure: ['adventure', 'mountain', 'wildlife'],
    family: ['family', 'beach', 'city'],
    solo: ['adventure', 'city', 'wellness'],
    backpacker: ['budget', 'adventure'],
    comfort: ['city', 'heritage', 'wellness'],
  };
  const preferredCats = map[style] || [];
  return preferredCats.some((c) => cat.includes(c)) ? 5 : 0;
}

function seasonScore(season, destination) {
  if (!season || !destination.best_season) return 0;
  const seasons = destination.best_season.toLowerCase();
  if (seasons.includes('all_year')) return 2;
  return seasons.includes(season.toLowerCase()) ? 5 : -2;
}

function historyScore(destination, { travelHistoryNames = [], likedCategories = [] } = {}) {
  let score = 0;
  const alreadyVisited = travelHistoryNames.some(
    (n) => n.toLowerCase().trim() === destination.name.toLowerCase().trim()
  );
  if (alreadyVisited) score -= 6; // de-prioritize repeats, but don't fully exclude

  if (destination.category) {
    const cats = destination.category.split(',');
    const overlap = cats.filter((c) => likedCategories.includes(c)).length;
    score += overlap * 3;
  }
  return score;
}

function ratingScore(destination) {
  const rating = Number(destination.avg_rating) || 0;
  const popularity = Number(destination.popularity_score) || 0;
  return rating * 1.5 + popularity * 0.5;
}

/**
 * Main scoring + blending function.
 *
 * @param {Array} candidateDestinations - all destinations to consider
 * @param {Object} params - { interests, purpose, budgetUsd, locationPreference, travelStyle, season, dateOfBirth, userCountry, travelHistoryNames, likedCategories }
 * @param {Number} topN - number of results to return
 */
function generateRecommendations(candidateDestinations, params, topN = 10) {
  const {
    interests, budgetUsd, locationPreference, travelStyle, season,
    dateOfBirth, userCountry, travelHistoryNames = [], likedCategories = [],
  } = params;

  const age = calculateAge(dateOfBirth);

  const scored = candidateDestinations.map((d) => {
    let score = 0;
    const reasons = [];

    const t = textMatchScore(interests, d);
    if (t > 0) reasons.push('matches your stated interests');
    score += t;

    const b = budgetScore(budgetUsd, d);
    if (b > 0) reasons.push('fits your budget');
    score += b;

    const a = ageScore(age, d);
    if (a > 0) reasons.push('age-appropriate / family friendly');
    score += a;

    const ts = travelStyleScore(travelStyle, d);
    if (ts > 0) reasons.push(`matches your ${travelStyle} travel style`);
    score += ts;

    const s = seasonScore(season, d);
    if (s > 0) reasons.push('great for the current season');
    score += s;

    const h = historyScore(d, { travelHistoryNames, likedCategories });
    if (h > 0) reasons.push('similar to places you liked before');
    score += h;

    const r = ratingScore(d);
    score += r;

    // Slight boost for user's home country when no explicit location given,
    // to counter bias toward only-international suggestions.
    if (!locationPreference && userCountry && d.country === userCountry) {
      score += 3;
      reasons.push('popular in your home country');
    }
    if (!locationPreference && d.popularity_score >= 8.5) {
      reasons.push('trending worldwide');
    }

    return {
      ...d,
      score: Math.round(score * 100) / 100,
      reason: reasons.length ? reasons.slice(0, 3).join('; ') : 'popular, highly-rated destination',
    };
  });

  scored.sort((x, y) => y.score - x.score);

  // If no explicit location preference: deliberately blend domestic + international
  // so results are not dominated by only one type.
  if (!locationPreference) {
    const domestic = scored.filter((d) => d.type === 'domestic');
    const international = scored.filter((d) => d.type === 'international');

    const blended = [];
    const domesticTarget = Math.ceil(topN * 0.5); // aim for ~50/50 mix
    let di = 0, ii = 0;
    while (blended.length < topN && (di < domestic.length || ii < international.length)) {
      if (di < domestic.length && blended.filter((x) => x.type === 'domestic').length < domesticTarget) {
        blended.push(domestic[di++]);
      } else if (ii < international.length) {
        blended.push(international[ii++]);
      } else if (di < domestic.length) {
        blended.push(domestic[di++]);
      } else {
        break;
      }
    }
    return blended.slice(0, topN);
  }

  // If location preference given, filter to matching country/region first,
  // falling back to the general ranked list if too few matches.
  const pref = locationPreference.toLowerCase();
  const matching = scored.filter(
    (d) => d.country.toLowerCase().includes(pref) || (d.region || '').toLowerCase().includes(pref)
  );
  if (matching.length >= Math.min(3, topN)) {
    return matching.slice(0, topN);
  }
  return scored.slice(0, topN);
}

module.exports = { generateRecommendations, calculateAge };
