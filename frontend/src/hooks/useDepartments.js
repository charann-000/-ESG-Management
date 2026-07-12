import { useState, useEffect, useCallback } from 'react';
import departmentService from '../services/departmentService';

export function useDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await departmentService.getDepartments();
      if (response.success && response.data) {
        setDepartments(response.data);
      } else {
        setError('Failed to retrieve departments');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching departments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return { departments, loading, error, refresh: fetchDepartments };
}
