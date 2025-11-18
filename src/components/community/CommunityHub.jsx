/**
 * Community Hub - Updated Interface
 * Now uses the redesigned CommunityReportsHub for better scalability and UX
 */

import CommunityReportsHub from './CommunityReportsHub';
import CaptainMarinaGuide, { marinaMessages } from '../guide/CaptainMarinaGuide';

/**
 * Community Coordination Hub
 * Central hub for community features: reporting, safety check-ins, and coordination
 * Now uses the crisis-optimized interface design
 */
const CommunityHub = ({ userLocation, emergencyLevel }) => {
  return (
    <div className="relative">
      <CommunityReportsHub
        userLocation={userLocation}
        emergencyLevel={emergencyLevel}
      />

      {/* Captain Marina Guide - Community Introduction */}
      <CaptainMarinaGuide
        message={marinaMessages.community.intro.message}
        emotion={marinaMessages.community.intro.emotion}
        position="bottom-right"
        dismissible={true}
        showInitially={true}
      />
    </div>
  );
};

export default CommunityHub;