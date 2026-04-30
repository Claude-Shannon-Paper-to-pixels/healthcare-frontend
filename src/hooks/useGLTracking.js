import { useCallback, useEffect, useState } from 'react';
import { getGLTrackingByPatient } from '../api/glTracking';

function useGLTracking(patientId, enabled = true) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEntries = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getGLTrackingByPatient(patientId);
      setEntries(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch GL tracking entries');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (!enabled) return;
    fetchEntries();
  }, [enabled, fetchEntries]);

  return { entries, loading, error, refresh: fetchEntries };
}

export default useGLTracking;
