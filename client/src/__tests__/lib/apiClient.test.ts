import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest, APIError, api } from '../../lib/apiClient';

describe('apiClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('apiRequest', () => {
    it('should make GET request and return Response', async () => {
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        statusText: 'OK',
      });
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

      const result = await apiRequest('GET', '/api/test');

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {},
        body: undefined,
        credentials: 'include',
      });
      expect(result).toBeInstanceOf(Response);
      expect(result.ok).toBe(true);
    });

    it('should throw APIError on 404 status', async () => {
      const mockResponse = new Response('Not Found', {
        status: 404,
        statusText: 'Not Found',
      });
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

      await expect(apiRequest('GET', '/api/test')).rejects.toThrow(APIError);
    });

    it('should throw APIError on 500 status', async () => {
      const mockResponse = new Response('Internal Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      });
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

      await expect(apiRequest('GET', '/api/test')).rejects.toThrow(APIError);
    });
  });

  describe('APIError', () => {
    it('should have status, statusText, and message properties', async () => {
      const mockResponse = new Response('Resource not found', {
        status: 404,
        statusText: 'Not Found',
      });
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

      try {
        await apiRequest('GET', '/api/test');
        expect.fail('Should have thrown APIError');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        const apiError = error as APIError;
        expect(apiError.status).toBe(404);
        expect(apiError.statusText).toBe('Not Found');
        expect(apiError.message).toBe('Resource not found');
        expect(apiError.name).toBe('APIError');
      }
    });
  });

  describe('api convenience methods', () => {
    it('api.get should be shorthand for apiRequest GET', async () => {
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        statusText: 'OK',
      });
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

      const result = await api.get('/test');

      expect(fetch).toHaveBeenCalledWith('/test', {
        method: 'GET',
        headers: {},
        body: undefined,
        credentials: 'include',
      });
      expect(result).toBeInstanceOf(Response);
    });

    it('api.post should send POST request with JSON body', async () => {
      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
        statusText: 'OK',
      });
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

      const data = { name: 'test' };
      const result = await api.post('/test', data);

      expect(fetch).toHaveBeenCalledWith('/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      expect(result).toBeInstanceOf(Response);
    });

    it('api.put should send PUT request with JSON body', async () => {
      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
        statusText: 'OK',
      });
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

      const data = { name: 'updated' };
      const result = await api.put('/test/123', data);

      expect(fetch).toHaveBeenCalledWith('/test/123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      expect(result).toBeInstanceOf(Response);
    });

    it('api.delete should send DELETE request', async () => {
      const mockResponse = new Response(null, {
        status: 204,
        statusText: 'No Content',
      });
      vi.mocked(fetch).mockResolvedValueOnce(mockResponse);

      const result = await api.delete('/test/123');

      expect(fetch).toHaveBeenCalledWith('/test/123', {
        method: 'DELETE',
        headers: {},
        body: undefined,
        credentials: 'include',
      });
      expect(result).toBeInstanceOf(Response);
    });
  });
});
