/**
 * Generic catalog recommendation engine — used for Movies, Books, Career,
 * Electronics, Courses, Fashion, Restaurants, Games, and Music. Unlike the
 * travel engine, there's no location/age/season logic here; it scores on
 * interest/tag text matches, budget fit, and rating/popularity, mirroring
 * the same transparent, rule-based approach.
 */

function textMatchScore(query, item) {
  if (!query) return 0;
  const terms = query.toLowerCase().split(/[,\s]+/).filter((t) => t.length > 2);
  const haystack = `${item.title} ${item.description} ${item.tags || ''}`.toLowerCase();
  let hits = 0;
  for (const term of terms) {
    if (haystack.includes(term)) hits++;
  }
  return Math.min(hits * 3, 12);
}

function budgetScore(budgetUsd, item) {
  if (!budgetUsd || item.price_usd === null || item.price_usd === undefined) return 0;
  const price = Number(item.price_usd);
  if (price === 0) return 2; // free items are never "over budget"
  const diff = Math.abs(budgetUsd - price);
  const ratio = diff / Math.max(budgetUsd, 1);
  if (ratio <= 0.2) return 6;
  if (ratio <= 0.5) return 3;
  if (ratio <= 1) return 1;
  return -3;
}

function ratingScore(item) {
  const rating = Number(item.avg_rating) || 0;
  const popularity = Number(item.popularity_score) || 0;
  return rating * 1.5 + popularity * 0.5;
}

function generateCatalogRecommendations(items, { interests, purpose, budgetUsd }, topN = 10) {
  const query = [interests, purpose].filter(Boolean).join(' ');

  const scored = items.map((item) => {
    let score = 0;
    const reasons = [];

    const t = textMatchScore(query, item);
    if (t > 0) reasons.push('matches your stated interests');
    score += t;

    const b = budgetScore(budgetUsd, item);
    if (b > 0) reasons.push('fits your budget');
    score += b;

    score += ratingScore(item);

    if (item.popularity_score >= 9) reasons.push('highly popular pick');

    return {
      ...item,
      score: Math.round(score * 100) / 100,
      reason: reasons.length ? reasons.slice(0, 3).join('; ') : 'highly-rated pick in this category',
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN);
}

module.exports = { generateCatalogRecommendations };
