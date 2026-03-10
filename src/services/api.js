import axios from "axios";

// const API_BASE = "/api"; // Relative path via proxy
const API_BASE = import.meta.env.VITE_API_BASE || "/api";

// Create Axios instance with credentials for authenticated requests
export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies (accessToken, csrftoken)
});

// Create Axios instance for public endpoints
export const noAuthApi = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies
});

// Store CSRF token and its expiration
let csrfToken = null;
let csrfTokenExpires = null;
const CSRF_TOKEN_LIFETIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Fetch CSRF token from the backend
async function fetchCsrfToken() {
  try {
    const response = await noAuthApi.get('/auth/get-csrf-token/');
    csrfToken = response.data.csrfToken;
    csrfTokenExpires = Date.now() + CSRF_TOKEN_LIFETIME; // Assume token is valid for 24 hours
    console.log('Fetched CSRF token:', csrfToken);
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error.response?.data || error.message);
    throw error;
  }
}

// Ensure CSRF token is fetched and valid
async function ensureCsrfToken() {
  // Check if token exists and is not expired
  if (!csrfToken || !csrfTokenExpires || Date.now() >= csrfTokenExpires) {
    await fetchCsrfToken();
  }
  return csrfToken;
}

// Request interceptor to add CSRF token for non-safe methods
api.interceptors.request.use(
  async (config) => {
    const nonSafeMethods = ['post', 'put', 'delete', 'patch'];
    const url = config?.url || '';
    const isPublicEndpoint = /\/(refresh|login|register|logout|verify-email|validate-token|reset-password)\/?(\?.*)?$/.test(url);

    // Remove Authorization header for public endpoints
    if (isPublicEndpoint && config.headers.Authorization) {
      delete config.headers.Authorization;
    }

    // Add CSRF token for non-safe methods
    if (nonSafeMethods.includes(config.method.toLowerCase())) {
      try {
        const token = await ensureCsrfToken();
        config.headers['X-CSRFToken'] = token;
        console.log(`Added CSRF token to ${config.method.toUpperCase()} ${url}:`, token);
      } catch (error) {
        console.error('Failed to add CSRF token:', error);
        throw error;
      }
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Single-flight refresh control
let isRefreshing = false;
let refreshPromise = null;
let pendingRequests = [];

function subscribeTokenRefresh(cb) {
  pendingRequests.push(cb);
}

function onRefreshed() {
  pendingRequests.forEach((cb) => cb());
  pendingRequests = [];
}

export async function refreshAccessToken() {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = noAuthApi
      .post('/auth/refresh/', {})
      .then(() => {
        // No tokens/user returned; cookies are set by backend
        localStorage.setItem('isAuthenticated', 'true');
        /* console.log('Token refresh successful'); */
        onRefreshed();
      })
      .catch((error) => {
        /* console.error('Error during token refresh:', error.response?.data || error.message); */
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        throw error;
      })
      .finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// Response interceptor for token expiration
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config || {};
//     if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
//       originalRequest._retry = true;
//       try {
//         await refreshAccessToken();
//         console.log('Retrying original request after token refresh:', originalRequest.url);
//         return api(originalRequest);
//       } catch (refreshError) {
//         console.error('Token refresh failed:', refreshError);
//         localStorage.removeItem('user');
//         localStorage.removeItem('isAuthenticated');
//         window.location.href = '/login';
//         return Promise.reject(refreshError);
//       }
//     }
//     console.error(`API error for ${originalRequest.method?.toUpperCase()} ${originalRequest.url}:`, error.response?.data || error.message);
//     return Promise.reject(error);
//   }
// );


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const url = originalRequest.url || '';

    // Never retry the refresh endpoint itself — prevents infinite loops
    const isRefreshEndpoint = url.includes('/auth/refresh/');

    if ((status === 401 || status === 403) && !originalRequest._retry && !isRefreshEndpoint) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Queue the request until the token is refreshed
        return new Promise((resolve, reject) => {
          pendingRequests.push({   // ← was wrongly named pendingQueue
            resolve: () => resolve(api(originalRequest)),
            reject: (err) => reject(err),
          });
        });
      }

      try {
        await refreshAccessToken();
        /* console.log("Retrying original request:", originalRequest.url); */
        return api(originalRequest); // Retry with refreshed cookies
      } catch (refreshError) {
        /* console.error("Token refresh failed, redirecting to login"); */
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    console.error(
      `API error for ${originalRequest.method?.toUpperCase()} ${originalRequest.url}:`,
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

// Authentication
export const registerCompany = async (data) => {
  console.log("registerCompany payload:", data);
  try {
    const res = await noAuthApi.post('/auth/register/', data);
    console.log('registerCompany response:', res.data);
    return res;
  } catch (error) {
    console.error('registerCompany error:', error.response?.data || error.message);
    throw error;
  }
};

export const verifyEmail = (data) => noAuthApi.post("/auth/verify-email/", data);

export const loginCompany = async (data) => {
  /* console.log('loginCompany payload:', data); */
  try {
    const response = await noAuthApi.post('/auth/login/', data);
    /* console.log('loginCompany response:', response.data); */
    return response;
  } catch (error) {
    /* console.error('loginCompany error:', error.response?.data || error.message); */
    throw error;
  }
};

export const logoutUser = async () => {
  /* console.log('logoutUser: Sending POST /logout/'); */
  try {
    const response = await noAuthApi.post('/auth/logout/', {});
    /* console.log('logoutUser response:', response.data); */
    return response;
  } catch (error) {
    /* console.error('logoutUser error:', error.response?.data || error.message); */
    throw error;
  }
};

export const refreshToken = async () => {
  /* console.log('refreshToken: Sending POST /refresh/'); */
  try {
    const response = await noAuthApi.post('/auth/refresh/', {});
    /* console.log('refreshToken response:', response.data); */
    return response;
  } catch (error) {
    /* console.error('refreshToken error:', error.response?.data || error.message); */
    throw error;
  }
};

export const validateToken = async () => {
  /* console.log('validateToken: Sending GET /validate-token/'); */
  try {
    const response = await noAuthApi.get('/auth/validate-token/');
    /* console.log('validateToken response:', response.data); */
    return response;
  } catch (error) {
    /* console.error('validateToken error:', error.response?.data || error.message); */
    throw error;
  }
};

// Devices
export const registerEsp = (data) => api.post("/devices/register-esp/", data);
export const TotalEspPerProvince = () => api.get("/devices/total-esp-per-province/");
export const TotalSensorPerProvince = () => api.get("/devices/total-sensors-per-province/");
export const TotalSmartValvePerProvince = () => api.get("/devices/total-smartvalve-per-province/");

export const TotalEspPerDistrict = (province) => {
  return api.get("/devices/total-esp-per-district/", {
    params: { province },
  });
};

export const TotalSensorPerDistrict = (province) => {
  return api.get("/devices/total-sensors-per-district/", {
    params: { province },
  });
};

export const TotalSmartValvePerDistrict = (province) => {
  return api.get("/devices/total-smartvalve-per-district/", {
    params: { province },
  });
};

// Provinces
export const getSmartValveLocation = () => api.get("/devices/SmartValveLocation/");
export const getSensorLocation = () => api.get("/devices/SensorLocation/");

// Control
export const ScheduledControl = (data) => api.post("/control/scheduled-control/", data);
export const getTodayScheduledControls = () => api.get("/control/today-scheduled-controls/");
export const getFutureScheduledControls = () => api.get("/control/future-scheduled-controls/");
export const manageScheduledControlStatus = (controlId, action) =>
  api.post('/control/manage-scheduled-controls/', { id: controlId, status: action });
export const checkScheduledControlStatus = () => api.get("/control/manage-scheduled-controls/");

// Water Readings (Past time)
export const getHourlyAverages = () => api.get("/monitoring/hourly-averages/");
export const getLastHourAverage = () => api.get("/monitoring/last-hour-average/");
export const getCriticalReadings = () => api.get("/monitoring/critical-readings/");
export const simulateWater = () => api.post("/monitoring/simulate-water/");
export const simulateLeakage = () => api.post("/monitoring/simulate-leakage/");
export const stopSimulateWater = () => api.post("/monitoring/stop-simulate-water/");
export const stopSimulateLeakage = () => api.post("/monitoring/stop-simulate-leakage/");

// Commands
export const sendCommand = (data) => api.post("/control/send-command/", data);
export const getAllCommands = () => api.get("/control/all-commands/");
export const getProvinceCommandCount = () => api.get("/control/province-command-count/");

// Leakages
export const getAllLeaks = (province) => {
  return api.get("/leakage/all-leaks/", {
    params: { province },
  });
};

export const getRecentLeak = () => api.get("/leakage/recent-leak/");

export const getRecentLeakageProvince = (province) => {
  return api.get("/leakage/recent-leakage-province/", {
    params: { province },
  });
};

export const getInvestigatingLeaks = (province) => {
  return api.get("/leakage/investigating-leaks/", {
    params: { province },
  });
};

// Resolve a leakage
export const resolveLeakage = (data) => api.post("/leakage/resolved-leak/", data);

// Get total leakages per province for dashboard stats
export const getTotalLeakagesPerProvince = () => api.get("/leakage/total-leakages-province/");

// Get device count for dashboard
export const getDeviceCount = () => api.get("/devices/device-count/");

// Get user count per province for dashboard
export const getUserCountPerProvince = () => api.get("/auth/user-count-per-province/");

// Forgot password function
export const forgotPassword = async (email) => {
  try {
    const response = await noAuthApi.post("/auth/forgot-password/", { email });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Reset password function
export const resetPassword = async (data) => {
  try {
    const response = await noAuthApi.post("/auth/reset-password/", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get leakage details by ID
export const getLeakageById = async (leakageId) => {
  try {
    const response = await api.post("/leakage/leakage-by-id/", { leakage_id: leakageId });
    return response.data;
  } catch (error) {
    throw error;
  }
};

//Profile 
export const getUserDetails = () => api.get("/auth/get-user-details/");
export const updateUserDetails = (data) => api.post("/auth/update-user-details/", data);

export default api;