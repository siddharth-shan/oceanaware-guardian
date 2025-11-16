
import { useState, useEffect, useCallback } from 'react';

const API_ENDPOINT = 'https://services.arcgis.com/BLN4oKB0N1YSgvY8/arcgis/rest/services/Power_Outages_(View)/FeatureServer/0/query';

/**
 * Hook to fetch power outage data.
 * @param {object} userLocation - The user's location.
 */
export const usePowerOutageData = (userLocation) => {
  const [powerOutageData, setPowerOutageData] = useState({ outages: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPowerOutageData = useCallback(async () => {
    if (!userLocation) return;
    
    setLoading(true);
    setError(null);

    try {
      const url = `${API_ENDPOINT}?where=1%3D1&outFields=*&outSR=4326&f=json`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Validate and transform the API response
      const transformedData = {
        outages: (data.features || []).map(item => {
          if (!item.geometry || !item.geometry.rings || !Array.isArray(item.geometry.rings[0])) {
            return null; // Skip invalid items
          }

          const area = item.geometry.rings[0].map(p => {
            if (!Array.isArray(p) || p.length !== 2 || isNaN(p[0]) || isNaN(p[1])) {
              return null; // Skip invalid coordinates
            }
            return [p[1], p[0]]; // Convert [lng, lat] to [lat, lng]
          }).filter(Boolean);

          if (area.length < 3) {
            return null; // A valid polygon needs at least three points
          }

          return {
            id: item.attributes.OBJECTID || Math.random(),
            area: area,
            customersAffected: item.attributes.Customers_Affected || 'Unknown',
            estimatedRestoreTime: item.attributes.Estimated_Restore_Time ? 
              new Date(item.attributes.Estimated_Restore_Time).toISOString() : 
              'Not Available',
            cause: item.attributes.Outage_Cause || 'Unknown'
          };
        }).filter(Boolean)
      };

      setPowerOutageData(transformedData);
    } catch (e) {
      console.error('Power outage data fetch error:', e);
      setError(e.message);
      setPowerOutageData({ outages: [] }); // Ensure state is not null on error
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  useEffect(() => {
    fetchPowerOutageData();
  }, [fetchPowerOutageData]);

  return { powerOutageData, loading, error, refetch: fetchPowerOutageData };
};
