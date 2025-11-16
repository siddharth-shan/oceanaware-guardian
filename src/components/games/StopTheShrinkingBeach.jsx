import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingDown,
  Hammer,
  Trees,
  Shield,
  Home,
  DollarSign,
  Award,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Waves
} from 'lucide-react';

/**
 * Stop the Shrinking Beach - Erosion Control Strategy Game
 * Point VI from ocean-contest.txt
 *
 * Players strategize to prevent coastal erosion by placing barriers,
 * restoring vegetation, and managing development
 * Learn about natural vs artificial solutions
 */
const StopTheShrinkingBeach = () => {
  const [gameState, setGameState] = useState('intro'); // intro, playing, won, lost
  const [beachWidth, setBeachWidth] = useState(100); // meters
  const [budget, setBudget] = useState(500000);
  const [year, setYear] = useState(1);
  const [placedSolutions, setPlacedSolutions] = useState([]);
  const [naturalHealth, setNaturalHealth] = useState(50); // Natural ecosystem health
  const [communitySupport, setCommunitySupport] = useState(70); // Public support
  const [events, setEvents] = useState([]);
  const [selectedSolution, setSelectedSolution] = useState(null);
  const [showInfo, setShowInfo] = useState(true);

  const erosionSolutions = [
    {
      id: 'seawall',
      name: 'Concrete Seawall',
      type: 'Hard Engineering',
      icon: Shield,
      cost: 150000,
      erosionPrevention: 25,
      naturalHealth: -15,
      communitySupport: -10,
      maintenance: 10000,
      lifespan: 20,
      description: 'Vertical wall blocks waves but can worsen erosion nearby',
      pros: ['Strong wave protection', 'Immediate results', 'Protects infrastructure'],
      cons: ['Damages ecosystem', 'Reflects wave energy', 'Ugly appearance', 'High maintenance'],
      color: 'gray',
      emoji: '🧱'
    },
    {
      id: 'groyne',
      name: 'Rock Groynes',
      type: 'Hard Engineering',
      icon: Hammer,
      cost: 100000,
      erosionPrevention: 18,
      naturalHealth: -8,
      communitySupport: -5,
      maintenance: 8000,
      lifespan: 25,
      description: 'Rock barriers trap sand but starve downdrift beaches',
      pros: ['Retains sediment', 'Moderately effective', 'Long-lasting'],
      cons: ['Starves adjacent beaches', 'Habitat disruption', 'Navigation hazard'],
      color: 'stone',
      emoji: '🪨'
    },
    {
      id: 'beachNourishment',
      name: 'Beach Nourishment',
      type: 'Soft Engineering',
      icon: Waves,
      cost: 120000,
      erosionPrevention: 15,
      naturalHealth: 5,
      communitySupport: 15,
      maintenance: 30000,
      lifespan: 5,
      description: 'Add sand to beach - natural look but temporary',
      pros: ['Natural appearance', 'Improves recreation', 'Habitat friendly'],
      cons: ['Temporary solution', 'Frequent renewal', 'Expensive long-term'],
      color: 'yellow',
      emoji: '🏖️'
    },
    {
      id: 'duneRestoration',
      name: 'Dune Restoration',
      type: 'Nature-Based',
      icon: Trees,
      cost: 60000,
      erosionPrevention: 20,
      naturalHealth: 25,
      communitySupport: 20,
      maintenance: 3000,
      lifespan: 50,
      description: 'Plant native vegetation to stabilize sand naturally',
      pros: ['Natural protection', 'Habitat creation', 'Low maintenance', 'Self-regenerating'],
      cons: ['Takes time to establish', 'Requires space', 'Vulnerable initially'],
      color: 'green',
      emoji: '🌾'
    },
    {
      id: 'livingShore',
      name: 'Living Shoreline',
      type: 'Nature-Based',
      icon: Trees,
      cost: 80000,
      erosionPrevention: 22,
      naturalHealth: 30,
      communitySupport: 18,
      maintenance: 4000,
      lifespan: 100,
      description: 'Oyster reefs, marsh grass, and natural materials',
      pros: ['Excellent habitat', 'Self-sustaining', 'Water filtration', 'Climate resilient'],
      cons: ['Slower results', 'Needs suitable conditions', 'Less protection initially'],
      color: 'teal',
      emoji: '🌿'
    },
    {
      id: 'managedRetreat',
      name: 'Managed Retreat',
      type: 'Planning',
      icon: Home,
      cost: 200000,
      erosionPrevention: 0,
      naturalHealth: 40,
      communitySupport: -30,
      maintenance: 0,
      lifespan: 999,
      description: 'Relocate development inland, let nature adapt',
      pros: ['Long-term sustainability', 'Ecosystem recovery', 'No maintenance', 'Climate adaptation'],
      cons: ['Very unpopular', 'Upfront costs', 'Community disruption'],
      color: 'blue',
      emoji: '↩️'
    }
  ];

  const stormEvents = [
    {
      name: 'Minor Storm',
      severity: 'low',
      erosion: 8,
      description: 'Moderate waves and wind',
      probability: 0.5
    },
    {
      name: 'Coastal Storm',
      severity: 'medium',
      erosion: 15,
      description: 'High surf and storm surge',
      probability: 0.3
    },
    {
      name: 'Hurricane',
      severity: 'high',
      erosion: 30,
      description: 'Category 1-2 hurricane impact',
      probability: 0.15
    },
    {
      name: 'King Tides',
      severity: 'low',
      erosion: 5,
      description: 'Seasonal high tides',
      probability: 0.4
    }
  ];

  // Place a solution
  const placeSolution = (solution) => {
    if (budget >= solution.cost) {
      setBudget(prev => prev - solution.cost);
      setNaturalHealth(prev => Math.min(100, Math.max(0, prev + solution.naturalHealth)));
      setCommunitySupport(prev => Math.min(100, Math.max(0, prev + solution.communitySupport)));

      setPlacedSolutions(prev => [...prev, {
        ...solution,
        placedYear: year,
        id: `${solution.id}-${Date.now()}`
      }]);

      setSelectedSolution(null);
    }
  };

  // Advance year
  const advanceYear = () => {
    if (year >= 20) {
      // Check win condition
      if (beachWidth >= 80) {
        setGameState('won');
      } else {
        setGameState('lost');
      }
      return;
    }

    let erosionReduction = 0;
    let maintenanceCosts = 0;

    // Calculate protection from placed solutions
    placedSolutions.forEach(solution => {
      const age = year - solution.placedYear;
      if (age < solution.lifespan) {
        // Effectiveness decreases over time
        const effectiveness = 1 - (age / solution.lifespan) * 0.5;
        erosionReduction += solution.erosionPrevention * effectiveness;
        maintenanceCosts += solution.maintenance;
      }
    });

    // Pay maintenance
    setBudget(prev => prev - maintenanceCosts);

    // Random storm event
    const stormRoll = Math.random();
    let stormErosion = 0;

    for (const event of stormEvents) {
      if (stormRoll < event.probability) {
        const netErosion = Math.max(0, event.erosion - erosionReduction);
        stormErosion = netErosion;

        setEvents(prev => [...prev, {
          year,
          type: event.name,
          severity: event.severity,
          erosion: netErosion,
          prevented: event.erosion - netErosion
        }]);

        setTimeout(() => {
          setEvents(prev => prev.filter(e => e.year !== year));
        }, 4000);

        break;
      }
    }

    // Natural erosion + storm damage
    const baseErosion = 3; // Natural erosion per year
    const totalErosion = Math.max(0, baseErosion + stormErosion - erosionReduction * 0.3);

    setBeachWidth(prev => Math.max(0, prev - totalErosion));

    // Natural recovery (if natural solutions present)
    const naturalBonus = placedSolutions.filter(s => s.type === 'Nature-Based').length * 0.5;
    setBeachWidth(prev => Math.min(150, prev + naturalBonus));

    // Budget increase (grants, taxes)
    setBudget(prev => prev + 100000);
    setYear(prev => prev + 1);
  };

  const resetGame = () => {
    setGameState('intro');
    setBeachWidth(100);
    setBudget(500000);
    setYear(1);
    setPlacedSolutions([]);
    setNaturalHealth(50);
    setCommunitySupport(70);
    setEvents([]);
    setSelectedSolution(null);
    setShowInfo(true);
  };

  // Intro screen
  if (gameState === 'intro') {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-yellow-600 via-orange-500 to-red-500 text-white rounded-xl p-8 mb-8 shadow-xl">
          <div className="flex items-center justify-center mb-4">
            <TrendingDown className="w-16 h-16 mr-4" />
            <h1 className="text-4xl font-bold">⏳ Stop the Shrinking Beach</h1>
          </div>
          <p className="text-xl text-center mb-4">
            Your coastal community faces severe erosion. Can you save the beach?
          </p>
          <div className="bg-white/20 rounded-lg p-6 mb-4">
            <h3 className="font-bold text-lg mb-3">Your Mission:</h3>
            <ul className="space-y-2">
              <li>• Maintain beach width above 80 meters for 20 years</li>
              <li>• Balance budget, ecosystem health, and community support</li>
              <li>• Choose between hard engineering, soft solutions, and nature-based approaches</li>
              <li>• Survive storms while protecting the coastline</li>
            </ul>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded p-3">
              <h4 className="font-bold mb-1">Hard Engineering</h4>
              <p className="text-sm">Seawalls, groynes - strong but disruptive</p>
            </div>
            <div className="bg-white/10 rounded p-3">
              <h4 className="font-bold mb-1">Soft Engineering</h4>
              <p className="text-sm">Beach nourishment - natural but temporary</p>
            </div>
            <div className="bg-white/10 rounded p-3">
              <h4 className="font-bold mb-1">Nature-Based</h4>
              <p className="text-sm">Dunes, living shores - sustainable long-term</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => setGameState('playing')}
            className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-12 py-4 rounded-lg font-bold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            Start Challenge
          </button>
        </div>

        <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center">
            <Info className="w-5 h-5 mr-2" />
            Real-World Context
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• <strong>75% of U.S. beaches are eroding</strong> - USGS data</li>
            <li>• Hard structures often worsen erosion on adjacent beaches</li>
            <li>• Nature-based solutions provide 2-5x better cost-benefit ratio long-term</li>
            <li>• Living shorelines sequester carbon while preventing erosion</li>
            <li>• <strong>Managed retreat</strong> is often the most sustainable but least popular option</li>
          </ul>
        </div>
      </div>
    );
  }

  // Playing state
  if (gameState === 'playing') {
    const beachHealth = beachWidth >= 100 ? 'Healthy' : beachWidth >= 80 ? 'Stable' : beachWidth >= 60 ? 'Eroding' : 'Critical';
    const healthColor = beachWidth >= 100 ? 'green' : beachWidth >= 80 ? 'yellow' : beachWidth >= 60 ? 'orange' : 'red';

    return (
      <div className="max-w-7xl mx-auto">
        {/* Info Banner */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl p-6 mb-6 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">🏖️ Beach Erosion Challenge</h3>
                  <p className="mb-2">
                    <strong>Goal:</strong> Keep beach ≥80m wide for 20 years. Balance effectiveness, cost, and ecosystem health.
                  </p>
                  <p className="text-sm bg-white/20 rounded p-2">
                    💡 <strong>Pro Tip:</strong> Nature-based solutions are cheaper long-term and improve ecosystem health!
                  </p>
                </div>
                <button onClick={() => setShowInfo(false)} className="text-white/80 hover:text-white">✕</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard
            icon={TrendingDown}
            label="Beach Width"
            value={`${beachWidth.toFixed(1)}m`}
            subtext={beachHealth}
            color={healthColor}
            progress={beachWidth}
            maxProgress={150}
          />
          <StatCard
            icon={DollarSign}
            label="Budget"
            value={`$${(budget / 1000).toFixed(0)}K`}
            color={budget > 200000 ? 'green' : budget > 100000 ? 'yellow' : 'red'}
          />
          <StatCard
            icon={Trees}
            label="Ecosystem Health"
            value={`${naturalHealth}%`}
            color={naturalHealth >= 70 ? 'green' : naturalHealth >= 40 ? 'yellow' : 'red'}
            progress={naturalHealth}
          />
          <StatCard
            icon={Home}
            label="Public Support"
            value={`${communitySupport}%`}
            color={communitySupport >= 70 ? 'green' : communitySupport >= 40 ? 'yellow' : 'red'}
            progress={communitySupport}
          />
          <StatCard
            icon={Award}
            label="Year"
            value={`${year}/20`}
            color="blue"
          />
        </div>

        {/* Storm Events */}
        <AnimatePresence>
          {events.map((event, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className={`mb-4 p-4 rounded-lg shadow-lg ${
                event.severity === 'high' ? 'bg-red-100 border-l-4 border-red-500' :
                event.severity === 'medium' ? 'bg-orange-100 border-l-4 border-orange-500' :
                'bg-yellow-100 border-l-4 border-yellow-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-lg flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    {event.type}
                  </h4>
                  <p className="text-sm">
                    Erosion: {event.erosion.toFixed(1)}m
                    {event.prevented > 0 && (
                      <span className="text-green-700 font-semibold"> (Prevented {event.prevented.toFixed(1)}m!)</span>
                    )}
                  </p>
                </div>
                <div className="text-3xl">
                  {event.severity === 'high' ? '🌀' : event.severity === 'medium' ? '🌊' : '💨'}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Beach Visualization */}
        <div className="bg-gradient-to-b from-sky-300 to-yellow-100 rounded-xl shadow-2xl p-8 mb-6 relative overflow-hidden" style={{ minHeight: '300px' }}>
          {/* Ocean */}
          <div className="absolute left-0 top-0 bottom-0 bg-blue-500 opacity-40" style={{ width: `${Math.max(0, 100 - beachWidth)}%` }}>
            <motion.div
              animate={{ x: [-20, 0, -20] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-4xl opacity-50"
            >
              🌊🌊🌊🌊🌊🌊
            </motion.div>
          </div>

          {/* Beach */}
          <div className="absolute right-0 top-0 bottom-0 bg-yellow-200" style={{ width: `${Math.min(100, beachWidth)}%` }}>
            {/* Placed solutions */}
            {placedSolutions.map((solution, index) => (
              <div
                key={solution.id}
                className="absolute text-3xl cursor-pointer hover:scale-125 transition-transform"
                style={{
                  left: `${10 + index * 15}%`,
                  top: `${30 + (index % 3) * 20}%`
                }}
                title={`${solution.name} (Age: ${year - solution.placedYear} years)`}
              >
                {solution.emoji}
              </div>
            ))}
          </div>

          {/* Width indicator */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full">
            <span className="font-bold">{beachWidth.toFixed(1)}m wide</span>
          </div>
        </div>

        {/* Solutions Grid */}
        <div>
          <h3 className="text-2xl font-bold mb-4">Erosion Control Solutions</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {erosionSolutions.map((solution) => (
              <SolutionCard
                key={solution.id}
                solution={solution}
                selected={selectedSolution?.id === solution.id}
                canAfford={budget >= solution.cost}
                onClick={() => setSelectedSolution(solution)}
                onPlace={() => placeSolution(solution)}
              />
            ))}
          </div>

          {/* Advance Year */}
          <div className="text-center">
            <button
              onClick={advanceYear}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Advance to Year {year + 1} →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Win/Lose screens
  if (gameState === 'won') {
    return <WinScreen beachWidth={beachWidth} placedSolutions={placedSolutions} naturalHealth={naturalHealth} onReset={resetGame} />;
  }

  if (gameState === 'lost') {
    return <LoseScreen beachWidth={beachWidth} placedSolutions={placedSolutions} onReset={resetGame} />;
  }

  return null;
};

// Stat Card
const StatCard = ({ icon: Icon, label, value, subtext, color, progress, maxProgress = 100 }) => {
  const colorClasses = {
    green: 'text-green-600 bg-green-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50',
    blue: 'text-blue-600 bg-blue-50'
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg p-4 shadow`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-xl font-bold">{value}</span>
      </div>
      <p className="text-xs font-semibold opacity-80">{label}</p>
      {subtext && <p className="text-xs mt-1">{subtext}</p>}
      {progress !== undefined && (
        <div className="mt-2 bg-white/50 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${color === 'green' ? 'bg-green-500' : color === 'yellow' ? 'bg-yellow-500' : color === 'orange' ? 'bg-orange-500' : color === 'red' ? 'bg-red-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(100, (progress / maxProgress) * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

// Solution Card
const SolutionCard = ({ solution, selected, canAfford, onClick, onPlace }) => {
  const Icon = solution.icon;
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="relative">
      <motion.div
        whileHover={{ scale: canAfford ? 1.02 : 1 }}
        className={`p-4 rounded-lg shadow-md transition-all ${
          selected ? 'ring-4 ring-blue-500 bg-blue-50' :
          canAfford ? 'bg-white hover:shadow-lg' :
          'bg-gray-100 opacity-60 cursor-not-allowed'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center">
            <span className="text-2xl mr-2">{solution.emoji}</span>
            <div>
              <h4 className="font-bold text-sm">{solution.name}</h4>
              <p className="text-xs text-gray-600">{solution.type}</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-gray-700 mb-3">{solution.description}</p>

        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div>
            <span className="text-gray-600">Protection:</span>
            <span className="font-semibold text-blue-600 ml-1">+{solution.erosionPrevention}</span>
          </div>
          <div>
            <span className="text-gray-600">Ecosystem:</span>
            <span className={`font-semibold ml-1 ${solution.naturalHealth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {solution.naturalHealth >= 0 ? '+' : ''}{solution.naturalHealth}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Support:</span>
            <span className={`font-semibold ml-1 ${solution.communitySupport >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
              {solution.communitySupport >= 0 ? '+' : ''}{solution.communitySupport}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Lifespan:</span>
            <span className="font-semibold ml-1">{solution.lifespan}y</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="bg-gray-100 rounded px-2 py-1 text-sm">
            <strong>Cost:</strong> ${(solution.cost / 1000).toFixed(0)}K
            <br />
            <span className="text-xs">Maintenance: ${(solution.maintenance / 1000).toFixed(0)}K/year</span>
          </div>

          <button
            onClick={canAfford ? onPlace : undefined}
            disabled={!canAfford}
            className={`w-full py-2 rounded font-semibold text-sm ${
              canAfford
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canAfford ? 'Implement' : 'Insufficient Budget'}
          </button>
        </div>

        {/* Detailed view */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="mb-2">
              <h5 className="text-xs font-bold text-green-700 mb-1">Pros:</h5>
              <ul className="text-xs space-y-0.5">
                {solution.pros.map((pro, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle className="w-3 h-3 text-green-600 mr-1 mt-0.5 flex-shrink-0" />
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-bold text-red-700 mb-1">Cons:</h5>
              <ul className="text-xs space-y-0.5">
                {solution.cons.map((con, i) => (
                  <li key={i} className="flex items-start">
                    <XCircle className="w-3 h-3 text-red-600 mr-1 mt-0.5 flex-shrink-0" />
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Win Screen
const WinScreen = ({ beachWidth, placedSolutions, naturalHealth, onReset }) => {
  const natureBased = placedSolutions.filter(s => s.type === 'Nature-Based').length;
  const hardEngineering = placedSolutions.filter(s => s.type === 'Hard Engineering').length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-3xl mx-auto"
    >
      <div className="bg-gradient-to-br from-green-400 to-blue-500 text-white rounded-2xl p-8 shadow-2xl">
        <div className="text-center">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 1 }}>
            <Award className="w-24 h-24 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-4xl font-bold mb-3">Beach Saved! 🏖️</h2>
          <p className="text-xl mb-6">
            You successfully protected the coastline for 20 years!
          </p>

          <div className="bg-white/20 rounded-lg p-6 mb-6">
            <h3 className="font-bold text-lg mb-3">Final Results</h3>
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <div className="text-3xl font-bold">{beachWidth.toFixed(1)}m</div>
                <div className="text-sm">Beach Width</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{naturalHealth}%</div>
                <div className="text-sm">Ecosystem Health</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{placedSolutions.length}</div>
                <div className="text-sm">Solutions Used</div>
              </div>
            </div>

            <div className="text-left bg-white/20 rounded p-4">
              <p className="text-sm mb-2">
                <strong>Your Approach:</strong>
              </p>
              <ul className="text-sm space-y-1">
                <li>• Nature-based solutions: {natureBased}</li>
                <li>• Hard engineering: {hardEngineering}</li>
                <li>• Soft engineering: {placedSolutions.filter(s => s.type === 'Soft Engineering').length}</li>
              </ul>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4 mb-6">
            <p className="text-sm">
              {natureBased >= hardEngineering
                ? "🌿 Excellent! Your nature-based approach created a sustainable, resilient coastline that will thrive for generations."
                : "🏗️ You protected the beach, but consider more nature-based solutions for long-term sustainability and ecosystem health."}
            </p>
          </div>

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
};

// Lose Screen
const LoseScreen = ({ beachWidth, placedSolutions, onReset }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    className="max-w-3xl mx-auto"
  >
    <div className="bg-gradient-to-br from-red-400 to-orange-500 text-white rounded-2xl p-8 shadow-2xl">
      <div className="text-center">
        <TrendingDown className="w-24 h-24 mx-auto mb-4" />
        <h2 className="text-4xl font-bold mb-3">Beach Lost to Erosion</h2>
        <p className="text-xl mb-6">
          The beach eroded below 80 meters. More protection was needed.
        </p>

        <div className="bg-white/20 rounded-lg p-6 mb-6">
          <h3 className="font-bold text-lg mb-3">What Happened</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-3xl font-bold">{beachWidth.toFixed(1)}m</div>
              <div className="text-sm">Final Beach Width</div>
              <div className="text-xs">(needed: 80m)</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{placedSolutions.length}</div>
              <div className="text-sm">Solutions Used</div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-4 mb-6">
          <h4 className="font-bold mb-2">💡 Tips for Next Time:</h4>
          <ul className="text-sm text-left space-y-1">
            <li>• Combine multiple approaches for better protection</li>
            <li>• Nature-based solutions provide long-term resilience</li>
            <li>• Act early before erosion becomes severe</li>
            <li>• Balance immediate needs with long-term sustainability</li>
          </ul>
        </div>

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

export default StopTheShrinkingBeach;
