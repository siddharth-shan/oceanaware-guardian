import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Waves, Fish, Trash2, Droplet, Heart, Star, Award, Book,
  CheckCircle, Lock, Play, RotateCcw, Home, Trophy, Sparkles,
  AlertTriangle, Shield, Target, Zap, X, ChevronRight, Info,
  Timer, Move, Anchor
} from 'lucide-react';

// Marine creature encyclopedia data
const MARINE_CREATURES = {
  'Sea Turtle Card': {
    name: 'Green Sea Turtle',
    scientificName: 'Chelonia mydas',
    habitat: 'Tropical and subtropical oceans',
    diet: 'Seagrass and algae',
    threat: 'Endangered - plastic pollution, fishing nets',
    funFact: 'Sea turtles can hold their breath for up to 7 hours while sleeping!',
    conservation: 'Critical - help by reducing plastic use and protecting nesting beaches',
    image: '🐢'
  },
  'Clownfish Card': {
    name: 'Clownfish',
    scientificName: 'Amphiprioninae',
    habitat: 'Coral reefs in Pacific and Indian Oceans',
    diet: 'Small invertebrates and algae',
    threat: 'Vulnerable - coral bleaching, aquarium trade',
    funFact: 'Clownfish are born male and can change to female if needed!',
    conservation: 'Protect coral reefs to save their homes',
    image: '🐠'
  },
  'Dolphin Card': {
    name: 'Bottlenose Dolphin',
    scientificName: 'Tursiops truncatus',
    habitat: 'Worldwide oceans and coastal waters',
    diet: 'Fish and squid',
    threat: 'Threatened - pollution, fishing nets, noise pollution',
    funFact: 'Dolphins have names for each other and call out to friends!',
    conservation: 'Reduce ocean noise and keep waters clean',
    image: '🐬'
  },
  'Whale Card': {
    name: 'Humpback Whale',
    scientificName: 'Megaptera novaeangliae',
    habitat: 'All major oceans',
    diet: 'Krill and small fish',
    threat: 'Endangered - ship strikes, entanglement, climate change',
    funFact: 'Humpback whales sing complex songs that can last up to 20 minutes!',
    conservation: 'Support marine protected areas and reduce ocean pollution',
    image: '🐋'
  },
  'Polar Bear Card': {
    name: 'Polar Bear',
    scientificName: 'Ursus maritimus',
    habitat: 'Arctic sea ice',
    diet: 'Seals',
    threat: 'Vulnerable - melting sea ice due to climate change',
    funFact: 'Polar bears have black skin under their white fur to absorb heat!',
    conservation: 'Critical - reduce carbon emissions to save Arctic ice',
    image: '🐻‍❄️'
  },
  'Seal Card': {
    name: 'Harp Seal',
    scientificName: 'Pagophilus groenlandicus',
    habitat: 'Arctic and North Atlantic oceans',
    diet: 'Fish and crustaceans',
    threat: 'At Risk - climate change, hunting',
    funFact: 'Baby harp seals are born with white fur that helps them blend in with ice!',
    conservation: 'Protect Arctic habitats from oil drilling',
    image: '🦭'
  },
  'Seabird Card': {
    name: 'Puffin',
    scientificName: 'Fratercula',
    habitat: 'North Atlantic and Arctic coasts',
    diet: 'Small fish',
    threat: 'Vulnerable - climate change, overfishing',
    funFact: 'Puffins can carry up to 60 fish in their beak at once!',
    conservation: 'Protect fish populations and coastal nesting sites',
    image: '🐧'
  },
  'Otter Card': {
    name: 'Sea Otter',
    scientificName: 'Enhydra lutris',
    habitat: 'Pacific coast kelp forests',
    diet: 'Sea urchins, crabs, mollusks',
    threat: 'Endangered - oil spills, habitat loss',
    funFact: 'Sea otters hold hands while sleeping so they don\'t drift apart!',
    conservation: 'Essential - protect kelp forests from pollution',
    image: '🦦'
  },
  'Shark Card': {
    name: 'Great White Shark',
    scientificName: 'Carcharodon carcharias',
    habitat: 'Coastal waters worldwide',
    diet: 'Fish, seals, sea lions',
    threat: 'Vulnerable - overfishing, shark finning',
    funFact: 'Sharks have been around for over 400 million years!',
    conservation: 'Protect apex predators - they keep ocean ecosystems balanced',
    image: '🦈'
  },
  'Tuna Card': {
    name: 'Bluefin Tuna',
    scientificName: 'Thunnus thynnus',
    habitat: 'Atlantic and Pacific oceans',
    diet: 'Fish and squid',
    threat: 'Critically Endangered - severe overfishing',
    funFact: 'Bluefin tuna can swim up to 43 mph and dive 3,000 feet deep!',
    conservation: 'Choose sustainable seafood to protect tuna populations',
    image: '🐟'
  }
};

const BADGES = {
  'Coral Badge': { name: 'Reef Protector', icon: '🪸', description: 'Restored a coral reef ecosystem' },
  'Ocean Hero Badge': { name: 'Ocean Hero', icon: '🌊', description: 'Cleaned plastic from the open ocean' },
  'Climate Guardian Badge': { name: 'Climate Guardian', icon: '🧊', description: 'Protected Arctic wildlife' },
  'Emergency Responder Badge': { name: 'Emergency Responder', icon: '⚠️', description: 'Responded to oil spill crisis' },
  'Conservation Leader Badge': { name: 'Conservation Leader', icon: '🎣', description: 'Promoted sustainable fishing' }
};

// Mission configurations
const MISSIONS = [
  {
    id: 'coral-reef',
    name: 'Coral Reef Rescue',
    environment: 'Coral Reef',
    difficulty: 'Beginner',
    duration: '10 min',
    description: 'Restore a dying coral reef by planting coral and removing trash',
    objectives: [
      'Remove 15 pieces of trash',
      'Plant 8 coral fragments',
      'Rescue 5 trapped fish',
      'Reach 80% reef health'
    ],
    unlocked: true,
    rewards: ['Sea Turtle Card', 'Clownfish Card', 'Coral Badge'],
    bgColor: 'from-blue-400 to-cyan-500',
    icon: '🪸',
    facts: [
      'Coral reefs support 25% of all marine species despite covering less than 1% of the ocean floor',
      'Coral reefs are often called the "rainforests of the sea" due to their biodiversity',
      'A single coral reef can support over 4,000 species of fish'
    ]
  },
  {
    id: 'ocean-cleanup',
    name: 'Great Pacific Cleanup',
    environment: 'Open Ocean',
    difficulty: 'Intermediate',
    duration: '15 min',
    description: 'Sort floating trash into recycling bins while avoiding marine life',
    objectives: [
      'Catch 30 pieces of trash',
      'Sort correctly into bins',
      'Don\'t catch fish (3 strikes)',
      'Complete in 2 minutes'
    ],
    unlocked: false,
    unlockRequirement: 'coral-reef',
    rewards: ['Dolphin Card', 'Whale Card', 'Ocean Hero Badge'],
    bgColor: 'from-blue-500 to-indigo-600',
    icon: '🌊',
    facts: [
      'An estimated 8 million tons of plastic enter our oceans every year',
      'By 2050, there could be more plastic than fish in the ocean by weight',
      'A single plastic bottle can take 450 years to decompose in the ocean'
    ]
  },
  {
    id: 'polar-rescue',
    name: 'Arctic Ice Mission',
    environment: 'Polar Seas',
    difficulty: 'Advanced',
    duration: '20 min',
    description: 'Guide animals to safe ice platforms before they melt',
    objectives: [
      'Save 10 Arctic animals',
      'Navigate melting ice',
      'Deploy oil containment',
      'Monitor temperature'
    ],
    unlocked: false,
    unlockRequirement: 'ocean-cleanup',
    rewards: ['Polar Bear Card', 'Seal Card', 'Climate Guardian Badge'],
    bgColor: 'from-cyan-400 to-blue-500',
    icon: '🧊',
    facts: [
      'Arctic sea ice is disappearing at a rate of 13% per decade',
      'Polar bears rely on sea ice to hunt seals - their primary food source',
      'The Arctic is warming twice as fast as the rest of the planet'
    ]
  },
  {
    id: 'oil-spill',
    name: 'Oil Spill Emergency',
    environment: 'Coastal Waters',
    difficulty: 'Expert',
    duration: '25 min',
    description: 'Contain spreading oil and rescue affected wildlife',
    objectives: [
      'Deploy containment booms',
      'Clean 15 affected animals',
      'Prevent oil from spreading',
      'Restore water quality'
    ],
    unlocked: false,
    unlockRequirement: 'polar-rescue',
    rewards: ['Seabird Card', 'Otter Card', 'Emergency Responder Badge'],
    bgColor: 'from-orange-400 to-red-500',
    icon: '⚠️',
    facts: [
      'Oil spills can devastate marine ecosystems for decades',
      'Seabirds are especially vulnerable because oil destroys the waterproofing of their feathers',
      'The 2010 Deepwater Horizon spill released 210 million gallons of oil'
    ]
  },
  {
    id: 'overfishing',
    name: 'Stop Overfishing',
    environment: 'Tropical Ocean',
    difficulty: 'Expert',
    duration: '20 min',
    description: 'Balance fishing needs with sustainable ocean populations',
    objectives: [
      'Maintain fish population',
      'Set sustainable quotas',
      'Create protected zones',
      'Reach equilibrium'
    ],
    unlocked: false,
    unlockRequirement: 'oil-spill',
    rewards: ['Shark Card', 'Tuna Card', 'Conservation Leader Badge'],
    bgColor: 'from-teal-400 to-green-500',
    icon: '🎣',
    facts: [
      'Over 90% of the world\'s fish stocks are fully exploited or overfished',
      'Overfishing has reduced some fish populations by over 90%',
      'Sustainable fishing practices can help ocean ecosystems recover within 10 years'
    ]
  }
];

const OceanGuardianGame = () => {
  const [gameState, setGameState] = useState('menu');
  const [selectedMission, setSelectedMission] = useState(null);
  const [completedMissions, setCompletedMissions] = useState([]);
  const [collectedCreatures, setCollectedCreatures] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [showEncyclopedia, setShowEncyclopedia] = useState(false);
  const [selectedCreature, setSelectedCreature] = useState(null);

  const startMission = (mission) => {
    setSelectedMission(mission);
    setGameState('playing');
  };

  const completeMission = (rewards) => {
    if (selectedMission && !completedMissions.includes(selectedMission.id)) {
      setCompletedMissions([...completedMissions, selectedMission.id]);

      const newCreatures = rewards.filter(r => r.includes('Card'));
      const newBadges = rewards.filter(r => r.includes('Badge'));

      setCollectedCreatures([...new Set([...collectedCreatures, ...newCreatures])]);
      setEarnedBadges([...new Set([...earnedBadges, ...newBadges])]);
    }
    setGameState('mission-complete');
  };

  const renderMainMenu = () => (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-cyan-500 to-blue-600 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-block bg-white/20 backdrop-blur-md rounded-3xl px-8 py-6 shadow-2xl">
            <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
              🌊 Ocean Guardian 🐠
            </h1>
            <p className="text-2xl text-blue-100 font-medium">
              Become a Marine Conservation Hero!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl text-center">
            <Trophy className="h-10 w-10 text-yellow-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-800">{completedMissions.length}</div>
            <div className="text-sm text-gray-600">Missions Complete</div>
          </div>
          <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl text-center">
            <Fish className="h-10 w-10 text-blue-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-800">{collectedCreatures.length}</div>
            <div className="text-sm text-gray-600">Creatures Collected</div>
          </div>
          <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl text-center">
            <Award className="h-10 w-10 text-purple-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-800">{earnedBadges.length}</div>
            <div className="text-sm text-gray-600">Badges Earned</div>
          </div>
          <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl text-center">
            <Star className="h-10 w-10 text-orange-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-800">
              {Math.round((completedMissions.length / MISSIONS.length) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Ocean Protected</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <button
            onClick={() => setGameState('mission-select')}
            className="group bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-3xl p-8 shadow-2xl transform transition-all duration-300 hover:scale-105"
          >
            <Play className="h-16 w-16 mx-auto mb-4 group-hover:animate-pulse" />
            <h3 className="text-3xl font-bold mb-2">Start Mission</h3>
            <p className="text-blue-100">Begin your ocean conservation adventure</p>
          </button>

          <button
            onClick={() => setGameState('encyclopedia')}
            className="group bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-3xl p-8 shadow-2xl transform transition-all duration-300 hover:scale-105"
          >
            <Book className="h-16 w-16 mx-auto mb-4 group-hover:animate-pulse" />
            <h3 className="text-3xl font-bold mb-2">Ocean Encyclopedia</h3>
            <p className="text-purple-100">Learn about marine creatures</p>
          </button>

          <button
            onClick={() => setGameState('aquarium')}
            className="group bg-gradient-to-br from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 text-white rounded-3xl p-8 shadow-2xl transform transition-all duration-300 hover:scale-105"
          >
            <Fish className="h-16 w-16 mx-auto mb-4 group-hover:animate-pulse" />
            <h3 className="text-3xl font-bold mb-2">My Aquarium</h3>
            <p className="text-teal-100">View collected creatures ({collectedCreatures.length})</p>
          </button>

          <button
            onClick={() => setGameState('badges')}
            className="group bg-gradient-to-br from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white rounded-3xl p-8 shadow-2xl transform transition-all duration-300 hover:scale-105"
          >
            <Award className="h-16 w-16 mx-auto mb-4 group-hover:animate-pulse" />
            <h3 className="text-3xl font-bold mb-2">My Badges</h3>
            <p className="text-yellow-100">View achievements ({earnedBadges.length})</p>
          </button>
        </div>
      </div>
    </div>
  );

  const renderMissionSelect = () => {
    const unlockedMissions = MISSIONS.map(mission => {
      const isCompleted = completedMissions.includes(mission.id);
      const isLocked = !mission.unlocked &&
        (!mission.unlockRequirement || !completedMissions.includes(mission.unlockRequirement));

      return { ...mission, isCompleted, isLocked };
    });

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-400 via-cyan-500 to-blue-600 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-bold text-white">Choose Your Mission</h2>
            <button
              onClick={() => setGameState('menu')}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl flex items-center space-x-2"
            >
              <Home className="h-5 w-5" />
              <span>Back to Menu</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unlockedMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onStart={() => startMission(mission)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderGameplay = () => {
    if (!selectedMission) return null;

    switch (selectedMission.id) {
      case 'coral-reef':
        return <CoralReefGame mission={selectedMission} onComplete={completeMission} />;
      case 'ocean-cleanup':
        return <OceanCleanupGame mission={selectedMission} onComplete={completeMission} />;
      case 'polar-rescue':
        return <ArcticIceGame mission={selectedMission} onComplete={completeMission} />;
      case 'oil-spill':
        return <OilSpillGame mission={selectedMission} onComplete={completeMission} />;
      case 'overfishing':
        return <OverfishingGame mission={selectedMission} onComplete={completeMission} />;
      default:
        return null;
    }
  };

  const renderMissionComplete = () => (
    <div className="min-h-screen bg-gradient-to-b from-green-400 via-teal-500 to-blue-600 p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-12 text-center"
        >
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ repeat: Infinity, duration: 1, repeatType: 'reverse' }}
          >
            <Trophy className="h-24 w-24 text-yellow-500 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-5xl font-bold text-gray-800 mb-4">Mission Complete!</h2>
          <p className="text-xl text-gray-600 mb-8">You're a true Ocean Guardian! 🌊</p>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Rewards Earned:</h3>
            <div className="space-y-3">
              {selectedMission?.rewards.map((reward, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.2 }}
                  className="flex items-center justify-center space-x-3 bg-white rounded-xl p-4 shadow"
                >
                  <Star className="h-6 w-6 text-yellow-500" />
                  <span className="font-semibold text-gray-800">{reward}</span>
                  {reward.includes('Card') && (
                    <span className="text-3xl">{MARINE_CREATURES[reward]?.image}</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setGameState('mission-select')}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-8 py-4 rounded-xl font-semibold"
            >
              Next Mission →
            </button>
            <button
              onClick={() => setGameState('menu')}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-semibold"
            >
              Main Menu
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );

  const renderEncyclopedia = () => (
    <EncyclopediaView
      creatures={MARINE_CREATURES}
      collectedCreatures={collectedCreatures}
      onBack={() => setGameState('menu')}
      onSelectCreature={(creature) => {
        setSelectedCreature(creature);
        setShowEncyclopedia(true);
      }}
    />
  );

  const renderAquarium = () => (
    <AquariumView
      collectedCreatures={collectedCreatures}
      creatures={MARINE_CREATURES}
      onBack={() => setGameState('menu')}
      onStartMission={() => setGameState('mission-select')}
    />
  );

  const renderBadges = () => (
    <BadgesView
      earnedBadges={earnedBadges}
      badges={BADGES}
      onBack={() => setGameState('menu')}
      onStartMission={() => setGameState('mission-select')}
    />
  );

  switch (gameState) {
    case 'mission-select':
      return renderMissionSelect();
    case 'playing':
      return renderGameplay();
    case 'mission-complete':
      return renderMissionComplete();
    case 'encyclopedia':
      return renderEncyclopedia();
    case 'aquarium':
      return renderAquarium();
    case 'badges':
      return renderBadges();
    default:
      return renderMainMenu();
  }
};

// Mission Card Component
const MissionCard = ({ mission, onStart }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl shadow-2xl overflow-hidden ${
        mission.isLocked ? 'opacity-60' : 'hover:scale-105'
      } transition-transform`}
    >
      <div className={`bg-gradient-to-r ${mission.bgColor} p-6 text-white`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-5xl">{mission.icon}</span>
          {mission.isCompleted && <CheckCircle className="h-8 w-8 text-green-400" />}
          {mission.isLocked && <Lock className="h-8 w-8 text-gray-300" />}
        </div>
        <h3 className="text-2xl font-bold mb-1">{mission.name}</h3>
        <p className="text-sm opacity-90">{mission.environment}</p>
      </div>

      <div className="p-6">
        <p className="text-gray-700 mb-4">{mission.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Target className="h-4 w-4" />
            <span>{mission.difficulty}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Timer className="h-4 w-4" />
            <span>{mission.duration}</span>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">Objectives:</h4>
          <ul className="space-y-1">
            {mission.objectives.slice(0, 3).map((obj, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>

        {mission.isLocked ? (
          <div className="bg-gray-100 text-gray-600 px-4 py-3 rounded-lg text-center text-sm">
            <Lock className="h-5 w-5 inline mr-2" />
            Locked - Complete previous missions
          </div>
        ) : (
          <button
            onClick={onStart}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white py-3 rounded-xl font-semibold"
          >
            <Play className="h-5 w-5 inline mr-2" />
            {mission.isCompleted ? 'Play Again' : 'Start Mission'}
          </button>
        )}
      </div>
    </motion.div>
  );
};

// GAME 1: Coral Reef Rescue - Interactive Grid-Based Game
const CoralReefGame = ({ mission, onComplete }) => {
  const [reefGrid, setReefGrid] = useState([]);
  const [score, setScore] = useState(0);
  const [objectives, setObjectives] = useState({
    trashRemoved: 0,
    coralPlanted: 0,
    fishRescued: 0,
    reefHealth: 0
  });
  const [selectedTool, setSelectedTool] = useState('coral');
  const [currentFact, setCurrentFact] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  // Initialize reef grid
  useEffect(() => {
    const grid = [];
    for (let row = 0; row < 6; row++) {
      const rowCells = [];
      for (let col = 0; col < 8; col++) {
        const rand = Math.random();
        let cellType = 'empty';

        if (rand < 0.15) cellType = 'trash';
        else if (rand < 0.25) cellType = 'dead-coral';
        else if (rand < 0.30) cellType = 'trapped-fish';
        else if (rand < 0.45) cellType = 'damaged';

        rowCells.push({
          id: `${row}-${col}`,
          type: cellType,
          row,
          col
        });
      }
      grid.push(rowCells);
    }
    setReefGrid(grid);
    setGameStarted(true);
  }, []);

  // Rotate facts
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFact((prev) => (prev + 1) % mission.facts.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [mission.facts.length]);

  // Calculate reef health
  useEffect(() => {
    if (reefGrid.length === 0) return;

    let total = 0;
    let healthy = 0;

    reefGrid.forEach(row => {
      row.forEach(cell => {
        total++;
        if (cell.type === 'coral' || cell.type === 'empty') healthy++;
      });
    });

    const health = Math.round((healthy / total) * 100);
    setObjectives(prev => ({ ...prev, reefHealth: health }));
  }, [reefGrid]);

  const handleCellClick = (rowIndex, colIndex) => {
    const cell = reefGrid[rowIndex][colIndex];

    if (selectedTool === 'coral' && (cell.type === 'dead-coral' || cell.type === 'damaged')) {
      // Plant coral
      const newGrid = [...reefGrid];
      newGrid[rowIndex][colIndex] = { ...cell, type: 'coral' };
      setReefGrid(newGrid);
      setObjectives(prev => ({ ...prev, coralPlanted: prev.coralPlanted + 1 }));
      setScore(prev => prev + 20);
    } else if (selectedTool === 'trash' && cell.type === 'trash') {
      // Remove trash
      const newGrid = [...reefGrid];
      newGrid[rowIndex][colIndex] = { ...cell, type: 'empty' };
      setReefGrid(newGrid);
      setObjectives(prev => ({ ...prev, trashRemoved: prev.trashRemoved + 1 }));
      setScore(prev => prev + 10);
    } else if (selectedTool === 'rescue' && cell.type === 'trapped-fish') {
      // Rescue fish
      const newGrid = [...reefGrid];
      newGrid[rowIndex][colIndex] = { ...cell, type: 'empty' };
      setReefGrid(newGrid);
      setObjectives(prev => ({ ...prev, fishRescued: prev.fishRescued + 1 }));
      setScore(prev => prev + 30);
    }
  };

  const getCellColor = (type) => {
    switch (type) {
      case 'trash': return 'bg-red-500';
      case 'dead-coral': return 'bg-gray-400';
      case 'coral': return 'bg-pink-400';
      case 'damaged': return 'bg-yellow-300';
      case 'trapped-fish': return 'bg-orange-400';
      default: return 'bg-blue-200';
    }
  };

  const getCellEmoji = (type) => {
    switch (type) {
      case 'trash': return '🗑️';
      case 'dead-coral': return '💀';
      case 'coral': return '🪸';
      case 'damaged': return '🟡';
      case 'trapped-fish': return '🐠';
      default: return '💧';
    }
  };

  const isComplete = objectives.trashRemoved >= 15 &&
                     objectives.coralPlanted >= 8 &&
                     objectives.fishRescued >= 5 &&
                     objectives.reefHealth >= 80;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-cyan-600 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 rounded-2xl p-6 mb-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 flex items-center">
                <span className="text-4xl mr-3">{mission.icon}</span>
                {mission.name}
              </h2>
              <p className="text-gray-600">Click on reef cells to restore the ecosystem!</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{score}</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
          </div>

          {/* Progress */}
          <div className="grid grid-cols-4 gap-4">
            <ProgressIndicator label="Trash" current={objectives.trashRemoved} target={15} />
            <ProgressIndicator label="Coral" current={objectives.coralPlanted} target={8} />
            <ProgressIndicator label="Fish" current={objectives.fishRescued} target={5} />
            <ProgressIndicator label="Health" current={objectives.reefHealth} target={80} suffix="%" />
          </div>
        </div>

        {/* Tool Selection */}
        <div className="bg-white/90 rounded-2xl p-6 mb-6 shadow-xl">
          <h3 className="font-bold text-gray-800 mb-4">Select Tool:</h3>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setSelectedTool('coral')}
              className={`p-4 rounded-xl font-semibold transition-all ${
                selectedTool === 'coral'
                  ? 'bg-pink-500 text-white scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-3xl block mb-2">🪸</span>
              Plant Coral
            </button>
            <button
              onClick={() => setSelectedTool('trash')}
              className={`p-4 rounded-xl font-semibold transition-all ${
                selectedTool === 'trash'
                  ? 'bg-red-500 text-white scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-3xl block mb-2">🗑️</span>
              Remove Trash
            </button>
            <button
              onClick={() => setSelectedTool('rescue')}
              className={`p-4 rounded-xl font-semibold transition-all ${
                selectedTool === 'rescue'
                  ? 'bg-orange-500 text-white scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-3xl block mb-2">🐠</span>
              Rescue Fish
            </button>
          </div>
        </div>

        {/* Educational Fact */}
        <div className="bg-purple-500 text-white rounded-2xl p-6 mb-6 shadow-xl">
          <div className="flex items-start space-x-3">
            <Info className="h-6 w-6 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-lg mb-2">Did You Know?</h3>
              <p>{mission.facts[currentFact]}</p>
            </div>
          </div>
        </div>

        {/* Reef Grid */}
        <div className="bg-white/90 rounded-2xl p-6 shadow-xl mb-6">
          <h3 className="font-bold text-gray-800 mb-4 text-center text-xl">
            Interactive Coral Reef
          </h3>
          <div className="inline-block mx-auto">
            {reefGrid.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                {row.map((cell, colIndex) => (
                  <motion.button
                    key={cell.id}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-16 h-16 m-1 rounded-lg ${getCellColor(cell.type)}
                      shadow-md hover:shadow-lg transition-all flex items-center justify-center text-2xl
                      border-2 border-white/50`}
                  >
                    {getCellEmoji(cell.type)}
                  </motion.button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Complete Button */}
        {isComplete && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-center"
          >
            <button
              onClick={() => onComplete(mission.rewards)}
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700
                text-white px-12 py-6 rounded-2xl text-2xl font-bold shadow-2xl transform hover:scale-105"
            >
              <CheckCircle className="inline h-8 w-8 mr-3" />
              Complete Mission!
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// GAME 2: Ocean Cleanup - Catch and Sort Game
const OceanCleanupGame = ({ mission, onComplete }) => {
  const [trashItems, setTrashItems] = useState([]);
  const [score, setScore] = useState(0);
  const [caught, setCaught] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [gameActive, setGameActive] = useState(false);
  const containerRef = useRef(null);

  const trashTypes = [
    { type: 'plastic', emoji: '🧴', bin: 'plastic', points: 10 },
    { type: 'metal', emoji: '🥫', bin: 'metal', points: 15 },
    { type: 'glass', emoji: '🍾', bin: 'glass', points: 20 },
    { type: 'fish', emoji: '🐟', bin: 'none', points: -30 },
    { type: 'plastic', emoji: '🥤', bin: 'plastic', points: 10 },
    { type: 'metal', emoji: '⚙️', bin: 'metal', points: 15 },
  ];

  useEffect(() => {
    if (!gameActive) return;

    const interval = setInterval(() => {
      const randomTrash = trashTypes[Math.floor(Math.random() * trashTypes.length)];
      const newItem = {
        id: Date.now() + Math.random(),
        ...randomTrash,
        x: Math.random() * 80,
        y: -10
      };
      setTrashItems(prev => [...prev, newItem]);
    }, 1500);

    return () => clearInterval(interval);
  }, [gameActive]);

  useEffect(() => {
    if (!gameActive) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive]);

  useEffect(() => {
    if (!gameActive) return;

    const moveInterval = setInterval(() => {
      setTrashItems(prev =>
        prev
          .map(item => ({ ...item, y: item.y + 2 }))
          .filter(item => item.y < 100)
      );
    }, 50);

    return () => clearInterval(moveInterval);
  }, [gameActive]);

  const handleTrashClick = (item, binType) => {
    if (item.type === 'fish') {
      setMistakes(prev => prev + 1);
      setScore(prev => prev - 30);
    } else if (item.bin === binType) {
      setCaught(prev => prev + 1);
      setScore(prev => prev + item.points);
    } else {
      setMistakes(prev => prev + 1);
    }

    setTrashItems(prev => prev.filter(i => i.id !== item.id));
  };

  const isComplete = caught >= 30 && mistakes < 3;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-indigo-700 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/90 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold">🌊 {mission.name}</h2>
              <p className="text-gray-600">Catch trash and sort into bins!</p>
            </div>
            <div className="flex space-x-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{caught}/30</div>
                <div className="text-sm">Caught</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{mistakes}/3</div>
                <div className="text-sm">Mistakes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{timeLeft}s</div>
                <div className="text-sm">Time</div>
              </div>
            </div>
          </div>
        </div>

        {!gameActive && timeLeft === 120 ? (
          <div className="text-center">
            <button
              onClick={() => setGameActive(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-12 py-6 rounded-2xl text-2xl font-bold"
            >
              Start Cleanup!
            </button>
          </div>
        ) : (
          <>
            {/* Ocean Area */}
            <div
              ref={containerRef}
              className="relative bg-gradient-to-b from-blue-400 to-blue-600 rounded-2xl h-96 overflow-hidden mb-6 shadow-xl"
            >
              <AnimatePresence>
                {trashItems.map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: `${item.y}%`, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ left: `${item.x}%` }}
                    className="absolute text-5xl cursor-pointer hover:scale-125 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      // For now, just remove on click - in full version would need drag
                    }}
                  >
                    {item.emoji}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Sorting Bins */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { type: 'plastic', label: 'Plastic', color: 'bg-yellow-500', emoji: '♻️' },
                { type: 'metal', label: 'Metal', color: 'bg-gray-500', emoji: '🔩' },
                { type: 'glass', label: 'Glass', color: 'bg-green-500', emoji: '🍾' },
                { type: 'general', label: 'General', color: 'bg-brown-500', emoji: '🗑️' }
              ].map(bin => (
                <div
                  key={bin.type}
                  className={`${bin.color} text-white rounded-2xl p-8 text-center shadow-xl`}
                >
                  <div className="text-6xl mb-3">{bin.emoji}</div>
                  <div className="font-bold text-xl">{bin.label}</div>
                </div>
              ))}
            </div>

            {isComplete && (
              <div className="text-center mt-8">
                <button
                  onClick={() => onComplete(mission.rewards)}
                  className="bg-green-500 hover:bg-green-600 text-white px-12 py-6 rounded-2xl text-2xl font-bold"
                >
                  Complete Mission!
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Simplified versions of remaining games (Arctic, Oil Spill, Overfishing)
// These would be fully fleshed out with their own unique mechanics

const ArcticIceGame = ({ mission, onComplete }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-300 to-blue-600 p-6">
      <div className="max-w-6xl mx-auto text-center">
        <div className="bg-white rounded-2xl p-12">
          <h2 className="text-4xl font-bold mb-6">🧊 {mission.name}</h2>
          <p className="text-xl mb-8">Pathfinding puzzle - guide animals to safe ice platforms!</p>
          <p className="text-gray-600 mb-8">(Full game mechanics will be implemented with drag-and-drop pathfinding)</p>
          <button
            onClick={() => onComplete(mission.rewards)}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-4 rounded-xl text-xl font-bold"
          >
            Complete (Demo)
          </button>
        </div>
      </div>
    </div>
  );
};

const OilSpillGame = ({ mission, onComplete }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-300 to-red-600 p-6">
      <div className="max-w-6xl mx-auto text-center">
        <div className="bg-white rounded-2xl p-12">
          <h2 className="text-4xl font-bold mb-6">⚠️ {mission.name}</h2>
          <p className="text-xl mb-8">Strategic containment - drag booms to stop oil spread!</p>
          <p className="text-gray-600 mb-8">(Full game with spreading oil animation and boom placement)</p>
          <button
            onClick={() => onComplete(mission.rewards)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl text-xl font-bold"
          >
            Complete (Demo)
          </button>
        </div>
      </div>
    </div>
  );
};

const OverfishingGame = ({ mission, onComplete }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-300 to-green-600 p-6">
      <div className="max-w-6xl mx-auto text-center">
        <div className="bg-white rounded-2xl p-12">
          <h2 className="text-4xl font-bold mb-6">🎣 {mission.name}</h2>
          <p className="text-xl mb-8">Population simulation - balance fishing vs sustainability!</p>
          <p className="text-gray-600 mb-8">(Full simulation with fish breeding and quota management)</p>
          <button
            onClick={() => onComplete(mission.rewards)}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl text-xl font-bold"
          >
            Complete (Demo)
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const ProgressIndicator = ({ label, current, target, suffix = '' }) => (
  <div>
    <div className="flex justify-between text-xs text-gray-600 mb-1">
      <span>{label}</span>
      <span>{current}/{target}{suffix}</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-gradient-to-r from-blue-500 to-cyan-600 h-2 rounded-full transition-all"
        style={{ width: `${Math.min((current / target) * 100, 100)}%` }}
      />
    </div>
  </div>
);

const EncyclopediaView = ({ creatures, collectedCreatures, onBack, onSelectCreature }) => (
  <div className="min-h-screen bg-gradient-to-b from-purple-400 to-pink-600 p-6">
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-bold text-white">Ocean Encyclopedia</h2>
        <button
          onClick={onBack}
          className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl"
        >
          <Home className="inline h-5 w-5 mr-2" />
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(creatures).map(([cardName, creature]) => {
          const isCollected = collectedCreatures.includes(cardName);
          return (
            <div
              key={cardName}
              className={`bg-white rounded-2xl shadow-xl overflow-hidden ${
                isCollected ? 'cursor-pointer hover:scale-105' : 'opacity-60'
              } transition-transform`}
              onClick={() => isCollected && onSelectCreature(creature)}
            >
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-6 text-center">
                <div className="text-6xl mb-4">{creature.image}</div>
                <h3 className="text-2xl font-bold text-white">{creature.name}</h3>
              </div>
              <div className="p-6">
                {isCollected ? (
                  <p className="text-sm text-gray-700">{creature.funFact}</p>
                ) : (
                  <div className="text-center py-8">
                    <Lock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Complete missions to unlock</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

const AquariumView = ({ collectedCreatures, creatures, onBack, onStartMission }) => (
  <div className="min-h-screen bg-gradient-to-b from-teal-400 to-cyan-600 p-6">
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold text-white">My Virtual Aquarium</h2>
          <p className="text-blue-100">
            Collected {collectedCreatures.length} of {Object.keys(creatures).length} creatures!
          </p>
        </div>
        <button onClick={onBack} className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl">
          <Home className="inline h-5 w-5 mr-2" />
          Back
        </button>
      </div>

      {collectedCreatures.length === 0 ? (
        <div className="bg-white/90 rounded-3xl p-12 text-center">
          <Fish className="h-24 w-24 text-gray-400 mx-auto mb-6" />
          <h3 className="text-2xl font-bold mb-4">Your aquarium is empty!</h3>
          <button
            onClick={onStartMission}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold"
          >
            Start a Mission
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {collectedCreatures.map((cardName, index) => {
            const creature = creatures[cardName];
            return (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 text-center shadow-xl hover:scale-110 transition-transform"
              >
                <div className="text-6xl mb-4">{creature.image}</div>
                <h3 className="font-bold text-lg">{creature.name}</h3>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);

const BadgesView = ({ earnedBadges, badges, onBack, onStartMission }) => (
  <div className="min-h-screen bg-gradient-to-b from-yellow-400 to-orange-600 p-6">
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold text-white">Achievement Badges</h2>
          <p className="text-yellow-100">
            Earned {earnedBadges.length} of {Object.keys(badges).length} badges!
          </p>
        </div>
        <button onClick={onBack} className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl">
          <Home className="inline h-5 w-5 mr-2" />
          Back
        </button>
      </div>

      {earnedBadges.length === 0 ? (
        <div className="bg-white/90 rounded-3xl p-12 text-center">
          <Award className="h-24 w-24 text-gray-400 mx-auto mb-6" />
          <h3 className="text-2xl font-bold mb-4">No badges yet!</h3>
          <button
            onClick={onStartMission}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 rounded-xl font-semibold"
          >
            Start a Mission
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {earnedBadges.map((badgeName, index) => {
            const badge = badges[badgeName];
            return (
              <motion.div
                key={index}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: index * 0.2, type: 'spring' }}
                className="bg-white rounded-2xl p-8 text-center shadow-xl hover:scale-105 transition-transform"
              >
                <div className="text-7xl mb-4">{badge.icon}</div>
                <h3 className="font-bold text-2xl mb-2">{badge.name}</h3>
                <p className="text-gray-600 mb-4">{badge.description}</p>
                <div className="inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold">
                  Unlocked!
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);

export default OceanGuardianGame;
