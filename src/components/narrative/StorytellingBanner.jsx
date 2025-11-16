import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Play, Pause, Volume2 } from 'lucide-react';
import { useAccessibility } from '../accessibility/AccessibilityProvider';

/**
 * Storytelling Banner - Creates compelling narrative elements throughout the app
 */
const StorytellingBanner = ({ 
  story, 
  location, 
  emergencyLevel = 'normal',
  className = ''
}) => {
  const { translate, speak, isLanguageSpanish } = useAccessibility();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // Dynamic story content based on app state
  const stories = {
    normal: [
      {
        title: translate('story.normal.title', 'Your Shield Against Wildfire'),
        content: translate('story.normal.content', 
          'Every year, California faces thousands of wildfires. But you\'re not powerless. With EcoQuest, you join a community of prepared families who use AI technology to stay one step ahead of danger.'
        ),
        emotion: 'empowerment',
        action: translate('story.normal.action', 'Start Your Safety Journey'),
        background: 'bg-gradient-to-r from-green-100 to-blue-100'
      },
      {
        title: translate('story.hope.title', 'Hope Through Preparation'),
        content: translate('story.hope.content',
          'Maria from Sonoma County says: "After the 2020 fires, I felt helpless. EcoQuest gave me back control. Now my family knows exactly what to do, and we sleep better knowing we\'re prepared."'
        ),
        emotion: 'hope',
        action: translate('story.hope.action', 'Join Thousands of Prepared Families'),
        background: 'bg-gradient-to-r from-yellow-100 to-orange-100'
      }
    ],
    watch: [
      {
        title: translate('story.watch.title', 'Heightened Awareness Mode'),
        content: translate('story.watch.content',
          'Conditions are changing in your area. This is the time when prepared families have the advantage. Your Safety Quest training activates now - check your go-bag, review your evacuation routes, and stay alert.'
        ),
        emotion: 'vigilance',
        action: translate('story.watch.action', 'Review Your Emergency Plan'),
        background: 'bg-gradient-to-r from-yellow-200 to-orange-200'
      }
    ],
    warning: [
      {
        title: translate('story.warning.title', 'Your Preparation Pays Off'),
        content: translate('story.warning.content',
          'This is why you prepared. Fire conditions are elevated, but you\'re ready. Your family knows the plan, your emergency supplies are stocked, and EcoQuest is monitoring conditions for you.'
        ),
        emotion: 'confidence',
        action: translate('story.warning.action', 'Activate Emergency Protocol'),
        background: 'bg-gradient-to-r from-orange-200 to-red-200'
      }
    ],
    critical: [
      {
        title: translate('story.critical.title', 'Every Second Counts'),
        content: translate('story.critical.content',
          'Critical fire conditions detected. Your Safety Quest training prepared you for this moment. Trust your plan, trust your preparation, and act decisively. You have everything you need to protect your family.'
        ),
        emotion: 'urgency',
        action: translate('story.critical.action', 'Execute Emergency Plan NOW'),
        background: 'bg-gradient-to-r from-red-400 to-orange-500 text-white'
      }
    ]
  };

  const currentStories = stories[emergencyLevel] || stories.normal;
  const currentStory = currentStories[currentStoryIndex];

  useEffect(() => {
    let interval;
    if (isAutoPlaying && currentStories.length > 1) {
      interval = setInterval(() => {
        setCurrentStoryIndex(prev => (prev + 1) % currentStories.length);
      }, 8000); // 8 seconds per story
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, currentStories.length]);

  const handleSpeak = () => {
    speak(`${currentStory.title}. ${currentStory.content}`, { 
      priority: emergencyLevel === 'critical' ? 'emergency' : 'normal' 
    });
  };

  const getLocationPersonalization = () => {
    if (!location) return '';
    
    const locationStories = {
      'Los Angeles': translate('location.la', 'In the heart of Southern California'),
      'San Francisco': translate('location.sf', 'Bay Area families stand together'),
      'Sacramento': translate('location.sac', 'From the Central Valley to the foothills'),
      'San Diego': translate('location.sd', 'Protecting America\'s Finest City')
    };

    const locationName = location.city || location.name;
    return locationStories[locationName] || 
      translate('location.generic', `Protecting ${locationName} families like yours`);
  };

  return (
    <div className={`enhanced-card ${currentStory.background} border-l-4 border-orange-500 ${className}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white">
              🌟
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                {currentStory.title}
              </h3>
              {location && (
                <p className="text-sm opacity-80">
                  {getLocationPersonalization()}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Voice narration button */}
            <button
              onClick={handleSpeak}
              className="p-2 rounded-lg hover:bg-black/10 transition-colors"
              aria-label="Read story aloud"
              title="Listen to this story"
            >
              <Volume2 className="w-5 h-5" />
            </button>

            {/* Auto-play toggle */}
            {currentStories.length > 1 && (
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={`p-2 rounded-lg transition-colors ${
                  isAutoPlaying ? 'bg-orange-500 text-white' : 'hover:bg-black/10'
                }`}
                aria-label={isAutoPlaying ? 'Pause story rotation' : 'Auto-play stories'}
                title={isAutoPlaying ? 'Pause stories' : 'Auto-play stories'}
              >
                {isAutoPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            )}

            {/* Expand/collapse button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg hover:bg-black/10 transition-colors"
              aria-label={isExpanded ? 'Collapse story' : 'Expand story'}
            >
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Story indicators */}
        {currentStories.length > 1 && (
          <div className="flex items-center space-x-2 mb-3">
            {currentStories.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStoryIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStoryIndex 
                    ? 'bg-orange-500' 
                    : 'bg-black/20 hover:bg-black/40'
                }`}
                aria-label={`Story ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Story content */}
        <div className={`transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-16'} overflow-hidden`}>
          <p className="text-base leading-relaxed mb-4">
            {currentStory.content}
          </p>

          {isExpanded && (
            <>
              {/* Call to action */}
              <div className="flex items-center justify-between pt-4 border-t border-black/10">
                <div className="text-sm opacity-80">
                  {translate('story.emotion', `Feeling: ${currentStory.emotion}`)}
                </div>
                
                <button 
                  className="enhanced-button px-4 py-2 text-sm"
                  onClick={() => {
                    // Navigate to relevant section based on emergency level
                    if (emergencyLevel === 'critical') {
                      // Navigate to emergency contacts
                    } else {
                      // Navigate to safety quests
                    }
                  }}
                >
                  {currentStory.action}
                </button>
              </div>

              {/* Success stories section for normal mode */}
              {emergencyLevel === 'normal' && (
                <div className="mt-4 p-3 bg-white/50 rounded-lg">
                  <h4 className="font-semibold mb-2">
                    {translate('story.success.title', 'Real Families, Real Results')}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start space-x-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>
                        {translate('story.success.1', '94% of families report feeling more prepared after completing Safety Quests')}
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>
                        {translate('story.success.2', 'Average evacuation time reduced by 40% with EcoQuest preparation')}
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>
                        {translate('story.success.3', 'Over 10,000 California families now sleep safer at night')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorytellingBanner;