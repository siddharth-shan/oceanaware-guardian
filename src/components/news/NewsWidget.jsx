import { useState, useEffect } from 'react';
import { useNewsData } from '../../hooks/useNewsData';

const NewsWidget = ({ userLocation }) => {
  const { 
    news, 
    loading, 
    error, 
    lastUpdate,
    refetch 
  } = useNewsData(userLocation);

  const [expandedStory, setExpandedStory] = useState(null);
  const filteredNews = news;

  const getSourceIcon = (source) => {
    switch (source) {
      case 'NewsAPI':
        return '📰';
      case 'Reddit':
        return '🗨️';
      case 'RSS':
        return '📡';
      case 'CAL_FIRE':
        return '🔥';
      case 'NIFC':
        return '🚨';
      default:
        return '📄';
    }
  };

  const getSourceBadge = (item) => {
    const badgeClasses = item.trusted 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-yellow-100 text-yellow-800 border-yellow-200';
    
    const label = item.trusted ? 'Official' : 'Community';
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${badgeClasses}`}>
        {label}
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

  if (loading && news.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <span className="mr-2">📰</span>
            Fire News & Updates
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <span className="ml-2 text-gray-600">Loading news...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <span className="mr-2">📰</span>
          Fire News & Updates
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={refetch}
            disabled={loading}
            className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            title="Refresh news"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* No News State */}
      {filteredNews.length === 0 && !loading && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📰</div>
          <p className="text-gray-600 text-sm">No fire-related news found</p>
          <p className="text-gray-500 text-xs mt-1">
            Try toggling between trusted and all sources
          </p>
        </div>
      )}

      {/* News List */}
      {filteredNews.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredNews.slice(0, 8).map((item, index) => (
            <div key={`${item.id || index}`} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
              {/* News Item Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getSourceIcon(item.source)}</span>
                  {getSourceBadge(item)}
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {formatTimeAgo(item.publishedAt)}
                </span>
              </div>

              {/* Title */}
              <h4 className="font-medium text-gray-800 text-sm mb-1 leading-tight">
                {item.title}
              </h4>

              {/* Description */}
              {item.description && (
                <p className="text-gray-600 text-xs mb-2 leading-relaxed">
                  {expandedStory === index 
                    ? item.description 
                    : truncateText(item.description, 120)}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <span>📍 {item.location || 'General'}</span>
                  {item.relevanceScore && (
                    <span>🎯 {Math.round(item.relevanceScore * 100)}% relevant</span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {item.description && item.description.length > 120 && (
                    <button
                      onClick={() => setExpandedStory(expandedStory === index ? null : index)}
                      className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                    >
                      {expandedStory === index ? 'Less' : 'More'}
                    </button>
                  )}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Read →
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
            {filteredNews.length} {showTrustedOnly ? 'trusted' : 'total'} story(ies)
          </span>
          {lastUpdate && (
            <span>Updated {formatTimeAgo(lastUpdate.toISOString())}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsWidget;