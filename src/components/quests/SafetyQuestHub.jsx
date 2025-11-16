import { useState, useEffect } from 'react';
import { safetyQuests, getQuestProgress } from '../../data/questsData.js';
import { Trophy, Star, Zap, Target, Award, Crown, Medal, Flame } from 'lucide-react';
import { useAccessibility } from '../accessibility/AccessibilityProvider';

const SafetyQuestHub = ({ userLocation }) => {
  const [completedQuests, setCompletedQuests] = useState([]);
  const [completedSubtasks, setCompletedSubtasks] = useState({});
  const [expandedQuest, setExpandedQuest] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [userStats, setUserStats] = useState({
    streak: 0,
    lastActivity: null,
    totalPoints: 0,
    achievements: [],
    level: 1,
    experience: 0
  });
  const [showAchievements, setShowAchievements] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [questAnimation, setQuestAnimation] = useState(null);
  const { speak, translate } = useAccessibility();

  // Load progress from localStorage
  useEffect(() => {
    const savedQuests = localStorage.getItem('completedQuests');
    const savedSubtasks = localStorage.getItem('completedSubtasks');
    const savedStats = localStorage.getItem('questUserStats');
    
    if (savedQuests) setCompletedQuests(JSON.parse(savedQuests));
    if (savedSubtasks) setCompletedSubtasks(JSON.parse(savedSubtasks));
    if (savedStats) setUserStats(JSON.parse(savedStats));
    
    // Update streak on load
    updateStreak();
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem('completedQuests', JSON.stringify(completedQuests));
    localStorage.setItem('completedSubtasks', JSON.stringify(completedSubtasks));
    localStorage.setItem('questUserStats', JSON.stringify(userStats));
  }, [completedQuests, completedSubtasks, userStats]);

  const toggleQuestCompletion = (questId) => {
    const isCompleting = !completedQuests.includes(questId);
    
    setCompletedQuests(prev => 
      prev.includes(questId) 
        ? prev.filter(id => id !== questId)
        : [...prev, questId]
    );
    
    if (isCompleting) {
      const quest = safetyQuests.find(q => q.id === questId);
      if (quest) {
        awardPoints(quest.points, questId);
        checkForAchievements(quest);
        setQuestAnimation(questId);
        setTimeout(() => setQuestAnimation(null), 3000);
        
        // Celebration sound effect (optional - browser may block without user interaction)
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
          oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
          oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
          
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
          // Sound failed - continue without audio
        }
        
        // Voice feedback
        speak(translate('quest.completed', `Quest completed! You earned ${quest.points} points.`));
      }
    }
  };

  const toggleSubtaskCompletion = (questId, subtaskId, itemIndex) => {
    const key = `${questId}-${subtaskId}-${itemIndex}`;
    setCompletedSubtasks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getSubtaskProgress = (questId, subtaskId, checklist) => {
    const completed = checklist.filter((_, index) => 
      completedSubtasks[`${questId}-${subtaskId}-${index}`]
    ).length;
    return Math.round((completed / checklist.length) * 100);
  };

  const getQuestOverallProgress = (quest) => {
    if (!quest.resources.subtasks) return 0;
    const totalItems = quest.resources.subtasks.reduce((sum, subtask) => 
      sum + subtask.checklist.length, 0
    );
    const completedItems = quest.resources.subtasks.reduce((sum, subtask) => {
      const completed = subtask.checklist.filter((_, index) => 
        completedSubtasks[`${quest.id}-${subtask.id}-${index}`]
      ).length;
      return sum + completed;
    }, 0);
    return Math.round((completedItems / totalItems) * 100);
  };

  const categories = [
    { id: 'all', name: 'All Quests', icon: '🎯' },
    { id: 'preparation', name: 'Preparation', icon: '🛠️' },
    { id: 'planning', name: 'Planning', icon: '📋' },
    { id: 'technology', name: 'Technology', icon: '📱' },
    { id: 'assessment', name: 'Assessment', icon: '🔍' },
    { id: 'community', name: 'Community', icon: '🤝' }
  ];

  const filteredQuests = activeCategory === 'all' 
    ? safetyQuests 
    : safetyQuests.filter(quest => quest.category === activeCategory);

  const progress = getQuestProgress(completedQuests);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Hard': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'video': return '🎥';
      case 'pdf': return '📄';
      case 'app': return '📱';
      case 'guide': return '📖';
      case 'checklist': return '✅';
      case 'tool': return '🛠️';
      case 'link': return '🔗';
      case 'hotline': return '📞';
      case 'map': return '🗺️';
      case 'template': return '📝';
      default: return '📌';
    }
  };

  // Gamification Functions
  const updateStreak = () => {
    const today = new Date().toDateString();
    const lastActivity = userStats.lastActivity;
    
    if (lastActivity) {
      const lastDate = new Date(lastActivity).toDateString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
      
      if (lastDate === today) {
        // Already counted today, no change
        return;
      } else if (lastDate === yesterday) {
        // Consecutive day, increment streak
        setUserStats(prev => ({ 
          ...prev, 
          streak: prev.streak + 1,
          lastActivity: today
        }));
      } else {
        // Streak broken, reset to 1
        setUserStats(prev => ({ 
          ...prev, 
          streak: 1,
          lastActivity: today
        }));
      }
    } else {
      // First activity
      setUserStats(prev => ({ 
        ...prev, 
        streak: 1,
        lastActivity: today
      }));
    }
  };

  const awardPoints = (points, questId) => {
    setUserStats(prev => {
      const newTotalPoints = prev.totalPoints + points;
      const newExperience = prev.experience + points;
      const newLevel = Math.floor(newExperience / 100) + 1;
      
      return {
        ...prev,
        totalPoints: newTotalPoints,
        experience: newExperience,
        level: newLevel,
        lastActivity: new Date().toDateString()
      };
    });
    
    updateStreak();
  };

  const checkForAchievements = (quest) => {
    const newAchievements = [];
    
    // First quest achievement
    if (completedQuests.length === 0) {
      newAchievements.push({
        id: 'first-quest',
        title: 'Getting Started',
        description: 'Completed your first safety quest',
        icon: '🌟',
        unlockedAt: new Date().toISOString()
      });
    }
    
    // Category master achievements
    const categoryQuests = safetyQuests.filter(q => q.category === quest.category);
    const completedCategoryQuests = [...completedQuests, quest.id]
      .filter(id => safetyQuests.find(q => q.id === id && q.category === quest.category));
    
    if (completedCategoryQuests.length === categoryQuests.length) {
      newAchievements.push({
        id: `${quest.category}-master`,
        title: `${quest.category.charAt(0).toUpperCase() + quest.category.slice(1)} Master`,
        description: `Completed all ${quest.category} quests`,
        icon: '🏆',
        unlockedAt: new Date().toISOString()
      });
    }
    
    // Streak achievements
    if (userStats.streak >= 7) {
      newAchievements.push({
        id: 'week-warrior',
        title: 'Week Warrior',
        description: 'Maintained a 7-day activity streak',
        icon: '🔥',
        unlockedAt: new Date().toISOString()
      });
    }
    
    // Point milestones
    const newTotal = userStats.totalPoints + quest.points;
    if (newTotal >= 1000 && userStats.totalPoints < 1000) {
      newAchievements.push({
        id: 'point-master',
        title: 'Point Master',
        description: 'Earned 1000+ total points',
        icon: '💎',
        unlockedAt: new Date().toISOString()
      });
    }
    
    // Add new achievements
    if (newAchievements.length > 0) {
      setUserStats(prev => ({
        ...prev,
        achievements: [...prev.achievements, ...newAchievements]
      }));
      
      // Show achievement notification
      newAchievements.forEach(achievement => {
        speak(translate('achievement.unlocked', `Achievement unlocked: ${achievement.title}`));
      });
    }
  };

  const getExperienceForNextLevel = () => {
    return (userStats.level * 100) - userStats.experience;
  };

  const getProgressToNextLevel = () => {
    const currentLevelExp = (userStats.level - 1) * 100;
    const nextLevelExp = userStats.level * 100;
    const progress = (userStats.experience - currentLevelExp) / (nextLevelExp - currentLevelExp);
    return Math.max(0, Math.min(100, progress * 100));
  };

  const getRankTitle = () => {
    if (userStats.level >= 20) return 'Fire Safety Expert';
    if (userStats.level >= 15) return 'Emergency Specialist';
    if (userStats.level >= 10) return 'Safety Advocate';
    if (userStats.level >= 5) return 'Preparedness Pro';
    return 'Safety Rookie';
  };

  const getStreakEmoji = () => {
    if (userStats.streak >= 30) return '🏆';
    if (userStats.streak >= 14) return '🔥';
    if (userStats.streak >= 7) return '⭐';
    if (userStats.streak >= 3) return '✨';
    return '🌱';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      {/* Celebration Animation */}
      {questAnimation && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-bounce text-6xl">
            🎆
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="animate-pulse text-4xl font-bold text-green-600 bg-white px-6 py-3 rounded-lg shadow-2xl border-4 border-green-400">
              Quest Complete! 🏆
            </div>
          </div>
          {/* Confetti Effect */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce text-2xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random() * 2}s`
                }}
              >
                {['🎉', '✨', '⭐', '🔥', '🏆'][Math.floor(Math.random() * 5)]}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Enhanced Header with Gamification */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              🔥 Wildfire Safety Quest Hub
            </h1>
            <p className="text-lg mt-2">Your comprehensive emergency preparedness guide with interactive checklists and gamified learning.</p>
          </div>
          <div className="text-right">
            <div className="bg-white/20 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Crown className="w-5 h-5" />
                <span className="font-bold">Level {userStats.level}</span>
              </div>
              <div className="text-sm">{getRankTitle()}</div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center mb-4">
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-2xl font-bold">{progress.completedCount}</div>
            <div className="text-sm">Quests Complete</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-2xl font-bold">{userStats.totalPoints}</div>
            <div className="text-sm">Total Points</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-2xl font-bold flex items-center justify-center">
              {getStreakEmoji()} {userStats.streak}
            </div>
            <div className="text-sm">Day Streak</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-2xl font-bold">{userStats.achievements.length}</div>
            <div className="text-sm">Achievements</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-2xl font-bold">{progress.completionPercentage}%</div>
            <div className="text-sm">Progress</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <div className="text-2xl font-bold">{userStats.experience}</div>
            <div className="text-sm">Experience</div>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Level {userStats.level} - {getRankTitle()}</span>
            <span>{getExperienceForNextLevel()} XP to next level</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-yellow-300 to-yellow-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${getProgressToNextLevel()}%` }}
            ></div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Overall Quest Progress</span>
            <span>{progress.completedCount}/{progress.totalQuests} quests</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-3">
            <div 
              className="bg-white h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress.completionPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-4">
          <button
            onClick={() => setShowAchievements(true)}
            className="bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Trophy className="w-4 h-4" />
            <span>Achievements ({userStats.achievements.length})</span>
          </button>
          <button
            onClick={() => setShowLeaderboard(true)}
            className="bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Medal className="w-4 h-4" />
            <span>Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-lg p-4 shadow-lg">
        <h3 className="font-bold mb-4">Quest Categories</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeCategory === category.id
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Quest Cards */}
      <div className="space-y-4">
        {filteredQuests.map(quest => {
          const questProgress = getQuestOverallProgress(quest);
          const isExpanded = expandedQuest === quest.id;
          const isCompleted = completedQuests.includes(quest.id);
          const hasAnimation = questAnimation === quest.id;

          return (
            <div key={quest.id} className={`bg-white rounded-lg shadow-lg border overflow-hidden transition-all duration-500 ${
              hasAnimation ? 'ring-4 ring-green-400 ring-opacity-75 scale-105' : ''
            }`}>
              {/* Quest Header */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{quest.title}</h3>
                      {isCompleted && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                          ✅ Completed
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-4">{quest.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <span className={`px-2 py-1 rounded border font-medium ${getDifficultyColor(quest.difficulty)}`}>
                        {quest.difficulty}
                      </span>
                      <span className="text-gray-500">⏱️ {quest.estimatedTime}</span>
                      <span className="text-orange-600 font-bold flex items-center">
                        <Trophy className="w-4 h-4 mr-1" />
                        {quest.points} points
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <div className="text-right">
                      <div className="text-lg font-bold text-orange-600">{questProgress}%</div>
                      <div className="text-xs text-gray-500">Progress</div>
                    </div>
                    <button
                      onClick={() => setExpandedQuest(isExpanded ? null : quest.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                        isCompleted 
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : isExpanded
                          ? 'bg-gray-600 text-white hover:bg-gray-700'
                          : 'bg-orange-600 text-white hover:bg-orange-700 hover:scale-105'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <Star className="w-4 h-4" />
                          <span>Completed</span>
                        </>
                      ) : isExpanded ? (
                        <>
                          <span>Collapse</span>
                        </>
                      ) : (
                        <>
                          <Target className="w-4 h-4" />
                          <span>Start Quest</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${questProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t bg-gray-50 p-6 space-y-6">
                  {/* Overview */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-bold text-blue-800 mb-2">📋 Overview</h4>
                    <p className="text-blue-700">{quest.resources.overview}</p>
                  </div>

                  {/* Subtasks with Checklists */}
                  {quest.resources.subtasks && (
                    <div>
                      <h4 className="font-bold text-gray-800 mb-4">✅ Action Checklist</h4>
                      <div className="space-y-4">
                        {quest.resources.subtasks.map(subtask => {
                          const subtaskProgress = getSubtaskProgress(quest.id, subtask.id, subtask.checklist);
                          return (
                            <div key={subtask.id} className="bg-white border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h5 className="font-bold text-gray-800">{subtask.title}</h5>
                                  <p className="text-sm text-gray-600">{subtask.description}</p>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-orange-600">{subtaskProgress}%</div>
                                  <div className="text-xs text-gray-500">Complete</div>
                                </div>
                              </div>
                              
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${subtaskProgress}%` }}
                                ></div>
                              </div>

                              <div className="space-y-2">
                                {subtask.checklist.map((item, index) => {
                                  const isItemCompleted = completedSubtasks[`${quest.id}-${subtask.id}-${index}`];
                                  return (
                                    <label key={index} className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                      <input
                                        type="checkbox"
                                        checked={isItemCompleted || false}
                                        onChange={() => toggleSubtaskCompletion(quest.id, subtask.id, index)}
                                        className="mt-1 h-4 w-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                                      />
                                      <span className={`text-sm ${isItemCompleted ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                        {item}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Resources */}
                  <div>
                    <h4 className="font-bold text-gray-800 mb-4">📚 Resources & References</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {quest.resources.resources.map((resource, index) => (
                        <a
                          key={index}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start space-x-3">
                            <span className="text-2xl">{getResourceIcon(resource.type)}</span>
                            <div>
                              <h5 className="font-bold text-gray-800">{resource.title}</h5>
                              <p className="text-sm text-gray-600">{resource.description}</p>
                              <span className="text-xs text-orange-600 font-medium capitalize">{resource.type}</span>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Tips */}
                  {quest.resources.tips && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-bold text-yellow-800 mb-3">💡 Pro Tips</h4>
                      <ul className="space-y-2">
                        {quest.resources.tips.map((tip, index) => (
                          <li key={index} className="flex items-start space-x-2 text-yellow-700">
                            <span className="text-yellow-600 mt-1">•</span>
                            <span className="text-sm">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Quest Completion */}
                  <div className="flex items-center justify-between bg-gray-100 rounded-lg p-4">
                    <div>
                      <h5 className="font-bold text-gray-800">Mark Quest as Complete</h5>
                      <p className="text-sm text-gray-600">Complete when you've finished all checklist items</p>
                    </div>
                    <button
                      onClick={() => toggleQuestCompletion(quest.id)}
                      className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                        isCompleted
                          ? 'bg-green-600 text-white hover:bg-green-700 hover:scale-105'
                          : 'bg-orange-600 text-white hover:bg-orange-700 hover:scale-105 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <Award className="w-5 h-5" />
                          <span>Completed</span>
                        </>
                      ) : (
                        <>
                          <Flame className="w-5 h-5" />
                          <span>Mark Complete</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Achievements Modal */}
      {showAchievements && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
                Your Achievements
              </h2>
              <button
                onClick={() => setShowAchievements(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            {userStats.achievements.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-lg font-bold text-gray-600 mb-2">No Achievements Yet</h3>
                <p className="text-gray-500">Complete quests to unlock your first achievement!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userStats.achievements.map((achievement, index) => (
                  <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <span className="text-3xl">{achievement.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{achievement.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                        <div className="text-xs text-gray-500">
                          Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{userStats.achievements.length}</span> of many achievements unlocked.
                Keep completing quests to earn more!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Medal className="w-6 h-6 mr-2 text-purple-500" />
                Community Leaderboard
              </h2>
              <button
                onClick={() => setShowLeaderboard(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* Your Rank */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-blue-800">Your Current Rank</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Crown className="w-5 h-5 text-blue-600" />
                    <span className="text-lg font-bold text-blue-600">{getRankTitle()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{userStats.totalPoints}</div>
                  <div className="text-sm text-blue-500">Total Points</div>
                </div>
              </div>
            </div>

            {/* Sample Leaderboard */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-800 mb-3">Top Community Members</h3>
              
              {/* Sample leaderboard entries */}
              {[
                { rank: 1, name: 'FireSafety Pro', points: 2850, level: 28, title: 'Fire Safety Expert' },
                { rank: 2, name: 'Emergency Ready', points: 2640, level: 26, title: 'Emergency Specialist' },
                { rank: 3, name: 'Community Guard', points: 2420, level: 24, title: 'Emergency Specialist' },
                { rank: 4, name: 'Safety First', points: 1980, level: 19, title: 'Emergency Specialist' },
                { rank: 5, name: 'Prepared Family', points: 1750, level: 17, title: 'Emergency Specialist' },
                { rank: '...', name: 'You', points: userStats.totalPoints, level: userStats.level, title: getRankTitle() }
              ].map((entry, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                  entry.name === 'You' ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      entry.rank === 1 ? 'bg-yellow-500 text-white' :
                      entry.rank === 2 ? 'bg-gray-400 text-white' :
                      entry.rank === 3 ? 'bg-orange-600 text-white' :
                      entry.name === 'You' ? 'bg-orange-500 text-white' :
                      'bg-gray-300 text-gray-600'
                    }`}>
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                    </div>
                    <div>
                      <div className={`font-bold ${entry.name === 'You' ? 'text-orange-600' : 'text-gray-800'}`}>
                        {entry.name}
                      </div>
                      <div className="text-sm text-gray-500">{entry.title}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${entry.name === 'You' ? 'text-orange-600' : 'text-gray-800'}`}>
                      {entry.points.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Level {entry.level}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600 text-center">
                Rankings update daily. Complete more quests to climb the leaderboard!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Contacts */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="font-bold text-red-800 mb-4">🚨 Emergency Contacts</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-bold text-red-700">Emergency Services</h4>
            <p className="text-2xl font-bold text-red-600">911</p>
            <p className="text-sm text-red-600">Fire, Police, Medical</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-bold text-red-700">CAL FIRE</h4>
            <p className="text-lg font-bold text-red-600">1-800-468-4408</p>
            <p className="text-sm text-red-600">Report Fire Hazards</p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-bold text-red-700">Red Cross</h4>
            <p className="text-lg font-bold text-red-600">1-800-RED-CROSS</p>
            <p className="text-sm text-red-600">Disaster Relief</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyQuestHub;