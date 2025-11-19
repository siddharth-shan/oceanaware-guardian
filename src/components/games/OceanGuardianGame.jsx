import { useState, useEffect } from 'react';
import {
  Waves, Fish, Trash2, Droplet, Heart, Star, Award, Book,
  CheckCircle, Lock, Play, RotateCcw, Home, Trophy, Sparkles,
  AlertTriangle, Shield, Target, Zap, X, ChevronRight, Info
} from 'lucide-react';

// Game data structures
const MISSIONS = [
  {
    id: 'coral-reef',
    name: 'Coral Reef Rescue',
    environment: 'Coral Reef',
    difficulty: 'Beginner',
    duration: '10 min',
    description: 'Restore a dying coral reef and rescue trapped marine life',
    objectives: [
      'Remove 20 pieces of trash',
      'Plant 10 coral fragments',
      'Rescue 5 trapped fish',
      'Restore reef health to 80%'
    ],
    unlocked: true,
    rewards: ['Sea Turtle Card', 'Clownfish Card', 'Coral Badge'],
    miniGame: 'reef-restoration',
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
    description: 'Navigate the ocean to collect plastic debris and protect marine animals',
    objectives: [
      'Collect 50 plastic items',
      'Sort waste for recycling',
      'Save 10 marine animals from entanglement',
      'Complete cleanup in under 10 minutes'
    ],
    unlocked: false,
    unlockRequirement: 'coral-reef',
    rewards: ['Dolphin Card', 'Whale Card', 'Ocean Hero Badge'],
    miniGame: 'trash-cleanup',
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
    description: 'Help polar marine life adapt to melting ice and warming waters',
    objectives: [
      'Monitor ice levels and temperature',
      'Guide seals to safe ice platforms',
      'Clean up oil spill contamination',
      'Document climate change impacts'
    ],
    unlocked: false,
    unlockRequirement: 'ocean-cleanup',
    rewards: ['Polar Bear Card', 'Seal Card', 'Climate Guardian Badge'],
    miniGame: 'polar-survival',
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
    description: 'Respond to an oil spill disaster and save affected wildlife',
    objectives: [
      'Deploy containment booms',
      'Clean oil from 30 affected animals',
      'Prevent oil from reaching shore',
      'Restore water quality to safe levels'
    ],
    unlocked: false,
    unlockRequirement: 'polar-rescue',
    rewards: ['Seabird Card', 'Otter Card', 'Emergency Responder Badge'],
    miniGame: 'oil-spill-response',
    bgColor: 'from-orange-400 to-red-500',
    icon: '⚠️',
    facts: [
      'Oil spills can devastate marine ecosystems for decades',
      'Seabirds are especially vulnerable to oil spills because oil destroys the waterproofing of their feathers',
      'The 2010 Deepwater Horizon spill released 210 million gallons of oil into the Gulf of Mexico'
    ]
  },
  {
    id: 'reef-overfishing',
    name: 'Stop Overfishing',
    environment: 'Tropical Ocean',
    difficulty: 'Expert',
    duration: '20 min',
    description: 'Balance fishing needs with ocean sustainability',
    objectives: [
      'Monitor fish populations',
      'Set sustainable catch limits',
      'Protect breeding areas',
      'Educate fishermen on sustainable practices'
    ],
    unlocked: false,
    unlockRequirement: 'oil-spill',
    rewards: ['Shark Card', 'Tuna Card', 'Conservation Leader Badge'],
    miniGame: 'fishing-balance',
    bgColor: 'from-teal-400 to-green-500',
    icon: '🎣',
    facts: [
      'Over 90% of the world\'s fish stocks are fully exploited or overfished',
      'Overfishing has reduced some fish populations by over 90%',
      'Sustainable fishing practices can help ocean ecosystems recover within 10 years'
    ]
  }
];

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

