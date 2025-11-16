import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trees,
  Home,
  Shield,
  Waves,
  DollarSign,
  TrendingUp,
  Award,
  RefreshCw,
  Info,
  CheckCircle
} from 'lucide-react';

/**
 * Rebuild the Coast - Ocean Conservation Game
 * Point VI from ocean-contest.txt
 *
 * Strategy game where players restore coastal defenses by:
 * - Planting mangroves
 * - Restoring dunes
 * - Fortifying coral reefs
 *
 * Players manage a budget and see real-time impact on coastal protection
 */
const RebuildTheCoast = () => {
  const [budget, setBudget] = useState(100000);
  const [coastalHealth, setCoastalHealth] = useState(30); // 0-100
  const [stormProtection, setStormProtection] = useState(20); // 0-100
  const [biodiversity, setBiodiversity] = useState(25); // 0-100
  const [year, setYear] = useState(2025);
  const [gameState, setGameState] = useState('playing'); // playing, won, lost
  const [placedItems, setPlacedItems] = useState([]);
  const [selectedTool, setSelectedTool] = useState(null);
  const [showInfo, setShowInfo] = useState(true);
  const [events, setEvents] = useState([]);

  const conservationTools = [
    {
      id: 'mangrove',
      name: 'Mangrove Forest',
      icon: Trees,
      cost: 15000,
      coastalHealth: +12,
      stormProtection: +25,
      biodiversity: +20,
      description: 'Natural storm barriers that support diverse marine life',
      color: 'green',
      emoji: '🌳'
    },
    {
      id: 'dune',
      name: 'Dune Restoration',
      icon: Shield,
      cost: 10000,
      coastalHealth: +15,
      stormProtection: +18,
      biodiversity: +8,
      description: 'Sand dunes absorb wave energy and prevent erosion',
      color: 'yellow',
      emoji: '🏖️'
    },
    {
      id: 'coral',
      name: 'Coral Reef Restoration',
      icon: Waves,
      cost: 20000,
      coastalHealth: +10,
      stormProtection: +15,
      biodiversity: +30,
      description: 'Living reefs break waves and host 25% of marine species',
      color: 'blue',
      emoji: '🪸'
    },
    {
      id: 'wetland',
      name: 'Wetland Buffer',
      icon: Home,
      cost: 12000,
      coastalHealth: +13,
      stormProtection: +20,
      biodiversity: +15,
      description: 'Absorbs storm surge and filters pollution',
      color: 'teal',
      emoji: '🌿'
    }
  ];

  // Random events that test player's coastal defenses
  const randomEvents = [
    {
      name: 'Tropical Storm',
      description: 'A category 1 storm approaches!',
      stormProtectionRequired: 40,
      impact: { coastalHealth: -15, stormProtection: -5 }
    },
    {
      name: 'King Tide',
      description: 'Unusually high tide causes flooding',
      stormProtectionRequired: 30,
      impact: { coastalHealth: -10, stormProtection: -3 }
    },
    {
      name: 'Heat Wave',
      description: 'Coral bleaching event!',
      stormProtectionRequired: 35,
      impact: { biodiversity: -12, coastalHealth: -8 }
    }
  ];

  // Advance to next year
  const advanceYear = () => {
    if (year >= 2045) {
      // Check win condition
      if (coastalHealth >= 70 && stormProtection >= 60 && biodiversity >= 50) {
        setGameState('won');
      } else {
        setGameState('lost');
      }
      return;
    }

    // Random event (30% chance)
    if (Math.random() < 0.3) {
      const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
      handleEvent(event);
    }

    // Natural degradation
    setCoastalHealth(prev => Math.max(0, prev - 3));
    setStormProtection(prev => Math.max(0, prev - 2));
    setBiodiversity(prev => Math.max(0, prev - 2));

    // Budget increase (grants, funding)
    setBudget(prev => prev + 25000);
    setYear(prev => prev + 1);
  };

  const handleEvent = (event) => {
    setEvents(prev => [...prev, event]);

    setTimeout(() => {
      if (stormProtection >= event.stormProtectionRequired) {
        // Successfully defended
        setEvents(prev => prev.map(e =>
          e.name === event.name ? { ...e, result: 'defended' } : e
        ));
      } else {
        // Took damage
        setCoastalHealth(prev => Math.max(0, prev + (event.impact.coastalHealth || 0)));
        setStormProtection(prev => Math.max(0, prev + (event.impact.stormProtection || 0)));
        setBiodiversity(prev => Math.max(0, prev + (event.impact.biodiversity || 0)));
        setEvents(prev => prev.map(e =>
          e.name === event.name ? { ...e, result: 'damaged' } : e
        ));
      }

      // Clear event after 3 seconds
      setTimeout(() => {
        setEvents(prev => prev.filter(e => e.name !== event.name));
      }, 3000);
    }, 1000);
  };

  const placeTool = (tool) => {
    if (budget >= tool.cost) {
      setBudget(prev => prev - tool.cost);
      setCoastalHealth(prev => Math.min(100, prev + tool.coastalHealth));
      setStormProtection(prev => Math.min(100, prev + tool.stormProtection));
      setBiodiversity(prev => Math.min(100, prev + tool.biodiversity));

      setPlacedItems(prev => [...prev, {
        ...tool,
        id: `${tool.id}-${Date.now()}`,
        x: Math.random() * 70 + 10,
        y: Math.random() * 40 + 30
      }]);

      setSelectedTool(null);
    }
  };

  const resetGame = () => {
    setBudget(100000);
    setCoastalHealth(30);
    setStormProtection(20);
    setBiodiversity(25);
    setYear(2025);
    setGameState('playing');
    setPlacedItems([]);
    setSelectedTool(null);
    setEvents([]);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Game Info Banner */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl p-6 mb-6 shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2 flex items-center">
                  <Trees className="w-6 h-6 mr-2" />
                  🏖️ Rebuild the Coast
                </h2>
                <p className="mb-3">
                  <strong>Mission:</strong> Restore coastal defenses by 2045! Manage your budget to plant mangroves,
                  restore dunes, and fortify coral reefs. Survive storms and protect communities.
                </p>
                <div className="bg-white/20 rounded p-3">
                  <p className="text-sm">
                    <strong>Win Conditions (by 2045):</strong> Coastal Health ≥70%, Storm Protection ≥60%, Biodiversity ≥50%
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="ml-4 text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard
          icon={DollarSign}
          label="Budget"
          value={`$${(budget / 1000).toFixed(0)}K`}
          color="green"
        />
        <StatCard
          icon={Shield}
          label="Coastal Health"
          value={`${coastalHealth}%`}
          color={coastalHealth >= 70 ? 'green' : coastalHealth >= 40 ? 'yellow' : 'red'}
          progress={coastalHealth}
        />
        <StatCard
          icon={Waves}
          label="Storm Protection"
          value={`${stormProtection}%`}
          color={stormProtection >= 60 ? 'green' : stormProtection >= 30 ? 'yellow' : 'red'}
          progress={stormProtection}
        />
        <StatCard
          icon={Trees}
          label="Biodiversity"
          value={`${biodiversity}%`}
          color={biodiversity >= 50 ? 'green' : biodiversity >= 30 ? 'yellow' : 'red'}
          progress={biodiversity}
        />
        <StatCard
          icon={TrendingUp}
          label="Year"
          value={year}
          color="blue"
        />
      </div>

      {/* Events Display */}
      <AnimatePresence>
        {events.map((event, index) => (
          <motion.div
            key={event.name}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className={`mb-4 p-4 rounded-lg shadow-lg ${
              !event.result ? 'bg-orange-100 border-l-4 border-orange-500' :
              event.result === 'defended' ? 'bg-green-100 border-l-4 border-green-500' :
              'bg-red-100 border-l-4 border-red-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-lg">
                  {event.name}
                  {event.result === 'defended' && ' - Successfully Defended! 🛡️'}
                  {event.result === 'damaged' && ' - Coastal Damage! ⚠️'}
                </h4>
                <p className="text-sm text-gray-700">{event.description}</p>
              </div>
              {!event.result && (
                <div className="animate-pulse text-2xl">⚡</div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Game Board */}
      <div className="bg-gradient-to-b from-sky-300 via-blue-200 to-yellow-100 rounded-xl shadow-2xl p-8 mb-6 relative overflow-hidden min-h-[400px]">
        {/* Ocean waves background */}
        <div className="absolute inset-0 opacity-20">
          <motion.div
            animate={{ x: [-1000, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="text-6xl"
          >
            🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊
          </motion.div>
        </div>

        {/* Placed conservation items */}
        <AnimatePresence>
          {placedItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              style={{ left: `${item.x}%`, top: `${item.y}%` }}
              className="absolute text-4xl cursor-pointer hover:scale-125 transition-transform"
              title={item.name}
            >
              {item.emoji}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Placement hint */}
        {selectedTool && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 px-6 py-3 rounded-full shadow-lg">
            <p className="font-semibold">Click on the coast to place {selectedTool.name}</p>
          </div>
        )}

        {/* Clickable area */}
        {selectedTool && gameState === 'playing' && (
          <div
            className="absolute inset-0 cursor-crosshair"
            onClick={() => placeTool(selectedTool)}
          />
        )}
      </div>

      {/* Conservation Tools */}
      {gameState === 'playing' && (
        <div>
          <h3 className="text-xl font-bold mb-3">Conservation Tools</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {conservationTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                selected={selectedTool?.id === tool.id}
                canAfford={budget >= tool.cost}
                onClick={() => setSelectedTool(tool)}
              />
            ))}
          </div>

          {/* Advance Year Button */}
          <div className="text-center">
            <button
              onClick={advanceYear}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Advance to {year + 1} →
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screens */}
      {gameState === 'won' && <WinScreen onReset={resetGame} stats={{ coastalHealth, stormProtection, biodiversity }} />}
      {gameState === 'lost' && <LoseScreen onReset={resetGame} stats={{ coastalHealth, stormProtection, biodiversity }} />}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color, progress }) => {
  const colorClasses = {
    green: 'text-green-600 bg-green-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    red: 'text-red-600 bg-red-50',
    blue: 'text-blue-600 bg-blue-50'
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg p-4 shadow`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-xs font-semibold opacity-80">{label}</p>
      {progress !== undefined && (
        <div className="mt-2 bg-white/50 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${color === 'green' ? 'bg-green-500' : color === 'yellow' ? 'bg-yellow-500' : color === 'red' ? 'bg-red-500' : 'bg-blue-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

// Tool Card Component
const ToolCard = ({ tool, selected, canAfford, onClick }) => {
  const Icon = tool.icon;

  return (
    <motion.button
      whileHover={{ scale: canAfford ? 1.05 : 1 }}
      whileTap={{ scale: canAfford ? 0.95 : 1 }}
      onClick={canAfford ? onClick : undefined}
      disabled={!canAfford}
      className={`p-4 rounded-lg shadow-md transition-all ${
        selected ? 'ring-4 ring-blue-500 bg-blue-50' :
        canAfford ? 'bg-white hover:shadow-lg' :
        'bg-gray-100 opacity-50 cursor-not-allowed'
      }`}
    >
      <Icon className={`w-8 h-8 mx-auto mb-2 ${canAfford ? `text-${tool.color}-600` : 'text-gray-400'}`} />
      <h4 className="font-bold text-sm mb-1">{tool.name}</h4>
      <p className="text-xs text-gray-600 mb-2">{tool.description}</p>
      <div className="text-xs space-y-1 mb-2">
        <div className="flex justify-between">
          <span>Health:</span>
          <span className="font-semibold text-green-600">+{tool.coastalHealth}%</span>
        </div>
        <div className="flex justify-between">
          <span>Protection:</span>
          <span className="font-semibold text-blue-600">+{tool.stormProtection}%</span>
        </div>
        <div className="flex justify-between">
          <span>Biodiversity:</span>
          <span className="font-semibold text-purple-600">+{tool.biodiversity}%</span>
        </div>
      </div>
      <div className="bg-gray-100 rounded px-2 py-1 text-sm font-bold">
        ${(tool.cost / 1000).toFixed(0)}K
      </div>
    </motion.button>
  );
};

// Win Screen
const WinScreen = ({ onReset, stats }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
  >
    <div className="bg-gradient-to-br from-green-400 to-blue-500 text-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
      <div className="text-center">
        <motion.div
          animate={{ rotate: [0, 10, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
        >
          <Award className="w-24 h-24 mx-auto mb-4" />
        </motion.div>
        <h2 className="text-4xl font-bold mb-4">🎉 Coastal Victory! 🎉</h2>
        <p className="text-xl mb-6">
          You successfully protected the coast by 2045! Communities are safe, ecosystems thrive.
        </p>
        <div className="bg-white/20 rounded-lg p-6 mb-6">
          <h3 className="font-bold text-lg mb-3">Final Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold">{stats.coastalHealth}%</div>
              <div className="text-sm">Coastal Health</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{stats.stormProtection}%</div>
              <div className="text-sm">Storm Protection</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{stats.biodiversity}%</div>
              <div className="text-sm">Biodiversity</div>
            </div>
          </div>
        </div>
        <p className="mb-6">
          This is what's possible when we invest in nature-based solutions. Real coastal protection works!
        </p>
        <button
          onClick={onReset}
          className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors shadow-lg"
        >
          <RefreshCw className="inline w-5 h-5 mr-2" />
          Play Again
        </button>
      </div>
    </div>
  </motion.div>
);

// Lose Screen
const LoseScreen = ({ onReset, stats }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
  >
    <div className="bg-gradient-to-br from-red-400 to-orange-500 text-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
      <div className="text-center">
        <Waves className="w-24 h-24 mx-auto mb-4" />
        <h2 className="text-4xl font-bold mb-4">Coastal Crisis</h2>
        <p className="text-xl mb-6">
          The coast couldn't withstand the impacts. More investment in conservation was needed.
        </p>
        <div className="bg-white/20 rounded-lg p-6 mb-6">
          <h3 className="font-bold text-lg mb-3">Final Stats (Needed Improvement)</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold">{stats.coastalHealth}%</div>
              <div className="text-sm">Coastal Health (need 70%)</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{stats.stormProtection}%</div>
              <div className="text-sm">Storm Protection (need 60%)</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{stats.biodiversity}%</div>
              <div className="text-sm">Biodiversity (need 50%)</div>
            </div>
          </div>
        </div>
        <p className="mb-6">
          <strong>Tip:</strong> Balance all three metrics. Natural solutions like mangroves provide multiple benefits!
        </p>
        <button
          onClick={onReset}
          className="bg-white text-red-600 px-8 py-3 rounded-lg font-bold hover:bg-red-50 transition-colors shadow-lg"
        >
          <RefreshCw className="inline w-5 h-5 mr-2" />
          Try Again
        </button>
      </div>
    </div>
  </motion.div>
);

export default RebuildTheCoast;
