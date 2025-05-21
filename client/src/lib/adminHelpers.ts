/**
 * Helper functions for admin-specific functionality
 */

/**
 * Makes an authenticated API request to an admin endpoint
 * @param url The API endpoint to call
 * @returns The JSON response
 */
export async function fetchAdminApi(url: string) {
  const token = localStorage.getItem("token");
  
  if (!token) {
    throw new Error("Not authenticated");
  }
  
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} - ${errorText || response.statusText}`);
  }
  
  return response.json();
}

/**
 * Makes an authenticated API request with a method and optional body
 * @param method The HTTP method (POST, PATCH, PUT, DELETE)
 * @param url The API endpoint to call
 * @param data Optional data to send in the request body
 * @returns The JSON response
 */
export async function callAdminApi(method: string, url: string, data?: any) {
  const token = localStorage.getItem("token");
  
  if (!token) {
    throw new Error("Not authenticated");
  }
  
  const response = await fetch(url, {
    method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: data ? JSON.stringify(data) : undefined
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} - ${errorText || response.statusText}`);
  }
  
  return response.json();
}