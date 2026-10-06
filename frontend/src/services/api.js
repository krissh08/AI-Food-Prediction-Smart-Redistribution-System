const API_BASE_URL = "http://localhost:8000/api";

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 401) {
      // Unauthorized token expired - clear token
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "An API error occurred");
    }

    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const authAPI = {
  login: (credentials) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  registerDonor: (data) => request("/auth/register/donor", { method: "POST", body: JSON.stringify(data) }),
  registerAcceptor: (data) => request("/auth/register/acceptor", { method: "POST", body: JSON.stringify(data) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  getMe: () => request("/auth/me"),
};

export const donorAPI = {
  getDashboard: () => request("/donor/dashboard"),
  getFoodListings: () => request("/donor/food"),
  createFoodListing: (data) => request("/donor/food", { method: "POST", body: JSON.stringify(data) }),
  deleteFoodListing: (id) => request(`/donor/food/${id}`, { method: "DELETE" }),
};

export const acceptorAPI = {
  getDashboard: () => request("/acceptor/dashboard"),
  getAvailableFood: (params = "") => request(`/acceptor/available-food${params}`),
  requestFood: (data) => request("/acceptor/request-food", { method: "POST", body: JSON.stringify(data) }),
};

export const aiAPI = {
  predictSurplus: (data) => request("/api/ai/predict-surplus".replace("/api", ""), { method: "POST", body: JSON.stringify(data) }),
  getHistory: () => request("/ai/history"),
  getWasteAnalysis: () => request("/ai/waste-analysis"),
};

export const donationsAPI = {
  getDonations: (statusFilter = "") => request(`/donations${statusFilter ? `?status_filter=${statusFilter}` : ""}`),
  getDetail: (id) => request(`/donations/${id}`),
  approve: (id, payload) => request(`/donations/${id}/approve`, { method: "PUT", body: JSON.stringify(payload) }),
  reject: (id) => request(`/donations/${id}/reject`, { method: "PUT" }),
  confirmPickup: (id) => request(`/donations/${id}/confirm-pickup`, { method: "PUT" }),
};

export const matchingAPI = {
  getRecommendations: (foodId) => request(`/matching/recommendations/${foodId}`),
};

export const notificationsAPI = {
  getNotifications: () => request("/notifications"),
  markRead: (id) => request(`/notifications/${id}/read`, { method: "PUT" }),
  markAllRead: () => request("/notifications/read-all", { method: "PUT" }),
};

export const analyticsAPI = {
  getSystem: () => request("/analytics/system"),
  getDonor: () => request("/analytics/donor"),
  getAcceptor: () => request("/analytics/acceptor"),
};

export const adminAPI = {
  getDashboard: () => request("/admin/dashboard"),
  toggleUserStatus: (userId) => request(`/admin/users/${userId}/toggle-status`, { method: "PUT" }),
};
