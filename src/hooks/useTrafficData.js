
import { useState, useEffect, useCallback } from 'react';

const API_ENDPOINT = 'https://services1.arcgis.com/8CpMUd3fdw6aXef7/arcgis/rest/services/Caltrans_Wildfire_Emergency_Road_Closures/FeatureServer/0/query';

/**
 * Hook to fetch traffic data including road closures.
 * @param {object} userLocation - The user's location.
 */
export const useTrafficData = (userLocation) => {
  const [trafficData, setTrafficData] = useState({ roadClosures: [], trafficHotspots: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrafficData = useCallback(async () => {
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
        roadClosures: (data.features || []).map(item => {
          // Validate geometry and path
          if (!item.geometry || !item.geometry.paths || !Array.isArray(item.geometry.paths[0])) {
            return null; // Skip this item if geometry is invalid
          }

          const path = item.geometry.paths[0].map(coord => {
            // Validate each coordinate
            if (!Array.isArray(coord) || coord.length !== 2 || isNaN(coord[0]) || isNaN(coord[1])) {
              return null; // Skip invalid coordinates
            }
            return [coord[1], coord[0]]; // Convert [lng, lat] to [lat, lng]
          }).filter(Boolean); // Remove any null coordinates

          if (path.length < 2) {
            return null; // A valid line needs at least two points
          }

          return {
            id: item.attributes.OBJECTID || Math.random(),
            type: item.attributes.Restriction_Type || 'Unknown',
            severity: 'critical',
            path: path,
            details: item.attributes.Long_Description || 'Road closure due to wildfire'
          };
        }).filter(Boolean), // Remove any null closures
        trafficHotspots: []
      };

      setTrafficData(transformedData);
    } catch (e) {
      console.error('Traffic data fetch error:', e);
      setError(e.message);
      setTrafficData({ roadClosures: [], trafficHotspots: [] }); // Ensure state is not null on error
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  useEffect(() => {
    fetchTrafficData();
  }, [fetchTrafficData]);

  return { trafficData, loading, error, refetch: fetchTrafficData };
};
