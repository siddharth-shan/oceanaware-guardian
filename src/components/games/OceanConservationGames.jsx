import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, ArrowLeft, Trees, Waves, TrendingDown, Award, Fish } from 'lucide-react';
import RebuildTheCoast from './RebuildTheCoast';
import TsunamiEscape from './TsunamiEscape';
import StopTheShrinkingBeach from './StopTheShrinkingBeach';
import OceanGuardianGame from './OceanGuardianGame';
import CaptainMarinaGuide, { marinaMessages } from '../guide/CaptainMarinaGuide';

/**
 * Ocean Conservation Games Hub
 * Point VI from ocean-contest.txt
 *
 * Four interactive educational games:
 * 1. Ocean Guardian - Marine conservation adventure (NEW!)
 * 2. Rebuild the Coast - Restoration strategy game
 * 3. Tsunami Escape - Evacuation route learning
 * 4. Stop the Shrinking Beach - Erosion control strategy
 */
const OceanConservationGames = () => {
  const [selectedGame, setSelectedGame] = useState(null);

  const games = [
    {
      id: 'ocean-guardian',
      name: 'Ocean Guardian',
      icon: Fish,
      emoji: '🐠',
      description: 'Complete 5 missions to protect marine life! Clean oceans, restore reefs, rescue animals, and collect creatures in your virtual aquarium.',
      difficulty: 'Beginner-Expert',
      duration: '10-25 min per mission',
      skills: ['Marine Biology', 'Conservation', 'Problem Solving', 'Environmental Awareness'],
      color: 'from-cyan-500 to-blue-600',
      component: OceanGuardianGame,
      badge: 'NEW!'
    },
    {
      id: 'rebuild',
      name: 'Rebuild the Coast',
      icon: Trees,
      emoji: '🏖️',
      description: 'Restore coastal defenses by planting mangroves, restoring dunes, and fortifying coral reefs',
      difficulty: 'Medium',
      duration: '15-20 min',
      skills: ['Strategy', 'Resource Management', 'Ecology'],
      color: 'from-green-500 to-emerald-600',
      component: RebuildTheCoast
    },
    {
      id: 'tsunami',
      name: 'Tsunami Escape',
      icon: Waves,
      emoji: '🌊',
      description: 'Learn evacuation routes, recognize tsunami warning signs, and make split-second safety decisions',
      difficulty: 'Easy-Hard',
      duration: '10-15 min',
      skills: ['Decision Making', 'Safety Knowledge', 'Emergency Response'],
      color: 'from-blue-500 to-cyan-600',
      component: TsunamiEscape
    },
    {
      id: 'erosion',
      name: 'Stop the Shrinking Beach',
      icon: TrendingDown,
      emoji: '⏳',
      description: 'Strategize erosion control methods: barriers, vegetation, development management',
      difficulty: 'Hard',
      duration: '20-25 min',
      skills: ['Long-term Planning', 'Trade-offs', 'Natural Solutions'],
      color: 'from-orange-500 to-red-600',
      component: StopTheShrinkingBeach
    }
  ];

  if (selectedGame) {
    const game = games.find(g => g.id === selectedGame);
    const GameComponent = game.component;

    return (
      <div>
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => setSelectedGame(null)}
            className="flex items-center text-blue-600 hover:text-blue-800 font-semibold transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Games Menu
          </button>
        </div>

        {/* Game Component */}
        <GameComponent />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white rounded-xl p-8 mb-8 shadow-xl">
        <div className="flex items-center justify-center mb-4">
          <Gamepad2 className="w-16 h-16 mr-4 animate-pulse" />
          <div>
            <h1 className="text-4xl font-bold">🎮 Ocean Conservation Games</h1>
            <p className="text-xl opacity-90 mt-1">Learn through play, protect through action</p>
          </div>
        </div>

        <div className="bg-white/20 backdrop-blur rounded-lg p-6 mt-6">
          <h3 className="font-bold text-lg mb-3">Why Games Matter for Conservation</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white/10 rounded p-3">
              <div className="font-bold mb-1">🧠 Active Learning</div>
              <p className="text-xs opacity-90">
                Hands-on experience creates deeper understanding than passive reading
              </p>
            </div>
            <div className="bg-white/10 rounded p-3">
              <div className="font-bold mb-1">🎯 Real-World Skills</div>
              <p className="text-xs opacity-90">
                Practice decision-making in safe, simulated environments
              </p>
            </div>
            <div className="bg-white/10 rounded p-3">
              <div className="font-bold mb-1">💡 Systems Thinking</div>
              <p className="text-xs opacity-90">
                See how individual actions create cascading environmental impacts
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {games.map((game, index) => (
          <GameCard key={game.id} game={game} index={index} onSelect={() => setSelectedGame(game.id)} />
        ))}
      </div>

      {/* Educational Context */}
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
        <h3 className="text-xl font-bold text-blue-900 mb-3 flex items-center">
          <Award className="w-6 h-6 mr-2" />
          Designed for the 2026 Ocean Awareness Contest
        </h3>
        <p className="text-blue-800 mb-4">
          These games align with Bow Seat's emphasis on <strong>interactive education, youth activism, and innovative storytelling</strong>.
          Each game teaches real-world ocean conservation principles while empowering you to take action.
        </p>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white rounded p-4">
            <h4 className="font-bold text-blue-900 mb-2">🌊 Based on Real Science</h4>
            <ul className="text-blue-800 space-y-1 text-xs">
              <li>• NOAA coastal erosion data</li>
              <li>• USGS tsunami research</li>
              <li>• Nature Conservancy restoration studies</li>
              <li>• Peer-reviewed climate science</li>
            </ul>
          </div>
          <div className="bg-white rounded p-4">
            <h4 className="font-bold text-green-900 mb-2">🎯 Actionable Outcomes</h4>
            <ul className="text-green-800 space-y-1 text-xs">
              <li>• Learn tsunami evacuation skills</li>
              <li>• Understand coastal restoration methods</li>
              <li>• Compare natural vs artificial solutions</li>
              <li>• Apply knowledge to real-world advocacy</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Captain Marina Guide - Games Introduction */}
      <CaptainMarinaGuide
        message={marinaMessages.games.intro.message}
        emotion={marinaMessages.games.intro.emotion}
        position="bottom-right"
        dismissible={true}
        showInitially={true}
      />
    </div>
  );
};

// Game Card Component
const GameCard = ({ game, index, onSelect }) => {
  const Icon = game.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ scale: 1.05, y: -10 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-all"
      onClick={onSelect}
    >
      {/* Gradient Header */}
      <div className={`bg-gradient-to-r ${game.color} p-6 text-white relative`}>
        {game.badge && (
          <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
            {game.badge}
          </div>
        )}
        <div className="flex items-center justify-between mb-3">
          <Icon className="w-12 h-12" />
          <span className="text-5xl">{game.emoji}</span>
        </div>
        <h3 className="text-2xl font-bold">{game.name}</h3>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-gray-700 mb-4 min-h-[4rem]">{game.description}</p>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Difficulty:</span>
            <span className="font-semibold text-gray-900">{game.difficulty}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Duration:</span>
            <span className="font-semibold text-gray-900">{game.duration}</span>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-xs font-bold text-gray-600 mb-2">Skills You'll Learn:</h4>
          <div className="flex flex-wrap gap-2">
            {game.skills.map((skill, i) => (
              <span
                key={i}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <button
          className={`w-full bg-gradient-to-r ${game.color} text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity shadow-md`}
        >
          Play Now →
        </button>
      </div>
    </motion.div>
  );
};

export default OceanConservationGames;
