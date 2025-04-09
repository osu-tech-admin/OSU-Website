/**
 * Player service for fetching player data from the API
 */
import { getCSRFToken } from "../utils/csrf";

// Base API URL for players
const API_BASE_URL = "/api/players";

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
 * Get all players with optional filtering and sorting
 * @param {Object} options - Options for filtering and sorting
 * @param {string} [options.search] - Search term to filter by name
 * @param {string} [options.gender] - Filter by gender (M, F, O)
 * @param {string} [options.role] - Filter by preferred role (C, H)
 * @param {number} [options.team_id] - Filter by team ID
 * @param {string} [options.sort] - Field to sort by (name, gender, city, role)
 * @param {string} [options.order] - Sort order (asc, desc)
 * @param {number} [options.limit] - Number of results to return (default: 50)
 * @param {number} [options.offset] - Offset for pagination (default: 0)
 * @returns {Promise<Object>} Response with players data and total count
 */
export async function getPlayers(options = {}) {
  // Build query string from options
  const queryParams = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value);
    }
  });

  const queryString = queryParams.toString()
    ? `?${queryParams.toString()}`
    : "";
  const url = `${API_BASE_URL}${queryString}`;

  const response = await fetch(url, {
    method: "GET",
    headers: addCSRFHeader(),
    credentials: "include"
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch players");
  }

  return response.json();
}

/**
 * Get player by slug
 * @param {string} slug - The slug of the player to retrieve
 * @returns {Promise<Object>} Player data
 */
export async function getPlayerBySlug(slug) {
  const response = await fetch(`${API_BASE_URL}/${slug}`, {
    method: "GET",
    headers: addCSRFHeader(),
    credentials: "include"
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Player not found");
    }
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch player");
  }

  return response.json();
}

/**
 * Get players by team
 * @param {number} teamId - The team ID
 * @param {Object} options - Options for sorting
 * @param {string} [options.sort] - Field to sort by (name, gender, city, role)
 * @param {string} [options.order] - Sort order (asc, desc)
 * @returns {Promise<Object>} Response with players data and total count
 */
export async function getPlayersByTeam(teamId, options = {}) {
  // Build query string from options
  const queryParams = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value);
    }
  });

  const queryString = queryParams.toString()
    ? `?${queryParams.toString()}`
    : "";
  const url = `${API_BASE_URL}/by-team/${teamId}${queryString}`;

  const response = await fetch(url, {
    method: "GET",
    headers: addCSRFHeader(),
    credentials: "include"
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch team players");
  }

  return response.json();
}
