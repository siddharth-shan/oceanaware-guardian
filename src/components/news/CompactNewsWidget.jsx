import { useState, useEffect } from 'react';
import { Clock, Flame, ExternalLink, ChevronRight } from 'lucide-react';

/**
 * Compact News Widget - Optimized for dashboard space efficiency
 * Features:
 * - Horizontal layout for news items
 * - Reduced vertical footprint
 * - Quick priority filtering
 * - Expandable for full view
 */
const CompactNewsWidget = ({ userLocation }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreNews, setHasMoreNews] = useState(true);
  const [totalAvailable, setTotalAvailable] = useState(0);

  // Fetch news data with pagination support

  // Helper function to get source icons
  const getSourceIcon = (source) => {
    const icons = {
      'CAL FIRE': 'https://www.fire.ca.gov/favicon.ico',
      'National Weather Service': 'https://www.weather.gov/favicon.ico',
      'Air Quality District': 'https://www.aqmd.gov/favicon.ico',
      'American Red Cross': 'https://www.redcross.org/favicon.ico',
      'US Forest Service': 'https://www.fs.usda.gov/favicon.ico',
      'Weather Channel': 'https://weather.com/favicon.ico',
      'LA Times': 'https://www.latimes.com/favicon.ico',
      'Emergency Management': 'https://emergency.gov/favicon.ico'
    };
    return icons[source] || '/icons/favicon.png';
  };

  // Helper function to determine source credibility tier
  const getSourceTier = (source) => {
    const officialSources = [
      'CAL FIRE', 'National Weather Service', 'US Forest Service', 'Emergency Management',
      'Air Quality District', 'FEMA', 'California Office of Emergency Services',
      'San Bernardino Fire', 'Riverside County Fire', 'Los Angeles Fire Department',
      'Orange County Fire Authority', 'CAL FIRE Riverside', 'Public Health Department',
      'California Department of Public Health', 'American Red Cross'
    ];
    
    const traditionalMedia = [
      'LA Times', 'CNN', 'ABC News', 'CBS News', 'NBC News', 'Fox News',
      'Associated Press', 'Reuters', 'Wall Street Journal', 'New York Times',
      'Washington Post', 'USA Today', 'Weather Channel', 'Local News',
      'Insurance Journal', 'Climate Research Institute'
    ];
    
    const socialMedia = [
      'Twitter', 'Facebook', 'Instagram', 'TikTok', 'YouTube', 'Reddit',
      'Snapchat', 'LinkedIn'
    ];
    
    const sourceLower = source.toLowerCase();
    
    // Check for official sources (tier 1 - highest priority)
    if (officialSources.some(official => sourceLower.includes(official.toLowerCase()))) {
      return 1;
    }
    
    // Check for traditional media (tier 2)
    if (traditionalMedia.some(media => sourceLower.includes(media.toLowerCase()))) {
      return 2;
    }
    
    // Check for social media (tier 3 - lowest priority)
    if (socialMedia.some(social => sourceLower.includes(social.toLowerCase()))) {
      return 3;
    }
    
    // Unknown sources default to tier 2 (between official and social media)
    return 2;
  };

  // Helper function to determine priority from category
  const getPriorityFromCategory = (category) => {
    const priorities = {
      'evacuation': 'high',
      'new_fire': 'high',
      'warning': 'medium',
      'air_quality': 'medium',
      'containment': 'medium',
      'general': 'low'
    };
    return priorities[category] || 'low';
  };

  // Enhanced deduplication function to remove duplicate news articles
  const deduplicateNews = (articles) => {
    const seen = new Map();
    const deduplicated = [];
    
    articles.forEach(article => {
      // Create multiple fingerprints for better deduplication
      const titleWords = article.title
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(' ')
        .filter(word => word.length > 2)
        .sort();
      
      // Primary fingerprint: core words from title
      const primaryFingerprint = titleWords
        .filter(word => !['the', 'and', 'for', 'with', 'from', 'near', 'fire'].includes(word))
        .slice(0, 4)
        .join(' ');
      
      // Secondary fingerprint: URL-based (if available)
      const urlFingerprint = article.url ? 
        article.url.split('/').pop()?.replace(/[^\w]/g, '') : 
        null;
      
      // Tertiary fingerprint: exact title match
      const exactTitleFingerprint = article.title.toLowerCase().trim();
      
      // Check if we've seen this article before using any fingerprint
      const isDuplicate = seen.has(primaryFingerprint) || 
                         (urlFingerprint && seen.has(urlFingerprint)) ||
                         seen.has(exactTitleFingerprint);
      
      if (!isDuplicate) {
        // Mark all fingerprints as seen
        seen.set(primaryFingerprint, true);
        if (urlFingerprint) seen.set(urlFingerprint, true);
        seen.set(exactTitleFingerprint, true);
        
        deduplicated.push(article);
      }
    });
    
    return deduplicated;
  };

  const fetchNewsData = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const limit = 10; // Fetch 10 articles per page
      const offset = (page - 1) * limit;
      
      const newsResponse = await fetch(`/api/news/enhanced/fire-related?lat=${userLocation.lat}&lng=${userLocation.lng}&location=${encodeURIComponent(userLocation.displayName)}&state=${userLocation.state || 'California'}&limit=${limit}&offset=${offset}`);

      if (!newsResponse.ok) {
        throw new Error(`News API error: ${newsResponse.status}`);
      }

      const newsData = await newsResponse.json();
      
      // Process articles to add icons (no placeholder images)
      let processedArticles = (newsData.articles || []).map(article => ({
        ...article,
        // Only use real images from the article, no placeholders
        image: article.image || article.urlToImage || null,
        // Add source icon
        sourceIcon: getSourceIcon(article.source),
        // Map fields for consistency
        id: article.id,
        title: article.title,
        summary: article.description || article.summary,
        timestamp: article.publishedAt || article.timestamp,
        url: article.url,
        trusted: article.trusted !== false, // Default to true unless explicitly false
        category: article.category || 'general',
        priority: article.priority || getPriorityFromCategory(article.category)
      }));
      
      // Client-side deduplication to ensure no duplicates reach the UI
      processedArticles = deduplicateNews(processedArticles);
      
      if (append) {
        setNews(prev => {
          // Combine existing and new articles, then deduplicate the entire list
          const combined = [...prev, ...processedArticles];
          return deduplicateNews(combined);
        });
      } else {
        setNews(processedArticles);
      }
      
      setTotalAvailable(newsData.metadata?.totalFetched || newsData.totalFetched || processedArticles.length);
      
      // Check if there are more articles to load
      const currentTotal = append ? news.length + processedArticles.length : processedArticles.length;
      setHasMoreNews(processedArticles.length === limit && currentTotal < (newsData.metadata?.totalFetched || 100));
      setLastUpdate(new Date());
      } catch (err) {
        console.error('News fetch error:', err);
        setError(err.message);
        
        // Enhanced fallback data for demo (no mock images)
        const demoPage1 = [
          {
            id: 'demo-1',
            title: 'Fire Weather Watch Issued for Southern California',
            summary: 'National Weather Service issues red flag warning due to high winds and low humidity conditions expected through the weekend.',
            category: 'warning',
            priority: 'high',
            trusted: true,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            source: 'CAL FIRE',
            sourceIcon: 'https://www.fire.ca.gov/favicon.ico',
            image: null,
            url: 'https://www.fire.ca.gov/incidents/'
          },
          {
            id: 'demo-2',
            title: 'Containment Progress on Lake Fire Reaches 85%',
            summary: 'Firefighters making significant progress on the 489-acre blaze near Silverwood Lake with improved weather conditions.',
            category: 'containment',
            priority: 'medium',
            trusted: true,
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            source: 'San Bernardino Fire',
            sourceIcon: 'https://www.fire.ca.gov/favicon.ico',
            image: null,
            url: 'https://www.fire.ca.gov/incidents/'
          },
          {
            id: 'demo-3',
            title: 'Air Quality Alert Extended Through Weekend',
            summary: 'Smoke from multiple fires continues to impact air quality across the region, residents advised to stay indoors.',
            category: 'air_quality',
            priority: 'medium',
            trusted: true,
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            source: 'Air Quality District',
            sourceIcon: 'https://www.aqmd.gov/favicon.ico',
            image: null,
            url: 'https://www.aqmd.gov/'
          },
          {
            id: 'demo-4',
            title: 'Sage Fire Near Moreno Valley Prompts Evacuations',
            summary: 'Emergency crews responding to new wildfire threat as residents in affected areas ordered to evacuate immediately.',
            category: 'evacuation',
            priority: 'high',
            trusted: true,
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            source: 'Riverside County Fire',
            sourceIcon: 'https://www.fire.ca.gov/favicon.ico',
            image: null,
            url: 'https://www.fire.ca.gov/incidents/'
          },
          {
            id: 'demo-5',
            title: 'Wolf Fire Reaches 2,387 Acres, 80% Contained',
            summary: 'Massive wildfire in Riverside County showing signs of control as containment efforts prove successful.',
            category: 'containment',
            priority: 'medium',
            trusted: true,
            timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
            source: 'CAL FIRE Riverside',
            sourceIcon: 'https://www.fire.ca.gov/favicon.ico',
            image: null,
            url: 'https://www.fire.ca.gov/incidents/'
          },
          {
            id: 'demo-6',
            title: 'Red Flag Warning: Critical Fire Weather Conditions',
            summary: 'Extreme fire weather conditions with gusty winds and low humidity creating dangerous fire conditions statewide.',
            category: 'warning',
            priority: 'high',
            trusted: true,
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            source: 'National Weather Service',
            sourceIcon: 'https://www.weather.gov/favicon.ico',
            image: null,
            url: 'https://www.weather.gov/'
          },
          {
            id: 'demo-7',
            title: 'Power Shutoffs Planned for High-Risk Areas',
            summary: 'Utility companies implementing precautionary power shutoffs to prevent equipment-related fire starts.',
            category: 'warning',
            priority: 'medium',
            trusted: true,
            timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
            source: 'Southern California Edison',
            sourceIcon: 'https://www.sce.com/favicon.ico',
            image: null,
            url: 'https://www.sce.com/'
          },
          {
            id: 'demo-8',
            title: 'Firefighting Aircraft Deployed Statewide',
            summary: 'Cal Fire increases aerial firefighting resources with additional aircraft positioned throughout California.',
            category: 'general',
            priority: 'medium',
            trusted: true,
            timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
            source: 'CAL FIRE',
            sourceIcon: 'https://www.fire.ca.gov/favicon.ico',
            image: null,
            url: 'https://www.fire.ca.gov/'
          },
          {
            id: 'demo-9',
            title: 'Emergency Shelters Open for Fire Evacuees',
            summary: 'Red Cross opens multiple emergency shelters to accommodate residents displaced by ongoing wildfires.',
            category: 'evacuation',
            priority: 'medium',
            trusted: true,
            timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
            source: 'American Red Cross',
            sourceIcon: 'https://www.redcross.org/favicon.ico',
            image: null,
            url: 'https://www.redcross.org/'
          },
          {
            id: 'demo-10',
            title: 'Smoke Advisory Issued for Inland Areas',
            summary: 'Health officials warn of poor air quality due to wildfire smoke affecting visibility and respiratory health.',
            category: 'air_quality',
            priority: 'medium',
            trusted: true,
            timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
            source: 'Public Health Department',
            sourceIcon: 'https://www.cdph.ca.gov/favicon.ico',
            image: null,
            url: 'https://www.cdph.ca.gov/'
          }
        ];

        const demoPage2 = [
          {
            id: 'demo-11',
            title: 'Firefighters Battle New Blaze in Angeles National Forest',
            summary: 'Crews working to contain 150-acre fire threatening hiking trails and campgrounds in popular recreation area.',
            category: 'new_fire',
            priority: 'high',
            trusted: true,
            timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
            source: 'US Forest Service',
            sourceIcon: 'https://www.fs.usda.gov/favicon.ico',
            image: null,
            url: 'https://www.fs.usda.gov/'
          },
          {
            id: 'demo-12',
            title: 'Heat Wave Increases Fire Risk Across Region',
            summary: 'Triple-digit temperatures expected to persist through midweek, elevating wildfire danger levels significantly.',
            category: 'warning',
            priority: 'medium',
            trusted: true,
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            source: 'Weather Channel',
            sourceIcon: 'https://weather.com/favicon.ico',
            image: null,
            url: 'https://weather.com/'
          },
          {
            id: 'demo-13',
            title: 'Firefighter Resources Stretched as Multiple Fires Burn',
            summary: 'State officials calling for additional support as fire departments respond to simultaneous incidents statewide.',
            category: 'general',
            priority: 'medium',
            trusted: true,
            timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
            source: 'LA Times',
            sourceIcon: 'https://www.latimes.com/favicon.ico',
            image: null,
            url: 'https://www.latimes.com/'
          },
          {
            id: 'demo-14',
            title: 'Community Fire Safety Programs Expand Statewide',
            summary: 'New initiative provides homeowners with free fire safety assessments and defensible space guidelines.',
            category: 'general',
            priority: 'low',
            trusted: true,
            timestamp: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
            source: 'Fire Safe Council',
            sourceIcon: 'https://www.firesafecouncil.org/favicon.ico',
            image: null,
            url: 'https://www.firesafecouncil.org/'
          },
          {
            id: 'demo-15',
            title: 'Insurance Companies Update Wildfire Coverage Policies',
            summary: 'New regulations require enhanced coverage for homes in high-risk fire zones throughout California.',
            category: 'general',
            priority: 'low',
            trusted: true,
            timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
            source: 'Insurance Journal',
            sourceIcon: 'https://www.insurancejournal.com/favicon.ico',
            image: null,
            url: 'https://www.insurancejournal.com/'
          },
          {
            id: 'demo-16',
            title: 'Drone Technology Enhances Fire Detection Capabilities',
            summary: 'CAL FIRE deploys advanced drone fleet for early wildfire detection and rapid response coordination.',
            category: 'general',
            priority: 'medium',
            trusted: true,
            timestamp: new Date(Date.now() - 32 * 60 * 60 * 1000).toISOString(),
            source: 'Tech Fire News',
            sourceIcon: 'https://techfirenews.com/favicon.ico',
            image: null,
            url: 'https://techfirenews.com/'
          },
          {
            id: 'demo-17',
            title: 'Prescribed Burns Reduce Future Fire Risk',
            summary: 'Controlled burning operations remove dangerous fuel loads from forest areas before fire season peaks.',
            category: 'general',
            priority: 'medium',
            trusted: true,
            timestamp: new Date(Date.now() - 34 * 60 * 60 * 1000).toISOString(),
            source: 'Forest Management',
            sourceIcon: 'https://forestmanagement.org/favicon.ico',
            image: null,
            url: 'https://forestmanagement.org/'
          },
          {
            id: 'demo-18',
            title: 'Climate Change Increases Fire Season Length',
            summary: 'New research shows fire season extending by 60+ days compared to historical averages, requiring adaptive strategies.',
            category: 'general',
            priority: 'medium',
            trusted: true,
            timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
            source: 'Climate Research Institute',
            sourceIcon: 'https://climateresearch.org/favicon.ico',
            image: null,
            url: 'https://climateresearch.org/'
          },
          {
            id: 'demo-19',
            title: 'Water-Dropping Aircraft Fleet Expands Operations',
            summary: 'Additional helicopter and fixed-wing aircraft join firefighting fleet to increase aerial suppression capacity.',
            category: 'general',
            priority: 'medium',
            trusted: true,
            timestamp: new Date(Date.now() - 38 * 60 * 60 * 1000).toISOString(),
            source: 'Aviation Fire Service',
            sourceIcon: 'https://aviationfire.com/favicon.ico',
            image: null,
            url: 'https://aviationfire.com/'
          },
          {
            id: 'demo-20',
            title: 'Emergency Communication Systems Upgraded',
            summary: 'Enhanced alert systems provide faster notifications to residents in fire-prone areas through multiple channels.',
            category: 'general',
            priority: 'low',
            trusted: true,
            timestamp: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(),
            source: 'Emergency Management',
            sourceIcon: 'https://emergency.gov/favicon.ico',
            image: null,
            url: 'https://emergency.gov/'
          }
        ];

        if (append && page > 1) {
          // Append new articles to existing ones
          setNews(prev => [...prev, ...demoPage2]);
          setHasMoreNews(false); // No more pages after page 2
          setTotalAvailable(20); // Total demo articles available (10 + 10)
        } else {
          // Initial load - set first page
          setNews(demoPage1);
          setHasMoreNews(true); // More pages available
          setTotalAvailable(20); // Total demo articles available (10 + 10)
        }
        setLastUpdate(new Date());
      } finally {
        if (page === 1) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    };

    // Function to load more news
    const loadMoreNews = async () => {
      if (!hasMoreNews || loadingMore) {
        console.log('Cannot load more:', { hasMoreNews, loadingMore });
        return;
      }
      
      console.log('Loading more news, current page:', currentPage, 'next page:', currentPage + 1);
      const nextPage = currentPage + 1;
      await fetchNewsData(nextPage, true);
      setCurrentPage(nextPage);
    };

    // Initial fetch
    useEffect(() => {
      if (!userLocation) return;
      
      fetchNewsData(1, false);
      setCurrentPage(1);

      // Auto-refresh every 10 minutes (only first page)
      const interval = setInterval(() => fetchNewsData(1, false), 10 * 60 * 1000);
      return () => clearInterval(interval);
    }, [userLocation]);

  // Sort news by source tier, then priority, then timestamp
  const sortedNews = news.sort((a, b) => {
    // First, sort by source tier (official sources first)
    const aSourceTier = getSourceTier(a.source);
    const bSourceTier = getSourceTier(b.source);
    
    if (aSourceTier !== bSourceTier) {
      return aSourceTier - bSourceTier; // Lower tier number = higher priority
    }
    
    // If same source tier, sort by priority: high > medium > low
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    const aPriority = priorityOrder[a.priority] || 1;
    const bPriority = priorityOrder[b.priority] || 1;
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority; // Higher priority first
    }
    
    // If same source tier and priority, sort by timestamp (newest first)
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  // Show either top 5 for compact view, or all loaded articles for expanded view
  const displayNews = showAll ? sortedNews : sortedNews.slice(0, 5);

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Now';
    
    const now = new Date();
    const date = new Date(timestamp);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d`;
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'evacuation': '🚨',
      'new_fire': '🔥',
      'warning': '⚠️',
      'air_quality': '💨',
      'containment': '✅',
      'general': '📰'
    };
    return icons[category] || icons.general;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'evacuation': 'text-red-600 bg-red-50 border-red-200',
      'new_fire': 'text-orange-600 bg-orange-50 border-orange-200',
      'warning': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'air_quality': 'text-purple-600 bg-purple-50 border-purple-200',
      'containment': 'text-green-600 bg-green-50 border-green-200',
      'general': 'text-gray-600 bg-gray-50 border-gray-200'
    };
    return colors[category] || colors.general;
  };

  if (loading && news.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Flame className="h-5 w-5 mr-2 text-orange-600" />
            Fire News
          </h3>
        </div>
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
          <span className="ml-2 text-gray-600 text-sm">Loading news...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-fit">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <Flame className="h-5 w-5 mr-2 text-orange-600" />
          Fire News
          {sortedNews.filter(a => a.priority === 'high').length > 0 && (
            <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
              {sortedNews.filter(a => a.priority === 'high').length} priority
            </span>
          )}
          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {showAll ? sortedNews.length : Math.min(sortedNews.length, 5)}/{totalAvailable}
          </span>
        </h3>
        <div className="flex items-center space-x-2">
          {lastUpdate && (
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              {formatTimeAgo(lastUpdate.toISOString())}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          Using demo data - {error}
        </div>
      )}

      {/* Scrollable News List */}
      <div className={`space-y-2 ${showAll ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
        {displayNews.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            No recent fire news for your area
          </div>
        ) : (
          displayNews.map((article, index) => (
            <article 
              key={article.id || index}
              onClick={() => article.url && window.open(article.url, '_blank')}
              className={`border border-gray-200 rounded-lg p-3 transition-all duration-200 ${
                article.url 
                  ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm' 
                  : 'cursor-default hover:bg-gray-50'
              }`}
            >
              <div className="flex space-x-3">
                {/* Article Image - Only show if real image exists */}
                {article.image && (
                  <div className="flex-shrink-0">
                    <img 
                      src={article.image}
                      alt={article.title}
                      className="w-16 h-16 rounded-lg object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  {/* Category Badge and Time */}
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getCategoryColor(article.category)}`}>
                      {getCategoryIcon(article.category)} {article.category?.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">{formatTimeAgo(article.timestamp)}</span>
                    {article.priority === 'high' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                        HIGH
                      </span>
                    )}
                  </div>
                  
                  {/* Title */}
                  <h4 className={`text-sm font-medium mb-2 leading-tight ${
                    article.url ? 'text-blue-900 hover:text-blue-700' : 'text-gray-900'
                  }`}>
                    {article.title}
                  </h4>
                  
                  {/* Summary */}
                  {article.summary && (
                    <p className="text-xs text-gray-600 leading-relaxed mb-2 line-clamp-2">
                      {article.summary}
                    </p>
                  )}
                  
                  {/* Source with Icon and Trust Indicator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {/* Source Icon */}
                      {article.sourceIcon && (
                        <img 
                          src={article.sourceIcon}
                          alt={`${article.source} icon`}
                          className="w-4 h-4 rounded"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <span className="text-xs text-gray-500 flex items-center">
                        <span className="font-medium">{article.source}</span>
                        {/* Source Tier Indicator */}
                        {getSourceTier(article.source) === 1 && (
                          <span className="ml-1 text-blue-600 font-bold" title="Official Source">🏛️</span>
                        )}
                        {getSourceTier(article.source) === 3 && (
                          <span className="ml-1 text-purple-600 font-medium" title="Social Media">📱</span>
                        )}
                        {article.trusted && (
                          <span className="ml-1 text-green-600 font-medium" title="Verified Source">✓</span>
                        )}
                      </span>
                    </div>
                    {article.url && (
                      <ExternalLink className="h-3 w-3 text-blue-500" />
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* View More/Less Controls */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        {!showAll && sortedNews.length > 5 && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-2 text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <span>View all {sortedNews.length} articles</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {showAll && (
          <div className="space-y-2">
            <div className="text-center text-xs text-gray-500">
              Showing {sortedNews.length} of {totalAvailable} fire news articles
            </div>
            
            {/* Load More Button */}
            {hasMoreNews && (
              <button
                onClick={loadMoreNews}
                disabled={loadingMore}
                className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Loading more...</span>
                  </>
                ) : (
                  <>
                    <span>Load next 10 articles</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={() => setShowAll(false)}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-700 font-medium transition-colors"
            >
              Show top 5 only
            </button>
          </div>
        )}

        {/* News Stats */}
        <div className="mt-2 text-center text-xs text-gray-500">
          {sortedNews.filter(a => getSourceTier(a.source) === 1).length} official • {sortedNews.filter(a => a.priority === 'high').length} high priority • {sortedNews.length} loaded • {totalAvailable} total
        </div>
      </div>
    </div>
  );
};

export default CompactNewsWidget;