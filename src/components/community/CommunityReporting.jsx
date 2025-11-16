import { useState, useEffect } from 'react';
import { AlertTriangle, Camera, MapPin, Clock, Send, CheckCircle, Users, Flame, RefreshCw } from 'lucide-react';
import { useAuth } from '../../services/auth/AuthContext';
import { communityThemes } from '../../utils/communityThemes';
import { 
  submitCommunityReport, 
  getCommunityReports, 
  verifyCommunityReport,
  checkUserVerification,
  checkBatchUserVerifications,
  ReportTypes, 
  UrgentLevels 
} from '../../services/community/CommunityService';

/**
 * Community Reporting System
 * Enables two-way communication and crowd-sourced safety information
 * Uses trusted data validation to prevent false alarms
 */

// Helper function to get approximate location for better community context
const getApproximateLocation = (location) => {
  if (!location) return 'Unknown Area';
  
  // Use the best available location descriptor
  if (location.displayName && location.displayName !== 'Current Location') {
    return location.displayName;
  }
  if (location.region) return location.region;
  if (location.city && location.state) return `${location.city}, ${location.state}`;
  if (location.city) return `${location.city} Area`;
  if (location.county && location.state) return `${location.county} County, ${location.state}`;
  if (location.county) return `${location.county} County`;
  if (location.state) return `${location.state} Area`;
  
  // Create meaningful coordinate-based description for GPS locations
  if (location.lat && location.lng) {
    // Use more specific regional names for common coordinates
    const lat = location.lat;
    const lng = location.lng;
    
    // California regions
    if (lat >= 32 && lat <= 42 && lng >= -125 && lng <= -114) {
      if (lat >= 37.5 && lat <= 38.0 && lng >= -122.6 && lng <= -122.3) {
        return 'San Francisco Bay Area, CA';
      }
      if (lat >= 34.0 && lat <= 34.3 && lng >= -118.7 && lng <= -118.1) {
        return 'Los Angeles Area, CA';
      }
      if (lat >= 32.5 && lat <= 33.0 && lng >= -117.5 && lng <= -117.0) {
        return 'San Diego Area, CA';
      }
      if (lat >= 33.7 && lat <= 34.1 && lng >= -118.3 && lng <= -117.8) {
        return 'Long Beach/Orange County Area, CA';
      }
      // Generic California location
      const latRounded = Math.round(lat * 10) / 10;
      const lngRounded = Math.round(lng * 10) / 10;
      return `California Area (${latRounded}, ${lngRounded})`;
    }
    
    // Generic coordinate description for other areas
    const latRounded = Math.round(lat * 10) / 10;
    const lngRounded = Math.round(lng * 10) / 10;
    return `Area near ${latRounded}, ${lngRounded}`;
  }
  
  return 'Unknown Area';
};

const CommunityReporting = ({ userLocation, preFilteredReports, emergencyLevel, emergencyConfig, onReportsUpdate }) => {
  const { user, isAuthenticated } = useAuth();
  const [reports, setReports] = useState([]);
  const [userVerifications, setUserVerifications] = useState(new Map()); // Changed to Map to store verification status
  const [newReport, setNewReport] = useState({
    type: '',
    title: '',
    description: '',
    location: userLocation || null,
    urgentLevel: 'normal'
  });
  const [showReportForm, setShowReportForm] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verifyingReports, setVerifyingReports] = useState(new Set());

  const reportTypes = [
    {
      id: ReportTypes.FIRE_SPOTTING,
      label: 'Fire Spotting',
      icon: Flame,
      theme: communityThemes.emergency.primary,
      description: 'Report visible fire or smoke',
      urgentLevel: 'critical'
    },
    {
      id: ReportTypes.POWER_LINE_DOWN,
      label: 'Power Line Down',
      icon: AlertTriangle,
      theme: communityThemes.emergency.primary,
      description: 'Downed power lines or electrical hazards',
      urgentLevel: 'high'
    },
    {
      id: ReportTypes.ROAD_CLOSURE,
      label: 'Road Closure',
      icon: MapPin,
      theme: communityThemes.reporting.primary,
      description: 'Blocked or unsafe roads',
      urgentLevel: 'normal'
    },
    {
      id: ReportTypes.NEED_EVAC_HELP,
      label: 'Need Evacuation Help',
      icon: Users,
      theme: communityThemes.emergency.primary,
      description: 'Request assistance with evacuation',
      urgentLevel: 'critical'
    },
    {
      id: ReportTypes.OFFER_HELP,
      label: 'Offer Help',
      icon: CheckCircle,
      theme: communityThemes.community.primary,
      description: 'Volunteer assistance available',
      urgentLevel: 'low'
    },
    {
      id: ReportTypes.UNSAFE_CONDITIONS,
      label: 'Unsafe Conditions',
      icon: AlertTriangle,
      theme: communityThemes.emergency.primary,
      description: 'Report dangerous environmental conditions',
      urgentLevel: 'high'
    }
  ];

  // Load community reports from Cosmos DB or use prefiltered reports
  useEffect(() => {
    if (preFilteredReports && preFilteredReports.length > 0) {
      // Handle both individual reports and clustered reports
      const expandedReports = [];
      preFilteredReports.forEach(item => {
        if (item && typeof item === 'object') {
          if (item.isCluster && item.reports && item.reports.length > 0) {
            // Add all individual reports from cluster
            expandedReports.push(...item.reports);
          } else if (!item.isCluster && item.id) {
            // Add individual report (this handles reports from CommunityReportsHub filteredReports)
            expandedReports.push(item);
          } else if (item.id) {
            // Handle direct report objects (from filteredReports array)
            expandedReports.push(item);
          }
        }
      });
      
      console.log(`📊 Modal received ${preFilteredReports.length} items, expanded to ${expandedReports.length} individual reports`);
      setReports(expandedReports);
      loadUserVerifications(expandedReports);
    } else {
      // Load fresh reports if no prefiltered reports available
      console.log('📊 Modal loading fresh reports (no prefiltered data)');
      loadCommunityReports();
    }
  }, [userLocation, preFilteredReports]); // Watch for changes in prefiltered reports

  // Helper function to load user verification status (optimized)
  const loadUserVerifications = async (reportsList) => {
    if (isAuthenticated() && reportsList.length > 0) {
      try {
        console.log(`🔍 Loading verification status for ${reportsList.length} reports...`);
        
        // Use batch verification function for better performance
        const reportIds = reportsList.map(report => report.id);
        const verificationMap = await checkBatchUserVerifications(user, reportIds);
        
        // Ensure all reports have verification status, even if batch failed
        reportsList.forEach(report => {
          if (!verificationMap.has(report.id)) {
            verificationMap.set(report.id, {
              hasVerified: false,
              isOriginalAuthor: false,
              canVerify: true // Default to allowing verification
            });
          }
        });
        
        setUserVerifications(verificationMap);
      } catch (error) {
        console.error('Failed to load user verifications:', error);
      }
    }
  };

  const loadCommunityReports = async () => {
    if (!userLocation) return;

    setLoading(true);
    try {
      const result = await getCommunityReports(userLocation);
      if (result.success !== false) {
        const rawReports = result.reports || [];
        
        // Expand clustered reports to show individual reports
        const expandedReports = [];
        rawReports.forEach(item => {
          if (item.isCluster && item.reports && item.reports.length > 0) {
            // Add all individual reports from cluster
            expandedReports.push(...item.reports);
          } else if (!item.isCluster) {
            // Add individual report
            expandedReports.push(item);
          }
        });
        
        console.log(`Loaded ${rawReports.length} items, expanded to ${expandedReports.length} individual reports`);
        setReports(expandedReports);
        
        // Load user verification status for each report (only if authenticated)
        await loadUserVerifications(expandedReports);
      }
    } catch (error) {
      console.error('Failed to load community reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!newReport.type || !newReport.description) return;

    setSubmitting(true);
    
    // Handle anonymous authentication seamlessly in background
    let currentUser = user;
    if (!isAuthenticated()) {
      try {
        // Automatically sign in anonymously for hazard reporting
        console.log('🚨 Emergency report - creating anonymous session...');
        const { signInAnonymousUser } = await import('../../services/auth/firebase');
        const authResult = await signInAnonymousUser();
        
        if (!authResult.success) {
          throw new Error('Failed to create anonymous session');
        }
        
        currentUser = authResult.user;
        console.log('✅ Anonymous session created for emergency reporting');
      } catch (authError) {
        console.error('❌ Anonymous auth failed:', authError);
        alert('Unable to submit report right now. Please try again or call 911 for emergencies.');
        setSubmitting(false);
        return;
      }
    }
    
    try {
      // Process location data to ensure proper region field for backend
      const processedLocation = {
        ...userLocation,
        region: getApproximateLocation(userLocation)
      };
      
      const result = await submitCommunityReport(currentUser, {
        type: newReport.type,
        title: newReport.title || `${getReportTypeConfig(newReport.type)?.label} Report`,
        description: newReport.description,
        location: processedLocation,
        urgentLevel: newReport.urgentLevel
      }, true);

      if (result.success !== false) {
        // Clear form and reload reports
        setNewReport({ 
          type: '', 
          title: '', 
          description: '', 
          location: userLocation, 
          urgentLevel: 'normal' 
        });
        setShowReportForm(false);
        
        // Reload reports to show the new one or notify parent to refresh
        if (onReportsUpdate) {
          // Let parent component handle the refresh (for filtered reports)
          onReportsUpdate();
        } else {
          // Fallback to local refresh
          await loadCommunityReports();
        }
        
        // Show success message
        alert('Report submitted successfully! Emergency services will be notified if urgent.');
      } else {
        throw new Error(result.error || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert(`Failed to submit report: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getReportTypeConfig = (typeId) => {
    return reportTypes.find(t => t.id === typeId);
  };

  const handleVerifyReport = async (reportId) => {
    // Handle anonymous authentication seamlessly for verification
    let currentUser = user;
    if (!isAuthenticated()) {
      try {
        console.log('🚨 Report verification - creating anonymous session...');
        const { signInAnonymousUser } = await import('../../services/auth/firebase');
        const authResult = await signInAnonymousUser();
        
        if (!authResult.success) {
          throw new Error('Failed to create anonymous session');
        }
        
        currentUser = authResult.user;
        console.log('✅ Anonymous session created for report verification');
      } catch (authError) {
        console.error('❌ Anonymous auth failed:', authError);
        alert('Unable to verify report right now. Please try again.');
        return;
      }
    }

    const verificationStatus = userVerifications.get(reportId);
    
    // Check if user is the original author
    if (verificationStatus?.isOriginalAuthor) {
      alert('You cannot verify your own report.');
      return;
    }

    // Check if user has already verified this report
    if (verificationStatus?.hasVerified) {
      alert('You have already verified this report.');
      return;
    }

    // Check if user can verify (additional safety check)
    if (!verificationStatus?.canVerify) {
      alert('You cannot verify this report.');
      return;
    }

    setVerifyingReports(prev => new Set([...prev, reportId]));

    try {
      const result = await verifyCommunityReport(currentUser, reportId, '', userLocation);
      if (result.success !== false) {
        // Update verification status immediately for UI responsiveness
        setUserVerifications(prev => {
          const newMap = new Map(prev);
          newMap.set(reportId, {
            hasVerified: true,
            isOriginalAuthor: verificationStatus?.isOriginalAuthor || false,
            canVerify: false
          });
          return newMap;
        });
        
        // Reload reports to show updated verification count
        if (onReportsUpdate) {
          // Let parent component handle the refresh (for filtered reports)
          onReportsUpdate();
        } else {
          // Fallback to local refresh
          await loadCommunityReports();
        }
        alert('Report verification recorded! Thank you for helping validate community information.');
      } else {
        throw new Error(result.error || 'Failed to verify report');
      }
    } catch (error) {
      console.error('Failed to verify report:', error);
      alert(`Failed to verify report: ${error.message}`);
    } finally {
      setVerifyingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'active': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6" data-testid="community-reporting">
      {/* Consolidated Hazard Reporting and Active Reports */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
              Hazard Reporting & Active Reports
            </h2>
            <p className="text-gray-600 text-sm">
              Report new hazards or view community reports
            </p>
          </div>
        </div>

        {/* Emergency Notice */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800 text-sm font-semibold">
              🚨 For life-threatening emergencies, call 911 immediately
            </span>
          </div>
        </div>

        {/* Emergency Reporting Notice */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <span className="text-blue-800 text-sm font-semibold block">
                🚨 Emergency Hazard Reporting
              </span>
              <span className="text-blue-700 text-sm">
                Report hazards immediately to help your community stay safe. No registration required.
              </span>
            </div>
          </div>
        </div>
        
        {/* Report Form - Always Available */}
        {showReportForm && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border" data-testid="report-form">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Report New Hazard</h3>
              <button
                type="button"
                onClick={() => setShowReportForm(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close report form"
                title="Close form"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmitReport} className="space-y-4">
              {/* Report Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type of Issue *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {reportTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setNewReport(prev => ({ 
                        ...prev, 
                        type: type.id,
                        urgentLevel: type.urgentLevel 
                      }))}
                      data-testid={`report-type-${type.id}`}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                        newReport.type === type.id
                          ? `${type.theme.border.replace('border-', 'border-')} ${type.theme.background}`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <type.icon className={`h-5 w-5 ${type.theme.iconColor}`} />
                        <div>
                          <div className="font-semibold text-gray-800">{type.label}</div>
                          <div className="text-sm text-gray-600">{type.description}</div>
                          {(type.urgentLevel === 'critical' || type.urgentLevel === 'high') && (
                            <span className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium mt-1">
                              {(type.urgentLevel || 'urgent').toString().toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={newReport.description}
                  onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide clear details about what you observed..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required
                  data-testid="report-description"
                />
              </div>

              {/* Location Display */}
              {userLocation && (
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    Location: {userLocation.displayName || getApproximateLocation(userLocation)}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={!newReport.type || !newReport.description || submitting}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
                  data-testid="submit-report-button"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Submitting Report...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Hazard Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {!showReportForm && (
          <div className="text-center mb-6">
            <button
              onClick={() => setShowReportForm(true)}
              className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-all duration-200 flex items-center space-x-2 mx-auto shadow-lg"
              data-testid="report-hazard-button"
              aria-label="Report New Hazard"
            >
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">Report New Hazard</span>
            </button>
          </div>
        )}

        {/* Active Reports Section */}
        <div data-testid="recent-reports">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Active Community Reports</h3>
              {preFilteredReports && preFilteredReports.length > 0 && (
                <p className="text-sm text-gray-600">Showing filtered reports from main page • {reports.length} reports</p>
              )}
            </div>
            <button
              onClick={loadCommunityReports}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh reports"
              data-testid="refresh-reports-button"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm">{loading ? 'Updating...' : 'Refresh'}</span>
            </button>
          </div>
          
          {reports.length === 0 ? (
            <div className="text-center py-8" data-testid="no-reports-message">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recent reports in your area</p>
              <p className="text-gray-500 text-sm">Be the first to help your community stay informed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => {
                const typeConfig = getReportTypeConfig(report.type);
                const IconComponent = typeConfig?.icon || AlertTriangle;
                
                return (
                  <div key={report.id} className={`border rounded-lg p-4 ${
                    (report.urgentLevel === 'critical' || report.urgentLevel === 'high') ? 'border-red-200 bg-red-50' : 'border-gray-200'
                  }`} data-testid="report-item">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-full ${
                        (report.urgentLevel === 'critical' || report.urgentLevel === 'high') ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        <IconComponent className={`h-5 w-5 ${
                          (report.urgentLevel === 'critical' || report.urgentLevel === 'high') ? 'text-red-600' : 'text-blue-600'
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-gray-800" data-testid="report-type">
                              {typeConfig?.label || report.type}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                              {(report.status || 'unknown').toString().toUpperCase()}
                            </span>
                            {(report.urgentLevel === 'critical' || report.urgentLevel === 'high') && (
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                                {(report.urgentLevel || 'urgent').toString().toUpperCase()}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center text-xs text-gray-500" data-testid="report-timestamp">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(report.timestamp).toLocaleString([], { 
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-2" data-testid="report-description">{report.description}</p>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-600" data-testid="report-location">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span className="font-medium">
                              {getApproximateLocation(report.location)}
                            </span>
                            {report.location && report.location.lat && report.location.lng && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                📍 {Math.abs(report.location.lat).toFixed(1)}°{report.location.lat >= 0 ? 'N' : 'S'}, {Math.abs(report.location.lng).toFixed(1)}°{report.location.lng >= 0 ? 'E' : 'W'}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="text-gray-500 text-xs" data-testid="verification-count">
                              {report.verificationCount || 0} verifications
                            </div>
                            
                            {(() => {
                              const verificationStatus = userVerifications.get(report.id);
                              const isVerifying = verifyingReports.has(report.id);
                              
                              // Don't show verify button for original author
                              if (verificationStatus?.isOriginalAuthor) {
                                return (
                                  <span className="text-xs text-gray-500" data-testid="author-badge">
                                    Your Report
                                  </span>
                                );
                              }
                              
                              // Show verify button for others
                              return (
                                <button
                                  onClick={() => handleVerifyReport(report.id)}
                                  disabled={!verificationStatus?.canVerify || isVerifying}
                                  className={`text-xs font-medium transition-colors ${
                                    verificationStatus?.hasVerified
                                      ? 'text-green-600 cursor-not-allowed disabled:cursor-not-allowed'
                                      : verificationStatus?.canVerify && !isVerifying
                                      ? 'text-blue-600 hover:text-blue-800 hover:underline cursor-pointer'
                                      : 'text-gray-400 cursor-not-allowed disabled:cursor-not-allowed opacity-50'
                                  }`}
                                  style={{
                                    cursor: (!verificationStatus?.canVerify || verificationStatus?.hasVerified || isVerifying) 
                                      ? 'not-allowed' 
                                      : 'pointer'
                                  }}
                                  data-testid="verify-button"
                                  title={
                                    verificationStatus?.hasVerified 
                                      ? 'You have already verified this report'
                                      : verificationStatus?.canVerify
                                      ? 'Verify this report'
                                      : 'Cannot verify this report'
                                  }
                                >
                                  {isVerifying ? (
                                    <div className="flex items-center space-x-1">
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                      <span>Verifying...</span>
                                    </div>
                                  ) : verificationStatus?.hasVerified ? (
                                    '✅ Verified'
                                  ) : (
                                    '✅ Verify'
                                  )}
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Community Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">📋 Community Reporting Guidelines</h4>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Report only verified information you directly observed</li>
          <li>• **Call 911 immediately** for life-threatening emergencies</li>
          <li>• Be specific about location and time details</li>
          <li>• Reports are automatically anonymized for your safety</li>
          <li>• Your reports help first responders and neighbors stay safe</li>
          <li>• False reports may delay emergency response - report responsibly</li>
        </ul>
      </div>
    </div>
  );
};

export default CommunityReporting;