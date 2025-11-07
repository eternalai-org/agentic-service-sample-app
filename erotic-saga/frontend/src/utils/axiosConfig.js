import axios from "axios";

// Initialize user_id in localStorage if not exists
const initUserId = () => {
  let user_id = localStorage.getItem("user_id");
  if (!user_id) {
    // Generate a simple unique ID (timestamp + random)
    user_id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("user_id", user_id);
  }
  return user_id;
};

// Initialize user_id on import
initUserId();

// Set up axios interceptor to add x-user-id header to all requests
axios.interceptors.request.use(
  (config) => {
    const userId = localStorage.getItem("user_id");
    if (userId) {
      config.headers["x-user-id"] = userId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axios;
