import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Compass, Heart, Sparkles, AlertCircle, ThumbsUp } from 'lucide-react';

/**
 * Captain Marina Guide Component
 *
 * A narrative guide character that appears throughout the app to provide
 * context, personal stories, and encouragement. Based on contest analysis
 * showing that past winners used character guides (e.g., turtle in Bamboo Bike game).
 *
 * Emotions available: friendly, teaching, celebrating, concerned, encouraging, thoughtful
 */

const CaptainMarinaGuide = ({
  message,
  emotion = 'friendly',
  position = 'bottom-right',
  dismissible = true,
  showInitially = true,
  onDismiss,
  autoHide = false,
  autoHideDuration = 10000,
  actionButton = null, // { label: string, onClick: function, variant: 'primary' | 'secondary' }
  onNavigate = null // Optional navigation callback
}) => {
  const [isVisible, setIsVisible] = useState(showInitially);
  const [isMinimized, setIsMinimized] = useState(false);

  // Auto-hide after duration
  React.useEffect(() => {
    if (autoHide && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDuration, isVisible, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Emotion-based styling and icons
  const emotionConfig = {
    friendly: {
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      icon: Heart,
      iconColor: 'text-blue-600'
    },
    teaching: {
      gradient: 'from-purple-500 to-indigo-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-500',
      icon: Compass,
      iconColor: 'text-purple-600'
    },
    celebrating: {
      gradient: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      icon: Sparkles,
      iconColor: 'text-green-600'
    },
    concerned: {
      gradient: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-500',
      icon: AlertCircle,
      iconColor: 'text-orange-600'
    },
    encouraging: {
      gradient: 'from-teal-500 to-cyan-500',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-500',
      icon: ThumbsUp,
      iconColor: 'text-teal-600'
    },
    thoughtful: {
      gradient: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-500',
      icon: Compass,
      iconColor: 'text-indigo-600'
    }
  };

  const config = emotionConfig[emotion] || emotionConfig.friendly;
  const Icon = config.icon;

  // Map emotions to available character images
  // We have: friendly, teaching, celebrating, concerned, encouraging
  // "thoughtful" maps to "teaching" since they're similar
  const getEmotionImageName = (emotion) => {
    const imageMap = {
      'friendly': 'friendly',
      'teaching': 'teaching',
      'celebrating': 'celebrating',
      'concerned': 'concerned',
      'encouraging': 'encouraging',
      'thoughtful': 'teaching' // Fallback: use teaching image for thoughtful
    };
    return imageMap[emotion] || 'friendly';
  };

  // Position classes - increased bottom padding to prevent cut-off
  const positionClasses = {
    'bottom-right': 'bottom-6 right-4 sm:bottom-8 sm:right-6 mb-safe',
    'bottom-left': 'bottom-6 left-4 sm:bottom-8 sm:left-6 mb-safe',
    'top-right': 'top-4 right-4 sm:top-6 sm:right-6',
    'top-left': 'top-4 left-4 sm:top-6 sm:left-6',
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2 mb-safe',
    'relative': 'relative' // For non-fixed positioning
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ duration: 0.3 }}
        className={`${position === 'relative' ? 'relative' : 'fixed'} ${positionClasses[position]} z-[100] max-w-sm`}
      >
        {isMinimized ? (
          // Minimized state - just avatar circle
          <button
            onClick={handleToggleMinimize}
            className={`bg-gradient-to-r ${config.gradient} p-4 rounded-full shadow-2xl hover:scale-110 transition-transform`}
            aria-label="Expand Captain Marina's message"
          >
            <Icon className="w-6 h-6 text-white" />
          </button>
        ) : (
          // Full message card
          <div className={`bg-white rounded-2xl shadow-2xl border-2 ${config.borderColor} overflow-hidden`}>
            {/* Header with gradient */}
            <div className={`bg-gradient-to-r ${config.gradient} p-3 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <Icon className={`w-6 h-6 ${config.iconColor}`} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Captain Marina</h4>
                  <p className="text-xs text-blue-100 capitalize">{emotion}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={handleToggleMinimize}
                  className="text-white hover:bg-white/20 p-1 rounded transition-colors"
                  aria-label="Minimize"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {dismissible && (
                  <button
                    onClick={handleDismiss}
                    className="text-white hover:bg-white/20 p-1 rounded transition-colors"
                    aria-label="Dismiss Captain Marina"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Message content */}
            <div className={`p-4 ${config.bgColor}`}>
              <div className="flex items-start gap-3">
                {/* Avatar with Captain Marina character illustration */}
                <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center border-2 border-white shadow-lg overflow-hidden bg-white`}>
                  <img
                    src={`/assets/characters/captain-marina-${getEmotionImageName(emotion)}.png`}
                    alt={`Captain Marina ${emotion}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to friendly if image fails to load
                      if (e.target.src !== '/assets/characters/captain-marina-friendly.png') {
                        e.target.src = '/assets/characters/captain-marina-friendly.png';
                      }
                    }}
                  />
                </div>

                {/* Message */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                    {message}
                  </div>
                </div>
              </div>

              {/* Optional action hint */}
              {emotion === 'teaching' && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <Compass className="w-3 h-3" />
                    Follow along to learn more
                  </p>
                </div>
              )}

              {emotion === 'celebrating' && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    You're doing great!
                  </p>
                </div>
              )}

              {/* Action Button */}
              {actionButton && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <button
                    onClick={actionButton.onClick}
                    className={`w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 ${
                      actionButton.variant === 'secondary'
                        ? 'bg-white text-blue-600 border-2 border-blue-500 hover:bg-blue-50'
                        : `bg-gradient-to-r ${config.gradient} text-white hover:opacity-90`
                    }`}
                  >
                    {actionButton.label}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// Preset messages for different sections of the app
export const marinaMessages = {
  dashboard: {
    welcome: {
      message: `Ahoy! I'm Captain Marina.

When I was 8 years old, I watched my favorite beach slowly disappear. The sandbar where I used to hunt for shells was gone. That's when I knew I had to become an ocean guardian.

Today, I'm going to show you how YOU can protect our oceans using science, technology, and a whole lot of heart. Ready to set sail?`,
      emotion: 'friendly'
    }
  },

  aiGuardian: {
    intro: {
      message: `Welcome to AI Ocean Guardian!

As I grew up, I discovered that artificial intelligence is one of our most powerful tools for protecting the ocean. Real scientists use AI to identify whales, detect pollution from satellites, and track coral health.

Today, you'll train your first AI model - just like real marine conservationists. You'll also learn about AI bias and ethics. Let's dive in!`,
      emotion: 'teaching'
    },
    training: {
      message: `Notice how the AI gets better as you label more images? That's machine learning in action!

But here's the important part: AI is only as good as the data we give it. If our training data is unbalanced, the AI becomes biased. Keep an eye on that warning - it's teaching you to build fair, responsible technology.`,
      emotion: 'teaching'
    },
    complete: {
      message: `Incredible work! You just trained an AI to identify ocean pollution.

You now know more about machine learning than most adults. More importantly, you understand that technology isn't magic - it's a tool that requires human wisdom, fairness, and care.

Future ocean guardians like you will build the AI systems that save our seas. This is your first step.`,
      emotion: 'celebrating'
    }
  },

  interactiveStory: {
    intro: {
      message: `This is the story of what happened to my beach... and what could happen to yours.

As you scroll through time, you'll see three possible futures: 2020 (today), 2050 (tomorrow), and 2100 (your children's world).

But remember: The future isn't written yet. The choices we make TODAY determine which timeline becomes reality. Let's explore together.`,
      emotion: 'thoughtful'
    },
    future2100: {
      message: `I know this future looks scary. When I first saw these projections, I felt hopeless.

But then I remembered: Every crisis is also an opportunity. Every challenge is a chance to innovate, to fight back, to prove that humanity can adapt and overcome.

That's why I built this platform. We're not giving up. We're gearing up.`,
      emotion: 'concerned'
    }
  },

  dataArt: {
    intro: {
      message: `I used to think data was boring - just numbers and graphs. Then I learned something incredible: Data tells stories.

The ocean's data is especially beautiful and heartbreaking at the same time. Rising temperatures create color patterns. Sea level changes form waves in graphs. Acidification shifts the musical keys of our ocean.

Science and art aren't opposites. They're partners in helping us understand and feel what's happening to our blue planet.`,
      emotion: 'thoughtful'
    }
  },

  oceanSounds: {
    intro: {
      message: `Close your eyes and listen. What you're hearing is the ocean's story told through sound.

Sea level rise becomes deep bass notes. Ocean temperature creates melodic patterns. Acidification shifts the harmony.

Some of my visually impaired friends taught me that not all stories need to be seen - sometimes, they need to be felt and heard.`,
      emotion: 'friendly'
    }
  },

  curriculum: {
    intro: {
      message: `These experiments changed my life.

I went from a kid who loved the beach to someone who could actually understand and protect it. Every experiment taught me something new. Every lesson gave me a tool to fight climate change.

The best part? You don't need expensive equipment. You can do all of these at home with stuff from your kitchen. Science isn't for fancy labs - it's for curious minds anywhere.`,
      emotion: 'encouraging'
    },
    download: {
      message: `Downloading a worksheet? Awesome!

When I was learning, I wished I had materials I could print and share with friends. Now you do. Take these to your science class. Show your family. Teach someone younger than you.

Every person you inspire multiplies our impact. That's how we build a movement of ocean guardians.`,
      emotion: 'encouraging'
    }
  },

  games: {
    intro: {
      message: `Learning doesn't have to be boring. Learning should be an adventure!

These games taught me tsunami safety, coastal engineering, and resource management - all while having fun. My favorite is Rebuild the Coast because it shows how nature-based solutions like oyster reefs and marsh grass can protect communities better than concrete walls.

Play, learn, and remember: You're not just scoring points. You're building real-world skills that could save lives someday.`,
      emotion: 'friendly'
    },
    tsunamiComplete: {
      message: `You survived the tsunami! In a real emergency, that knowledge could save your life and others'.

Remember: Drop, Cover, and Hold On during the earthquake. Then get to high ground immediately - don't wait for warnings. Have an evacuation plan. Know your routes.

I hope you never need this knowledge. But if you do, you're ready.`,
      emotion: 'celebrating'
    }
  },

  community: {
    intro: {
      message: `No guardian works alone. The ocean is too big, the challenges too complex, the work too important.

This is where we connect, share ideas, coordinate cleanups, and support each other. Some of you will organize beach cleanups. Others will lobby your city councils. Some will teach friends and family.

Every role matters. Every guardian counts. Welcome to the crew.`,
      emotion: 'friendly'
    },
    reportSubmitted: {
      message: `Thank you for reporting that coastal issue!

Citizen science like yours helps researchers identify problems they might miss. Your observation could lead to conservation action in your area.

This is what being an ocean guardian looks like - eyes open, voice raised, action taken.`,
      emotion: 'celebrating'
    }
  },

  policy: {
    intro: {
      message: `When I was 14, I felt powerless watching the ocean suffer. Then I learned something: Young voices are powerful voices.

City councils listen when students speak. Politicians respond when youth organize. Change happens when we demand it.

These policy actions aren't just suggestions - they're proven strategies that have worked in communities around the world. Pick one. Start small. Build momentum. Change the world.`,
      emotion: 'encouraging'
    }
  }
};

export default CaptainMarinaGuide;
