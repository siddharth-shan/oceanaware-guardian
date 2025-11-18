import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  ChevronRight,
  ChevronLeft,
  Check,
  Sunrise,
  Sun,
  Cloud,
  Sunset,
  Moon,
  Star,
  Home,
  Play,
  Sparkles
} from 'lucide-react';
import CaptainMarinaGuide from '../guide/CaptainMarinaGuide';

/**
 * Guided Experience - "A Day in the Life of an Ocean Guardian"
 *
 * Addresses critical gap: "Structure modules into a storyline"
 * Creates cohesive narrative flow through all app features
 * Based on Captain Marina's journey from discovery to community action
 */
const GuidedExperience = ({ onNavigate }) => {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [completedChapters, setCompletedChapters] = useState(new Set());

  // 7-Chapter Storyline
  const chapters = [
    {
      id: 0,
      time: 'Morning - 6:00 AM',
      timeIcon: Sunrise,
      title: 'The Discovery',
      subtitle: 'Walking the beach at dawn',
      color: 'from-orange-400 to-pink-500',
      marinaSays: "It's 6 AM, and I'm walking my favorite beach. The sun is just rising over the ocean...\n\nBut something's wrong. There's more plastic debris than usual. Bottles, bags, fishing nets - all tangled in the seaweed.\n\nI need to understand this problem better. Let me teach you how AI can help us track and identify ocean pollution.",
      mariaEmotion: 'concerned',
      content: {
        type: 'feature-intro',
        feature: 'AI Ocean Guardian',
        description: "Learn how artificial intelligence helps scientists identify and track ocean pollution. You'll train your first AI model - just like real marine researchers do!",
        actionLabel: 'Train AI to Identify Pollution',
        route: 'ai-ocean-guardian'
      },
      reflectionPrompt: "Now you understand how AI can be a powerful tool for ocean conservation. Scientists around the world use similar technology to track plastic pollution, identify marine species, and monitor coral reef health."
    },
    {
      id: 1,
      time: 'Mid-Morning - 9:00 AM',
      timeIcon: Sun,
      title: 'Understanding the Threat',
      subtitle: 'Researching coastal changes',
      color: 'from-yellow-400 to-orange-500',
      marinaSays: "Back home, I'm searching for answers.\n\nWhat's happening to our coastlines? Why is this beach changing? What does the science say?\n\nI found something that changed my perspective forever. Let me show you the timeline - what happened to coastal areas from 2020 to today, and what could happen by 2100 if we don't act.",
      mariaEmotion: 'thoughtful',
      content: {
        type: 'feature-intro',
        feature: 'Interactive Coastal Story',
        description: "Scroll through time to see how climate change transforms coastlines. This isn't science fiction - every projection is based on peer-reviewed research from NOAA, IPCC, and NASA.",
        actionLabel: 'Explore the Timeline',
        route: 'ocean-story'
      },
      reflectionPrompt: "The future isn't inevitable. Every choice we make today affects the timeline. That's why ocean guardians matter."
    },
    {
      id: 2,
      time: 'Noon - 12:00 PM',
      timeIcon: Sun,
      title: 'Seeing the Data',
      subtitle: 'Making sense of the numbers',
      color: 'from-cyan-400 to-blue-500',
      marinaSays: "The story scared me. But I'm a person who needs to see the data.\n\nSo I dove into ocean acidification levels, temperature changes, and sea level rise. The numbers were overwhelming at first.\n\nThen I realized: data can be beautiful. It can tell a story. Let me show you how we can visualize the ocean's health in a way that makes sense.",
      mariaEmotion: 'teaching',
      content: {
        type: 'feature-intro',
        feature: 'Data Art Triptych',
        description: "Explore interactive visualizations that transform ocean data into art. Each chart tells part of the story - temperature rise, acidification, and coastal vulnerability.",
        actionLabel: 'Explore Ocean Data',
        route: 'data-art'
      },
      reflectionPrompt: "Beautiful data isn't just pretty - it helps us understand complex systems and communicate urgency to others."
    },
    {
      id: 3,
      time: 'Afternoon - 3:00 PM',
      timeIcon: Cloud,
      title: 'Learning Solutions',
      subtitle: 'Discovering what I can do',
      color: 'from-blue-400 to-indigo-500',
      marinaSays: "Data and scary timelines left me feeling helpless. I kept asking: 'What can I actually DO?'\n\nThat's when I discovered that science isn't just about understanding problems - it's about finding solutions.\n\nI started doing experiments at home with simple materials. Each one taught me something new about how the ocean works and how we can protect it.",
      mariaEmotion: 'encouraging',
      content: {
        type: 'feature-intro',
        feature: 'Ocean Curriculum',
        description: "Browse experiments, lesson plans, and learning resources. These are the activities that transformed me from a worried kid to an empowered guardian.",
        actionLabel: 'Explore Learning Resources',
        route: 'ocean-curriculum'
      },
      reflectionPrompt: "Knowledge is power. Every experiment you do, every lesson you learn, makes you more capable of protecting what you love."
    },
    {
      id: 4,
      time: 'Evening - 5:00 PM',
      timeIcon: Sunset,
      title: 'Taking Action',
      subtitle: 'Making my first commitment',
      color: 'from-purple-400 to-pink-500',
      marinaSays: "Learning gave me hope. But I needed to turn that hope into action.\n\nI sat down and asked myself: 'What's ONE thing I can start doing today?'\n\nNot save the whole ocean. Not solve climate change. Just... one concrete action I could commit to.\n\nLet me show you the path I followed - from individual actions to community organizing to policy advocacy.",
      mariaEmotion: 'encouraging',
      content: {
        type: 'feature-intro',
        feature: 'Policy & Action Engine',
        description: "Explore personalized action recommendations. Pick ONE thing to commit to today - whether it's eliminating plastic, supporting coastal protection, or contacting representatives.",
        actionLabel: 'Find Your Action',
        route: 'community-action'
      },
      reflectionPrompt: "You don't have to do everything. Just pick one action and start. Progress, not perfection."
    },
    {
      id: 5,
      time: 'Night - 7:00 PM',
      timeIcon: Moon,
      title: 'Playing to Learn',
      subtitle: 'Preparing for the future',
      color: 'from-indigo-500 to-purple-600',
      marinaSays: "That evening, I thought about tsunamis, coastal erosion, and extreme weather.\n\nThese threats felt scary and abstract. So I created games - ways to learn about ocean dangers while staying hopeful and empowered.\n\nGames teach us to think strategically, make quick decisions, and understand complex systems. Let me show you how play can prepare us for real-world challenges.",
      mariaEmotion: 'friendly',
      content: {
        type: 'feature-intro',
        feature: 'Conservation Games',
        description: "Play games that teach real ocean conservation skills. Learn tsunami evacuation routes, practice coastal restoration strategies, and understand erosion control methods.",
        actionLabel: 'Start Playing',
        route: 'ocean-quests'
      },
      reflectionPrompt: "Learning doesn't have to be serious to be effective. Play, experiment, and enjoy the journey of becoming an ocean guardian."
    },
    {
      id: 6,
      time: 'Next Morning - 7:00 AM',
      timeIcon: Star,
      title: 'Building Community',
      subtitle: 'Realizing I am not alone',
      color: 'from-teal-400 to-green-500',
      marinaSays: "I woke up the next day feeling different. I had tools, knowledge, and a commitment.\n\nBut I also realized: I can't do this alone. No guardian can.\n\nThat's when I started looking for my crew - other people who care about the ocean, who want to make a difference, who are ready to take action together.\n\nLet me show you how we can connect, organize, and multiply our impact.",
      mariaEmotion: 'celebrating',
      content: {
        type: 'feature-intro',
        feature: 'Community Hub',
        description: "Connect with other ocean guardians. Share reports, coordinate local actions, and build the movement for ocean conservation.",
        actionLabel: 'Join the Community',
        route: 'community-action'
      },
      reflectionPrompt: "Every guardian needs a crew. Together, we're not just learning about the ocean - we're building the movement to protect it."
    }
  ];

  const currentChapterData = chapters[currentChapter];
  const TimeIcon = currentChapterData.timeIcon;

  const handleNext = () => {
    setCompletedChapters(prev => new Set([...prev, currentChapter]));
    if (currentChapter < chapters.length - 1) {
      setCurrentChapter(currentChapter + 1);
    }
  };

  const handlePrevious = () => {
    if (currentChapter > 0) {
      setCurrentChapter(currentChapter - 1);
    }
  };

  const handleNavigateToFeature = (route) => {
    setCompletedChapters(prev => new Set([...prev, currentChapter]));
    if (onNavigate) {
      onNavigate(route);
    }
  };

  const isLastChapter = currentChapter === chapters.length - 1;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl p-8 mb-8 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Compass className="w-10 h-10" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Captain Marina's Journey</h1>
              <p className="text-lg opacity-90">A Day in the Life of an Ocean Guardian</p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2 text-center">
            <div className="text-sm opacity-90">Chapter</div>
            <div className="text-2xl font-bold">{currentChapter + 1}/7</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/20 rounded-full h-3 overflow-hidden">
          <div
            className="bg-white h-full transition-all duration-500 rounded-full"
            style={{ width: `${((currentChapter + 1) / chapters.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Chapter Timeline */}
      <div className="mb-8 overflow-x-auto pb-4">
        <div className="flex gap-2 min-w-max px-2">
          {chapters.map((chapter, index) => {
            const ChapterIcon = chapter.timeIcon;
            const isCompleted = completedChapters.has(index);
            const isCurrent = index === currentChapter;
            const isAccessible = index <= currentChapter || completedChapters.has(index);

            return (
              <button
                key={chapter.id}
                onClick={() => isAccessible && setCurrentChapter(index)}
                disabled={!isAccessible}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                  isCurrent
                    ? 'bg-blue-100 border-2 border-blue-500 shadow-md'
                    : isCompleted
                    ? 'bg-green-50 border-2 border-green-400 hover:shadow-md'
                    : isAccessible
                    ? 'bg-gray-50 border-2 border-gray-300 hover:bg-gray-100'
                    : 'bg-gray-50 border-2 border-gray-200 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className={`${
                  isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-gray-300'
                } text-white p-2 rounded-full relative`}>
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <ChapterIcon className="w-5 h-5" />
                  )}
                </div>
                <div className="text-center">
                  <div className="text-xs font-semibold text-gray-900 whitespace-nowrap">
                    Ch. {index + 1}
                  </div>
                  <div className="text-xs text-gray-600 whitespace-nowrap max-w-[80px] truncate">
                    {chapter.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chapter Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentChapter}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
        >
          {/* Chapter Header */}
          <div className={`bg-gradient-to-r ${currentChapterData.color} text-white rounded-xl p-8 mb-6 shadow-xl`}>
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-white/20 backdrop-blur p-3 rounded-lg">
                <TimeIcon className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <div className="text-sm opacity-90 mb-1">{currentChapterData.time}</div>
                <h2 className="text-3xl font-bold mb-1">{currentChapterData.title}</h2>
                <p className="text-lg opacity-95">{currentChapterData.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Captain Marina's Message */}
          <div className="mb-6">
            <CaptainMarinaGuide
              message={currentChapterData.marinaSays}
              emotion={currentChapterData.mariaEmotion}
              position="relative"
              dismissible={false}
              showInitially={true}
            />
          </div>

          {/* Feature Introduction */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border-2 border-gray-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentChapterData.content.feature}
                </h3>
                <p className="text-gray-700 text-lg">
                  {currentChapterData.content.description}
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-blue-200">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Play className="w-5 h-5 text-blue-600" />
                Ready to explore?
              </h4>
              <p className="text-gray-700 mb-4">
                Click the button below to experience this feature. You can always return to continue
                the journey where you left off.
              </p>
              <button
                onClick={() => handleNavigateToFeature(currentChapterData.content.route)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-bold hover:shadow-xl transition-all flex items-center gap-2"
              >
                {currentChapterData.content.actionLabel}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Reflection */}
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6 mb-6">
            <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Ocean Guardian Insight
            </h4>
            <p className="text-gray-700 italic">
              "{currentChapterData.reflectionPrompt}"
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentChapter === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                currentChapter === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Previous Chapter
            </button>

            <div className="flex-1 text-center">
              <button
                onClick={() => onNavigate && onNavigate('dashboard')}
                className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 mx-auto"
              >
                <Home className="w-4 h-4" />
                Return to Dashboard
              </button>
            </div>

            <button
              onClick={handleNext}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                isLastChapter
                  ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-xl'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl'
              }`}
            >
              {isLastChapter ? 'Complete Journey' : 'Next Chapter'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Completion Message */}
          {isLastChapter && completedChapters.has(currentChapter) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl p-8 text-center shadow-xl"
            >
              <Star className="w-16 h-16 mx-auto mb-4 animate-pulse" />
              <h2 className="text-3xl font-bold mb-3">Congratulations, Ocean Guardian!</h2>
              <p className="text-xl opacity-95 mb-4">
                You've completed Captain Marina's journey and explored all the tools in your
                conservation toolkit.
              </p>
              <p className="text-lg mb-6">
                Now it's time to put your knowledge into action. Return to the dashboard and start
                making a difference!
              </p>
              <button
                onClick={() => onNavigate && onNavigate('dashboard')}
                className="bg-white text-green-600 px-8 py-4 rounded-lg font-bold hover:bg-green-50 transition-all inline-flex items-center gap-2 shadow-lg"
              >
                <Home className="w-5 h-5" />
                Go to Dashboard
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default GuidedExperience;