const OceanGuardianGame = () => {
  const [gameState, setGameState] = useState('menu'); // menu, mission-select, playing, encyclopedia, aquarium
  const [selectedMission, setSelectedMission] = useState(null);
  const [completedMissions, setCompletedMissions] = useState([]);
  const [collectedCreatures, setCollectedCreatures] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [currentFact, setCurrentFact] = useState(0);
  const [showEncyclopedia, setShowEncyclopedia] = useState(false);
  const [selectedCreature, setSelectedCreature] = useState(null);

  // Mini-game states
  const [miniGameState, setMiniGameState] = useState({
    trashCollected: 0,
    coralPlanted: 0,
    animalsRescued: 0,
    reefHealth: 0,
    oilCleaned: 0,
    timeRemaining: 600, // 10 minutes in seconds
    score: 0
  });

  useEffect(() => {
    // Rotate educational facts
    const factInterval = setInterval(() => {
      if (selectedMission && gameState === 'playing') {
        setCurrentFact((prev) => (prev + 1) % selectedMission.facts.length);
      }
    }, 15000); // Change fact every 15 seconds

    return () => clearInterval(factInterval);
  }, [selectedMission, gameState]);

  const startMission = (mission) => {
    setSelectedMission(mission);
    setGameState('playing');
    setMiniGameState({
      trashCollected: 0,
      coralPlanted: 0,
      animalsRescued: 0,
      reefHealth: 0,
      oilCleaned: 0,
      timeRemaining: 600,
      score: 0
    });
  };

  const completeMission = () => {
    if (selectedMission && !completedMissions.includes(selectedMission.id)) {
      setCompletedMissions([...completedMissions, selectedMission.id]);

      // Award creature cards and badges
      const newCreatures = selectedMission.rewards.filter(r => r.includes('Card'));
      const newBadges = selectedMission.rewards.filter(r => r.includes('Badge'));

      setCollectedCreatures([...new Set([...collectedCreatures, ...newCreatures])]);
      setEarnedBadges([...new Set([...earnedBadges, ...newBadges])]);
    }
    setGameState('mission-complete');
  };

  const renderMainMenu = () => (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-cyan-500 to-blue-600 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Title */}
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

        {/* Stats Dashboard */}
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

        {/* Menu Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <button
            onClick={() => setGameState('mission-select')}
            className="group bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-3xl p-8 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/50"
          >
            <Play className="h-16 w-16 mx-auto mb-4 group-hover:animate-pulse" />
            <h3 className="text-3xl font-bold mb-2">Start Mission</h3>
            <p className="text-blue-100">Begin your ocean conservation adventure</p>
          </button>

          <button
            onClick={() => setGameState('encyclopedia')}
            className="group bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-3xl p-8 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-pink-500/50"
          >
            <Book className="h-16 w-16 mx-auto mb-4 group-hover:animate-pulse" />
            <h3 className="text-3xl font-bold mb-2">Ocean Encyclopedia</h3>
            <p className="text-purple-100">Learn about marine creatures</p>
          </button>

          <button
            onClick={() => setGameState('aquarium')}
            className="group bg-gradient-to-br from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 text-white rounded-3xl p-8 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-green-500/50"
          >
            <Fish className="h-16 w-16 mx-auto mb-4 group-hover:animate-pulse" />
            <h3 className="text-3xl font-bold mb-2">My Aquarium</h3>
            <p className="text-teal-100">View your collected creatures ({collectedCreatures.length})</p>
          </button>

          <button
            onClick={() => setGameState('badges')}
            className="group bg-gradient-to-br from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white rounded-3xl p-8 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-orange-500/50"
          >
            <Award className="h-16 w-16 mx-auto mb-4 group-hover:animate-pulse" />
            <h3 className="text-3xl font-bold mb-2">My Badges</h3>
            <p className="text-yellow-100">View achievements ({earnedBadges.length})</p>
          </button>
        </div>
      </div>
    </div>
  );

  const renderMissionSelect = () => (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-cyan-500 to-blue-600 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-bold text-white">Choose Your Mission</h2>
          <button
            onClick={() => setGameState('menu')}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-colors"
          >
            <Home className="h-5 w-5" />
            <span>Back to Menu</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MISSIONS.map((mission, index) => {
            const isCompleted = completedMissions.includes(mission.id);
            const isLocked = !mission.unlocked &&
              (!mission.unlockRequirement || !completedMissions.includes(mission.unlockRequirement));

            return (
              <div
                key={mission.id}
                className={`bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ${
                  isLocked ? 'opacity-60' : 'hover:scale-105 hover:shadow-cyan-500/50'
                }`}
              >
                <div className={`bg-gradient-to-r ${mission.bgColor} p-6 text-white`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-5xl">{mission.icon}</span>
                    {isCompleted && <CheckCircle className="h-8 w-8 text-green-400" />}
                    {isLocked && <Lock className="h-8 w-8 text-gray-300" />}
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{mission.name}</h3>
                  <p className="text-sm opacity-90">{mission.environment}</p>
                </div>

                <div className="p-6">
                  <p className="text-gray-700 mb-4">{mission.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Target className="h-4 w-4" />
                      <span>Difficulty: {mission.difficulty}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Zap className="h-4 w-4" />
                      <span>Duration: {mission.duration}</span>
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

                  <div className="mb-4">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Rewards:</h4>
                    <div className="flex flex-wrap gap-2">
                      {mission.rewards.map((reward, i) => (
                        <span
                          key={i}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                        >
                          {reward}
                        </span>
                      ))}
                    </div>
                  </div>

                  {isLocked ? (
                    <div className="bg-gray-100 text-gray-600 px-4 py-3 rounded-lg text-center text-sm">
                      <Lock className="h-5 w-5 inline mr-2" />
                      Complete "{MISSIONS.find(m => m.id === mission.unlockRequirement)?.name}" to unlock
                    </div>
                  ) : (
                    <button
                      onClick={() => startMission(mission)}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all transform hover:scale-105"
                    >
                      <Play className="h-5 w-5" />
                      <span>{isCompleted ? 'Play Again' : 'Start Mission'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderMiniGame = () => {
    if (!selectedMission) return null;

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-400 via-cyan-500 to-blue-600 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Mission Header */}
          <div className="bg-white/90 backdrop-blur rounded-2xl p-6 mb-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <span className="text-5xl">{selectedMission.icon}</span>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">{selectedMission.name}</h2>
                  <p className="text-gray-600">{selectedMission.environment}</p>
                </div>
              </div>
              <button
                onClick={() => setGameState('mission-select')}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <X className="h-5 w-5" />
                <span>Exit</span>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="grid grid-cols-4 gap-4">
              {selectedMission.objectives.map((obj, i) => {
                const progress =
                  i === 0 ? (miniGameState.trashCollected / 20) * 100 :
                  i === 1 ? (miniGameState.coralPlanted / 10) * 100 :
                  i === 2 ? (miniGameState.animalsRescued / 5) * 100 :
                  miniGameState.reefHealth;

                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span className="truncate">{obj.split(' ').slice(0, 3).join(' ')}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Educational Fact Banner */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl p-6 mb-6 shadow-xl">
            <div className="flex items-start space-x-3">
              <Info className="h-6 w-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Did You Know?</h3>
                <p className="text-purple-100">{selectedMission.facts[currentFact]}</p>
              </div>
            </div>
          </div>

          {/* Interactive Mini-Game Area */}
          <div className="bg-white rounded-2xl p-8 shadow-xl mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Interactive Mission Area
            </h3>

            {/* Mini-game based on mission type */}
            {selectedMission.miniGame === 'reef-restoration' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => setMiniGameState(prev => ({
                      ...prev,
                      trashCollected: Math.min(prev.trashCollected + 1, 20),
                      score: prev.score + 10
                    }))}
                    className="bg-gradient-to-br from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white p-6 rounded-xl shadow-lg transform transition-all hover:scale-105"
                  >
                    <Trash2 className="h-12 w-12 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{miniGameState.trashCollected}/20</div>
                    <div className="text-sm">Remove Trash</div>
                  </button>

                  <button
                    onClick={() => setMiniGameState(prev => ({
                      ...prev,
                      coralPlanted: Math.min(prev.coralPlanted + 1, 10),
                      reefHealth: Math.min(prev.reefHealth + 8, 100),
                      score: prev.score + 20
                    }))}
                    className="bg-gradient-to-br from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 text-white p-6 rounded-xl shadow-lg transform transition-all hover:scale-105"
                  >
                    <Sparkles className="h-12 w-12 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{miniGameState.coralPlanted}/10</div>
                    <div className="text-sm">Plant Coral</div>
                  </button>

                  <button
                    onClick={() => setMiniGameState(prev => ({
                      ...prev,
                      animalsRescued: Math.min(prev.animalsRescued + 1, 5),
                      score: prev.score + 30
                    }))}
                    className="bg-gradient-to-br from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white p-6 rounded-xl shadow-lg transform transition-all hover:scale-105"
                  >
                    <Fish className="h-12 w-12 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{miniGameState.animalsRescued}/5</div>
                    <div className="text-sm">Rescue Fish</div>
                  </button>

                  <button
                    onClick={() => setMiniGameState(prev => ({
                      ...prev,
                      reefHealth: Math.min(prev.reefHealth + 5, 100),
                      score: prev.score + 15
                    }))}
                    className="bg-gradient-to-br from-green-400 to-teal-500 hover:from-green-500 hover:to-teal-600 text-white p-6 rounded-xl shadow-lg transform transition-all hover:scale-105"
                  >
                    <Heart className="h-12 w-12 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{miniGameState.reefHealth}%</div>
                    <div className="text-sm">Reef Health</div>
                  </button>
                </div>

                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-800 mb-2">
                    Score: {miniGameState.score}
                  </div>
                  <p className="text-gray-600 mb-4">
                    Click the buttons to complete your objectives!
                  </p>
                </div>
              </div>
            )}

            {selectedMission.miniGame === 'trash-cleanup' && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  {[...Array(15)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (miniGameState.trashCollected < 50) {
                          setMiniGameState(prev => ({
                            ...prev,
                            trashCollected: prev.trashCollected + 1,
                            score: prev.score + 10
                          }));
                        }
                      }}
                      className="bg-gradient-to-br from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white p-4 rounded-xl shadow-lg transform transition-all hover:scale-110 disabled:opacity-50"
                      disabled={miniGameState.trashCollected >= 50}
                    >
                      <Trash2 className="h-8 w-8 mx-auto" />
                      <div className="text-xs mt-2">Collect</div>
                    </button>
                  ))}
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-800 mb-2">
                    {miniGameState.trashCollected}/50 Collected
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    Score: {miniGameState.score}
                  </div>
                </div>
              </div>
            )}

            {/* Other mini-games would be implemented similarly */}
            {selectedMission.miniGame === 'polar-survival' && (
              <div className="text-center p-12">
                <div className="text-6xl mb-4">🧊</div>
                <p className="text-xl text-gray-700 mb-6">
                  Monitor ice levels and guide animals to safety
                </p>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <button
                    onClick={() => setMiniGameState(prev => ({
                      ...prev,
                      animalsRescued: Math.min(prev.animalsRescued + 1, 10),
                      score: prev.score + 25
                    }))}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-xl font-semibold"
                  >
                    Guide Seal to Ice ({miniGameState.animalsRescued}/10)
                  </button>
                  <button
                    onClick={() => setMiniGameState(prev => ({
                      ...prev,
                      reefHealth: Math.min(prev.reefHealth + 10, 100),
                      score: prev.score + 15
                    }))}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white p-4 rounded-xl font-semibold"
                  >
                    Monitor Temperature ({miniGameState.reefHealth}%)
                  </button>
                </div>
                <div className="text-3xl font-bold text-gray-800 mt-6">
                  Score: {miniGameState.score}
                </div>
              </div>
            )}
          </div>

          {/* Complete Mission Button */}
          <div className="text-center">
            <button
              onClick={completeMission}
              disabled={
                miniGameState.trashCollected < 15 ||
                miniGameState.coralPlanted < 5 ||
                miniGameState.animalsRescued < 3
              }
              className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white px-12 py-4 rounded-2xl text-xl font-bold shadow-2xl transform transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6" />
                <span>Complete Mission</span>
              </div>
            </button>
            {(miniGameState.trashCollected < 15 || miniGameState.coralPlanted < 5 || miniGameState.animalsRescued < 3) && (
              <p className="text-white mt-4">
                Complete more objectives to finish the mission!
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMissionComplete = () => (
    <div className="min-h-screen bg-gradient-to-b from-green-400 via-teal-500 to-blue-600 p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
          <div className="mb-6">
            <Trophy className="h-24 w-24 text-yellow-500 mx-auto mb-4 animate-bounce" />
            <h2 className="text-5xl font-bold text-gray-800 mb-4">Mission Complete!</h2>
            <p className="text-xl text-gray-600">You're a true Ocean Guardian! 🌊</p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Rewards Earned:</h3>
            <div className="space-y-3">
              {selectedMission?.rewards.map((reward, i) => (
                <div key={i} className="flex items-center justify-center space-x-3 bg-white rounded-xl p-4 shadow">
                  <Star className="h-6 w-6 text-yellow-500" />
                  <span className="font-semibold text-gray-800">{reward}</span>
                  {reward.includes('Card') && (
                    <span className="text-3xl">{MARINE_CREATURES[reward]?.image}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Your Impact:</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-100 rounded-xl p-4">
                <div className="text-3xl font-bold text-blue-600">{miniGameState.score}</div>
                <div className="text-sm text-blue-800">Points Earned</div>
              </div>
              <div className="bg-green-100 rounded-xl p-4">
                <div className="text-3xl font-bold text-green-600">{miniGameState.animalsRescued}</div>
                <div className="text-sm text-green-800">Animals Saved</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setGameState('mission-select')}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-8 py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all transform hover:scale-105"
            >
              <ChevronRight className="h-5 w-5" />
              <span>Next Mission</span>
            </button>
            <button
              onClick={() => setGameState('menu')}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-all transform hover:scale-105"
            >
              <Home className="h-5 w-5" />
              <span>Main Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEncyclopedia = () => (
    <div className="min-h-screen bg-gradient-to-b from-purple-400 via-pink-500 to-purple-600 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-bold text-white">Ocean Encyclopedia</h2>
          <button
            onClick={() => setGameState('menu')}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-colors"
          >
            <Home className="h-5 w-5" />
            <span>Back to Menu</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(MARINE_CREATURES).map(([cardName, creature]) => {
            const isCollected = collectedCreatures.includes(cardName);

            return (
              <button
                key={cardName}
                onClick={() => {
                  if (isCollected) {
                    setSelectedCreature(creature);
                    setShowEncyclopedia(true);
                  }
                }}
                className={`bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 ${
                  isCollected ? 'hover:scale-105 hover:shadow-purple-500/50' : 'opacity-60'
                }`}
                disabled={!isCollected}
              >
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-6 text-center">
                  <div className="text-6xl mb-4">{creature.image}</div>
                  <h3 className="text-2xl font-bold text-white mb-1">{creature.name}</h3>
                  <p className="text-sm text-purple-100 italic">{creature.scientificName}</p>
                </div>

                <div className="p-6">
                  {isCollected ? (
                    <>
                      <div className="space-y-2 text-left mb-4">
                        <div className="flex items-start space-x-2">
                          <span className="text-blue-500 font-semibold text-sm">Habitat:</span>
                          <span className="text-gray-700 text-sm">{creature.habitat}</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <span className="text-green-500 font-semibold text-sm">Diet:</span>
                          <span className="text-gray-700 text-sm">{creature.diet}</span>
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 text-left">
                        <p className="text-sm text-blue-800">
                          <strong>Fun Fact:</strong> {creature.funFact}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Lock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Complete missions to unlock</p>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Creature Detail Modal */}
      {showEncyclopedia && selectedCreature && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-8 text-white">
              <div className="flex justify-between items-start mb-4">
                <div className="text-7xl">{selectedCreature.image}</div>
                <button
                  onClick={() => setShowEncyclopedia(false)}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <h2 className="text-4xl font-bold mb-2">{selectedCreature.name}</h2>
              <p className="text-purple-100 italic text-lg">{selectedCreature.scientificName}</p>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                  <span className="text-blue-500 mr-2">🏠</span> Habitat
                </h3>
                <p className="text-gray-700">{selectedCreature.habitat}</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                  <span className="text-green-500 mr-2">🍽️</span> Diet
                </h3>
                <p className="text-gray-700">{selectedCreature.diet}</p>
              </div>

              <div className="bg-yellow-50 rounded-xl p-4">
                <h3 className="text-lg font-bold text-yellow-800 mb-2 flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" /> Fun Fact
                </h3>
                <p className="text-yellow-900">{selectedCreature.funFact}</p>
              </div>

              <div className="bg-red-50 rounded-xl p-4">
                <h3 className="text-lg font-bold text-red-800 mb-2 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" /> Conservation Status
                </h3>
                <p className="text-red-900 mb-3">{selectedCreature.threat}</p>
                <div className="bg-white rounded-lg p-3">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-2" /> How You Can Help
                  </h4>
                  <p className="text-gray-700 text-sm">{selectedCreature.conservation}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAquarium = () => (
    <div className="min-h-screen bg-gradient-to-b from-teal-400 via-blue-500 to-cyan-600 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">My Virtual Aquarium</h2>
            <p className="text-blue-100">
              You've collected {collectedCreatures.length} of {Object.keys(MARINE_CREATURES).length} creatures!
            </p>
          </div>
          <button
            onClick={() => setGameState('menu')}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-colors"
          >
            <Home className="h-5 w-5" />
            <span>Back to Menu</span>
          </button>
        </div>

        {collectedCreatures.length === 0 ? (
          <div className="bg-white/90 backdrop-blur rounded-3xl p-12 text-center">
            <Fish className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Your aquarium is empty!</h3>
            <p className="text-gray-600 mb-8">
              Complete missions to collect marine creatures and fill your virtual aquarium.
            </p>
            <button
              onClick={() => setGameState('mission-select')}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-8 py-4 rounded-xl font-semibold inline-flex items-center space-x-2"
            >
              <Play className="h-5 w-5" />
              <span>Start a Mission</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {collectedCreatures.map((cardName, index) => {
              const creature = MARINE_CREATURES[cardName];
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-xl p-6 text-center transform transition-all duration-300 hover:scale-110 hover:shadow-cyan-500/50 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-6xl mb-4">{creature.image}</div>
                  <h3 className="font-bold text-gray-800 text-lg mb-1">{creature.name}</h3>
                  <p className="text-xs text-gray-600 italic">{creature.scientificName}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderBadges = () => (
    <div className="min-h-screen bg-gradient-to-b from-yellow-400 via-orange-500 to-red-600 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">Achievement Badges</h2>
            <p className="text-yellow-100">
              You've earned {earnedBadges.length} of {Object.keys(BADGES).length} badges!
            </p>
          </div>
          <button
            onClick={() => setGameState('menu')}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-colors"
          >
            <Home className="h-5 w-5" />
            <span>Back to Menu</span>
          </button>
        </div>

        {earnedBadges.length === 0 ? (
          <div className="bg-white/90 backdrop-blur rounded-3xl p-12 text-center">
            <Award className="h-24 w-24 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-800 mb-4">No badges yet!</h3>
            <p className="text-gray-600 mb-8">
              Complete missions to earn achievement badges and show off your conservation efforts.
            </p>
            <button
              onClick={() => setGameState('mission-select')}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white px-8 py-4 rounded-xl font-semibold inline-flex items-center space-x-2"
            >
              <Play className="h-5 w-5" />
              <span>Start a Mission</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {earnedBadges.map((badgeName, index) => {
              const badge = BADGES[badgeName];
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-xl p-8 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-yellow-500/50 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-7xl mb-4">{badge.icon}</div>
                  <h3 className="font-bold text-gray-800 text-2xl mb-2">{badge.name}</h3>
                  <p className="text-gray-600">{badge.description}</p>
                  <div className="mt-4 inline-block bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold">
                    Unlocked!
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // Main render logic
  switch (gameState) {
    case 'mission-select':
      return renderMissionSelect();
    case 'playing':
      return renderMiniGame();
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

export default OceanGuardianGame;
