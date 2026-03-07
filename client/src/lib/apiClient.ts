/**
 * Custom error class for API errors
 * Extends Error with additional HTTP status information
 */
export class APIError extends Error {
  /**
   * HTTP status code (e.g., 404, 500)
   */
  public status: number;

  /**
   * HTTP status text (e.g., 'Not Found', 'Internal Server Error')
   */
  public statusText: string;

  /**
   * Creates an APIError instance
   * @param status - HTTP status code
   * @param statusText - HTTP status text
   * @param message - Error message from response body
   */
  constructor(status: number, statusText: string, message: string) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.statusText = statusText;
  }
}

/**
 * Makes an HTTP request to the API
 * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param url - Request URL
 * @param data - Optional request body data
 * @returns Promise resolving to the Response object
 * @throws APIError if the response status is not OK
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include',
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new APIError(res.status, res.statusText, text);
  }

  return res;
}

/**
 * Convenience object with shorthand methods for common HTTP operations
 */
export const api = {
  /**
   * Makes a GET request
   * @param url - Request URL
   * @returns Promise resolving to the Response object
   */
  get: (url: string) => apiRequest('GET', url),

  /**
   * Makes a POST request with JSON body
   * @param url - Request URL
   * @param data - Request body data
   * @returns Promise resolving to the Response object
   */
  post: (url: string, data: unknown) => apiRequest('POST', url, data),

  /**
   * Makes a PUT request with JSON body
   * @param url - Request URL
   * @param data - Request body data
   * @returns Promise resolving to the Response object
   */
  put: (url: string, data: unknown) => apiRequest('PUT', url, data),

  /**
   * Makes a DELETE request
   * @param url - Request URL
   * @returns Promise resolving to the Response object
   */
  delete: (url: string) => apiRequest('DELETE', url),
};
