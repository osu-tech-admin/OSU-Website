/**
 * Utility functions for handling CSRF tokens with Django
 */

/**
 * Fetch CSRF token from the Django backend
 * This function should be called when the app initializes
 *
 * @returns {Promise<string>} The CSRF token
 */
export async function fetchCSRFToken() {
  // Make a GET request to a Django endpoint to get the CSRF cookie
  // Usually, any page will set a CSRF cookie
  try {
    const response = await fetch("/api/csrf/", {
      method: "GET",
      credentials: "include" // Important: include cookies
    });

    if (!response.ok) {
      console.error("Failed to fetch CSRF token");
    }

    // The token is now in the cookies, and will be extracted by the getCSRFToken function
    const csrfToken = getCSRFToken();
    return csrfToken;
  } catch (error) {
    console.error("Error fetching CSRF token:", error);
    return null;
  }
}

/**
 * Get the CSRF token from cookies
 *
 * @returns {string|null} The CSRF token or null if not found
 */
export function getCSRFToken() {
  const name = "csrftoken";
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return parts.pop().split(";").shift();
  }

  return null;
}
