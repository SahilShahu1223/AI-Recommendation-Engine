// Lightweight API client for the Smart Recommend AI backend.
// Base URL comes from VITE_API_URL (see .env.example), defaults to localhost:5000.

const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000/api";

function getAccessToken() {
    return localStorage.getItem("sra_access_token");
}
function getRefreshToken() {
    return localStorage.getItem("sra_refresh_token");
}
export function setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem("sra_access_token", accessToken);
    localStorage.setItem("sra_refresh_token", refreshToken);
}
export function clearTokens() {
    localStorage.removeItem("sra_access_token");
    localStorage.removeItem("sra_refresh_token");
}

async function request(path: string, options: RequestInit = {}, retry = true): Promise<any> {
    const token = getAccessToken();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> | undefined),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

    // Access token expired — try a silent refresh once.
    if (res.status === 401 && retry && getRefreshToken()) {
        const refreshed = await tryRefresh();
        if (refreshed) return request(path, options, false);
    }

    let data: any = null;
    try { data = await res.json(); } catch { /* no body */ }

    if (!res.ok) {
        throw new Error(data?.message || `Request failed with status ${res.status}`);
    }
    return data;
}

async function tryRefresh(): Promise<boolean> {
    try {
        const refreshToken = getRefreshToken();
        const res = await fetch(`${API_BASE}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        localStorage.setItem("sra_access_token", data.accessToken);
        return true;
    } catch {
        return false;
    }
}

export const api = {
    // Auth
    register: (payload: {
        firstName: string; lastName: string; email: string; password: string; confirmPassword: string;
        dateOfBirth: string; gender?: string; country: string; preferredTravelStyle?: string;
    }) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),

    login: (email: string, password: string) =>
        request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

    logout: () => {
        const refreshToken = getRefreshToken();
        clearTokens();
        return request("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) }).catch(() => { });
    },

    me: () => request("/auth/me"),

    // User account
    deleteAccount: (password: string) =>
        request("/users/account", { method: "DELETE", body: JSON.stringify({ password }) }),

    // Payments (Stripe Checkout)
    getPaymentStatus: () => request("/payments/status"),
    createCheckoutSession: () =>
        request("/payments/create-checkout-session", { method: "POST" }),
    confirmCheckoutSession: (sessionId: string) =>
        request("/payments/confirm", { method: "POST", body: JSON.stringify({ sessionId }) }),
    demoUpgrade: () => request("/payments/demo-upgrade", { method: "POST" }),
    cancelSubscription: () =>
        request("/payments/cancel", { method: "POST" }),
    resumeSubscription: () =>
        request("/payments/resume", { method: "POST" }),
    getInvoice: () => request("/payments/invoice"),

    // Recommendations (travel destinations)
    generateRecommendations: (payload: {
        interests?: string; purpose?: string; budgetUsd?: number;
        locationPreference?: string; travelStyle?: string; season?: string; topN?: number;
    }) => request("/recommendations/generate", { method: "POST", body: JSON.stringify(payload) }),

    // Catalog recommendations (Movies, Books, Career, Electronics, Courses,
    // Fashion, Restaurants, Games, Music) — same real-backend pattern as Travel.
    generateCatalogRecommendations: (
        category: string,
        payload: { interests?: string; purpose?: string; budgetUsd?: number; topN?: number },
    ) => request(`/catalog/${category}/generate`, { method: "POST", body: JSON.stringify(payload) }),

    getRecommendationHistory: () => request("/recommendations/history"),
    saveRecommendation: (destinationId: number, requestId?: number) =>
        request("/recommendations/save", { method: "POST", body: JSON.stringify({ destinationId, requestId }) }),
    getSavedRecommendations: () => request("/recommendations/saved"),

    // Destinations
    searchDestinations: (query: string) => request(`/destinations/search?q=${encodeURIComponent(query)}`),

    // Kids
    getKidsForAge: (age: number) => request(`/kids/recommend?age=${age}`),
    getAllKidsActivities: () => request("/kids"),
    getKidsCatalog: (category?: string) =>
        request(`/kids/catalog${category ? `?category=${category}` : ""}`),
    getKidsCatalogCategories: () => request("/kids/catalog/categories"),

    // Credits
    getCredits: () => request("/credits"),

    // Wishlist
    getWishlist: () => request("/wishlist"),
    addToWishlist: (destinationId: number) =>
        request("/wishlist", { method: "POST", body: JSON.stringify({ destinationId }) }),
    removeFromWishlist: (destinationId: number) =>
        request(`/wishlist/${destinationId}`, { method: "DELETE" }),

    // Reviews
    getReviews: (destinationId: number) => request(`/reviews/${destinationId}`),
    submitReview: (destinationId: number, rating: number, title?: string, body?: string) =>
        request("/reviews", { method: "POST", body: JSON.stringify({ destinationId, rating, title, body }) }),
};
