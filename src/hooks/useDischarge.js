import { useCallback, useEffect, useState } from 'react';
import { getDischargeByPatient } from '../api/discharge';

function useDischarge(patientId, enabled = true) {
  const [discharge, setDischarge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDischarge = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getDischargeByPatient(patientId);
      setDischarge(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch discharge record');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (!enabled) return;
    fetchDischarge();
  }, [enabled, fetchDischarge]);

  return { discharge, loading, error, refresh: fetchDischarge };
}

export default useDischarge;
