import { useState, useEffect, useCallback } from 'react';
import analyticsService from '../services/analyticsService';

export function useAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await analyticsService.getOverview();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError('Failed to load analytics overview');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { data, loading, error, refresh: fetchAnalytics };
}
