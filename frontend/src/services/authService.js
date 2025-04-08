/**
 * Authentication service for handling login with password and OTP
 */
import { getCSRFToken } from "../utils/csrf";

// Base API URL - adjust to match your backend
const API_BASE_URL = "/api/user";

/**
 * Add CSRF token to headers if available
 * @param {Object} headers - HTTP headers object
 * @returns {Object} Headers with CSRF token added if available
 */
function addCSRFHeader(headers = {}) {
  const csrfToken = getCSRFToken();
  if (csrfToken) {
    return {
      ...headers,
      "X-CSRFToken": csrfToken
    };
  }
  return headers;
}

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} Response with user data
 */
export async function loginWithPassword(username, password) {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: addCSRFHeader({
      "Content-Type": "application/json"
    }),
    body: JSON.stringify({ username, password }),
    credentials: "include" // Include cookies
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Login failed");
  }

  return response.json();
}

/**
 * Request OTP for email login
 * @param {string} email
 * @returns {Promise<Object>} Response with OTP timestamp
 */
export async function requestOTP(email) {
  const response = await fetch(`${API_BASE_URL}/login/otp/request`, {
    method: "POST",
    headers: addCSRFHeader({
      "Content-Type": "application/json"
    }),
    body: JSON.stringify({ email }),
    credentials: "include" // Important for CSRF protection
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to request OTP");
  }

  return response.json();
}

/**
 * Login with OTP
 * @param {string} email
 * @param {string} otp
 * @param {number} otp_ts
 * @returns {Promise<Object>} Response with user data
 */
export async function loginWithOTP(email, otp, otp_ts) {
  const response = await fetch(`${API_BASE_URL}/login/otp`, {
    method: "POST",
    headers: addCSRFHeader({
      "Content-Type": "application/json"
    }),
    body: JSON.stringify({ email, otp, otp_ts }),
    credentials: "include" // Include cookies
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "OTP login failed");
  }

  return response.json();
}

/**
 * Logout the current user
 * @returns {Promise<void>}
 */
export async function logout() {
  const response = await fetch(`${API_BASE_URL}/logout`, {
    method: "POST",
    headers: addCSRFHeader(),
    credentials: "include"
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Logout failed");
  }

  return response.json();
}
