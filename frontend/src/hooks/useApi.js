import { useState, useCallback } from 'react';

/**
 * Custom hook for API calls with loading, error, and data states
 */
export function useApi(apiFunction) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunction(...args);
      const responseData = result.data || result;
      setData(responseData);
      return responseData;
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    setData,
  };
}

/**
 * Custom hook for API calls that execute immediately on mount
 */
export function useApiOnMount(apiFunction, dependencies = []) {
  const { data, loading, error, execute, reset, setData } = useApi(apiFunction);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Execute on mount
  useState(() => {
    execute().then(() => setHasLoaded(true)).catch(() => setHasLoaded(true));
  }, dependencies);

  const refresh = useCallback(async () => {
    return execute();
  }, [execute]);

  return {
    data,
    loading,
    error,
    refresh,
    reset,
    setData,
    hasLoaded,
  };
}

export default useApi;
