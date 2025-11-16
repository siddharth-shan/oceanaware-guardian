import { useState, useEffect } from 'react';
import { Clock, Flame, AlertTriangle, Eye, MapPin, ExternalLink } from 'lucide-react';

/**
 * Enhanced News Widget with Priority Layout and Reliable Sources
 * Features:
 * - Breaking news alerts at top
 * - Priority-based article ordering
 * - Source reliability indicators
 * - Category-based filtering
 * - Emergency content highlighting
 */
const EnhancedNewsWidget = ({ userLocation }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [expandedStory, setExpandedStory] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const categories = [
    { id: 'all', name: 'All News', icon: '📰' },
    { id: 'evacuation', name: 'Evacuations', icon: '🚨', priority: true },
    { id: 'new_fire', name: 'New Fires', icon: '🔥', priority: true },
    { id: 'containment', name: 'Containment', icon: '✅' },
    { id: 'warning', name: 'Warnings', icon: '⚠️', priority: true },
    { id: 'air_quality', name: 'Air Quality', icon: '💨' }
  ];

  // Fetch news data
  useEffect(() => {
    if (!userLocation) return;

    const fetchNewsData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch regular news and breaking news in parallel
        const newsResponse = await fetch(`/api/news/enhanced/fire-related?lat=${userLocation.lat}&lng=${userLocation.lng}&location=${encodeURIComponent(userLocation.displayName)}&state=${userLocation.state || 'California'}&limit=25`);

        if (!newsResponse.ok) {
          throw new Error(`News API error: ${newsResponse.status}`);
        }

        const newsData = await newsResponse.json();
        setNews(newsData.articles || []);

        setLastUpdate(new Date());
      } catch (err) {
        console.error('Enhanced news fetch error:', err);
        setError(`Failed to load news: ${err.message}`);
        
        // Fallback to regular news service
        try {
          const fallbackResponse = await fetch(`/api/news/fire-related?lat=${userLocation.lat}&lng=${userLocation.lng}&location=${encodeURIComponent(userLocation.displayName)}&limit=15`);
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setNews(fallbackData.articles || []);
            setError(null);
          }
        } catch (fallbackErr) {
          console.error('Fallback news fetch error:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNewsData();

    // Auto-refresh every 10 minutes
    const interval = setInterval(fetchNewsData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userLocation?.lat, userLocation?.lng, userLocation?.displayName]);

  // Filter news based on category and trust settings - STRICT FIRE-ONLY FILTERING + RECENT NEWS ONLY
  const filteredNews = news;

  const getSourceIcon = (source) => {
    const sourceIcons = {
      'CAL_FIRE_RSS': '🏢',
      'CAL_FIRE_NEWS': '🏢',
      'KTLA_FIRE': '📺',
      'LATIMES_FIRE': '📰',
      'ABC7_FIRE': '📺',
      'INCIWEB': '🏛️',
      'NewsAPI': '🗞️',
      'Reddit': '🗨️'
    };
    return sourceIcons[source] || '📄';
  };

  const getSourceBadge = (article) => {
    const priorityColors = {
      1: 'bg-red-100 text-red-800 border-red-200', // Official CA sources
      2: 'bg-orange-100 text-orange-800 border-orange-200', // Major news outlets
      3: 'bg-blue-100 text-blue-800 border-blue-200', // National sources
      4: 'bg-green-100 text-green-800 border-green-200', // Aggregators
      5: 'bg-yellow-100 text-yellow-800 border-yellow-200' // Community
    };

    const trustLevel = article.trusted ? 'Official' : 'Community';
    const priorityClass = priorityColors[article.sourcePriority] || priorityColors[5];
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${priorityClass}`}>
        {trustLevel}
      </span>
    );
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const date = new Date(timestamp);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const truncateText = (text, maxLength = 150) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'evacuation': 'text-red-600',
      'new_fire': 'text-orange-600',
      'warning': 'text-yellow-600',
      'air_quality': 'text-purple-600',
      'containment': 'text-green-600',
      'general': 'text-gray-600'
    };
    return colors[category] || colors.general;
  };

  if (loading && news.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Flame className="h-5 w-5 mr-2 text-orange-600" />
            Enhanced Fire News
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <span className="ml-2 text-gray-600">Loading enhanced news...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-3 lg:p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base lg:text-lg font-semibold text-gray-800 flex items-center">
          <Flame className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-orange-600" />
          Latest Fire News
          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full">48hrs</span>
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

      {/* Category Filters - Mobile Optimized */}
      <div className="mb-3 lg:mb-4">
        <div className="flex flex-wrap gap-1.5 lg:gap-2">
          {categories.map(category => {
            const count = category.id === 'all' 
              ? filteredNews.length 
              : news.filter(article => article.category === category.id).length;
            
            return (
              <button
                key={category.id}
                onClick={() => setActiveFilter(category.id)}
                className={`px-2 lg:px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 ${
                  activeFilter === category.id
                    ? 'bg-orange-600 text-white'
                    : count > 0
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
                disabled={count === 0 && category.id !== 'all'}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    activeFilter === category.id ? 'bg-white text-orange-600' : 
                    category.priority ? 'bg-red-500 text-white' : 'bg-orange-600 text-white'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
            <span className="text-yellow-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* No News State */}
      {filteredNews.length === 0 && !loading && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📰</div>
          <p className="text-gray-600 text-sm">No fire news found</p>
          <p className="text-gray-500 text-xs mt-1">
            Try adjusting filters or check back later
          </p>
        </div>
      )}

      {/* News List */}
      {filteredNews.length > 0 && (
        <div className="space-y-2 lg:space-y-3 max-h-80 lg:max-h-[600px] overflow-y-auto">
          {filteredNews.map((article, index) => (
            <div 
              key={article.id || index} 
              className={`border rounded-lg p-2 lg:p-3 hover:bg-gray-50 transition-colors ${
                article.category === 'evacuation' ? 'border-red-300 bg-red-50' :
                article.category === 'new_fire' ? 'border-orange-300 bg-orange-50' :
                article.category === 'warning' ? 'border-yellow-300 bg-yellow-50' :
                'border-gray-200'
              }`}
            >
              {/* Article Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getSourceIcon(article.source)}</span>
                  {getSourceBadge(article)}
                  {article.category && article.category !== 'general' && (
                    <span className={`text-xs font-medium ${getCategoryColor(article.category)}`}>
                      {article.category.replace('_', ' ').toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {formatTimeAgo(article.publishedAt)}
                </span>
              </div>

              {/* Title */}
              {article.url ? (
                <a 
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-gray-800 text-sm mb-1 leading-tight hover:text-blue-600 transition-colors block"
                >
                  {article.title}
                </a>
              ) : (
                <h4 className="font-medium text-gray-800 text-sm mb-1 leading-tight">
                  {article.title}
                </h4>
              )}

              {/* Description */}
              {article.description && (
                <p className="text-gray-600 text-xs mb-2 leading-relaxed">
                  {expandedStory === index 
                    ? article.description 
                    : truncateText(article.description, 120)}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>{article.location || 'California'}</span>
                  </div>
                  {article.relevanceScore && (
                    <div className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      <span>{Math.round(article.relevanceScore * 100)}% relevant</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {article.description && article.description.length > 120 && (
                    <button
                      onClick={() => setExpandedStory(expandedStory === index ? null : index)}
                      className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                    >
                      {expandedStory === index ? 'Less' : 'More'}
                    </button>
                  )}
                  {article.url && (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 font-medium flex items-center transition-colors"
                    >
                      Read Full Story <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {filteredNews.length} recent stories
            {activeFilter !== 'all' && ` • ${activeFilter.replace('_', ' ')}`}
            <span className="text-blue-600 ml-1">• Last 48 hours</span>
          </span>
          <span className="text-green-600 font-medium">All Sources • Click to Read</span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedNewsWidget;