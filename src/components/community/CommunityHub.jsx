/**
 * Community Hub - Updated Interface
 * Now uses the redesigned CommunityReportsHub for better scalability and UX
 */

import CommunityReportsHub from './CommunityReportsHub';

/**
 * Community Coordination Hub
 * Central hub for community features: reporting, safety check-ins, and coordination
 * Now uses the crisis-optimized interface design
 */
const CommunityHub = ({ userLocation, emergencyLevel }) => {
  return (
    <CommunityReportsHub 
      userLocation={userLocation}
      emergencyLevel={emergencyLevel}
    />
  );
};

export default CommunityHub;