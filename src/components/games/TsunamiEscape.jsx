import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Waves,
  MapPin,
  Clock,
  AlertTriangle,
  Navigation,
  Users,
  CheckCircle,
  XCircle,
  Award,
  RefreshCw,
  Info,
  Mountain,
  Radio
} from 'lucide-react';

/**
 * Tsunami Escape - Educational Evacuation Game
 * Point VI from ocean-contest.txt
 *
 * Learn evacuation routes, tsunami warning signs, and emergency decision-making
 * Time-based challenges teach critical safety skills
 */
const TsunamiEscape = () => {
  const [gameState, setGameState] = useState('intro'); // intro, playing, success, failed
  const [scenario, setScenario] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [decisions, setDecisions] = useState([]);
  const [showWarningSign, setShowWarningSign] = useState(false);

  const scenarios = [
    {
      id: 1,
      name: "Beach Day Emergency",
      location: "Pacific Coast Beach",
      difficulty: "Easy",
      timeLimit: 45,
      description: "You're at the beach when you feel a strong earthquake...",
      warningSign: "Strong earthquake lasting 20+ seconds",
      steps: [
        {
          id: 1,
          question: "You feel a strong earthquake. What's your FIRST action?",
          options: [
            { text: "Immediately move to higher ground", correct: true, explanation: "Correct! Strong coastal earthquakes can trigger tsunamis. Move to high ground immediately.", points: 100 },
            { text: "Wait for official warnings", correct: false, explanation: "Too slow! Natural warnings (earthquakes, ocean receding) require immediate action.", points: 0 },
            { text: "Go back to get your belongings", correct: false, explanation: "Dangerous! Your life is more valuable than possessions.", points: 0 },
            { text: "Run toward the ocean to see waves", correct: false, explanation: "Fatal mistake! Never go toward the ocean during tsunami warnings.", points: 0 }
          ]
        },
        {
          id: 2,
          question: "Which direction should you evacuate?",
          options: [
            { text: "Inland and uphill to at least 100 feet elevation", correct: true, explanation: "Perfect! Tsunamis can travel miles inland. Go up AND inland.", points: 100 },
            { text: "Along the beach to a pier", correct: false, explanation: "Wrong! Piers offer no protection from tsunamis.", points: 0 },
            { text: "To a tall beachfront building", correct: false, explanation: "Risky! Only go to buildings if you can't reach high ground in time.", points: 30 },
            { text: "Into the water to swim away", correct: false, explanation: "Fatal! Never enter the water during a tsunami.", points: 0 }
          ]
        },
        {
          id: 3,
          question: "You see the ocean water rapidly receding. What does this mean?",
          options: [
            { text: "Tsunami is imminent - RUN NOW!", correct: true, explanation: "Correct! Ocean receding is nature's tsunami warning. Waves arrive in minutes.", points: 100 },
            { text: "It's safe to collect exposed sea creatures", correct: false, explanation: "Fatal mistake! This is a deadly warning sign.", points: 0 },
            { text: "Time to take photos", correct: false, explanation: "Absolutely not! Every second counts.", points: 0 },
            { text: "Wait to see if water returns", correct: false, explanation: "Too late! When you see the wave, you cannot outrun it.", points: 0 }
          ]
        }
      ]
    },
    {
      id: 2,
      name: "Coastal Town Alert",
      location: "Harbor Town",
      difficulty: "Medium",
      timeLimit: 60,
      description: "Tsunami warning sirens are blaring in your coastal community...",
      warningSign: "Official tsunami warning sirens",
      steps: [
        {
          id: 1,
          question: "Tsunami sirens are blaring. How much time do you typically have?",
          options: [
            { text: "10-30 minutes at most - ACT NOW", correct: true, explanation: "Correct! Tsunamis travel 500+ mph in deep ocean. Time is critical.", points: 100 },
            { text: "Several hours to evacuate", correct: false, explanation: "False sense of security! Most tsunamis arrive within 30 minutes.", points: 0 },
            { text: "Enough time to pack belongings", correct: false, explanation: "No! Grab only essentials - phone, meds, pets. GO!", points: 20 },
            { text: "Wait for police instructions", correct: false, explanation: "Don't wait! Sirens mean EVACUATE IMMEDIATELY.", points: 0 }
          ]
        },
        {
          id: 2,
          question: "What's the MINIMUM safe elevation for tsunami evacuation?",
          options: [
            { text: "100 feet (30 meters) above sea level", correct: true, explanation: "Correct! Most tsunamis reach 30-50 feet, but go higher if possible.", points: 100 },
            { text: "Any hill will do", correct: false, explanation: "Not safe enough! Must reach designated tsunami evacuation zones.", points: 30 },
            { text: "30 feet (10 meters)", correct: false, explanation: "Too low! Tsunamis can exceed this height.", points: 0 },
            { text: "Beach dunes are high enough", correct: false, explanation: "Deadly misconception! Dunes offer zero protection.", points: 0 }
          ]
        },
        {
          id: 3,
          question: "Your family is separated. What should you do?",
          options: [
            { text: "Evacuate to designated meeting point, don't search", correct: true, explanation: "Correct! Pre-planned meeting points save lives. Don't go back.", points: 100 },
            { text: "Go back to look for them", correct: false, explanation: "Dangerous! Everyone should evacuate independently to meeting point.", points: 0 },
            { text: "Call them and wait", correct: false, explanation: "Keep moving! Cell networks may fail. Call while evacuating.", points: 40 },
            { text: "Drive around searching", correct: false, explanation: "No! Roads will be gridlocked. Get to high ground.", points: 0 }
          ]
        },
        {
          id: 4,
          question: "When is it safe to return to the coast after a tsunami?",
          options: [
            { text: "Wait for official all-clear from authorities", correct: true, explanation: "Correct! Tsunamis come in multiple waves. Wait for official clearance.", points: 100 },
            { text: "After the first wave passes", correct: false, explanation: "Dangerous! Later waves can be larger. Wait hours.", points: 0 },
            { text: "When the water looks calm", correct: false, explanation: "Deceptive! Multiple waves arrive over hours.", points: 0 },
            { text: "After 30 minutes", correct: false, explanation: "Too soon! Tsunami waves can arrive for 12+ hours.", points: 0 }
          ]
        }
      ]
    },
    {
      id: 3,
      name: "Warning Sign Recognition",
      location: "Educational Challenge",
      difficulty: "Hard",
      timeLimit: 90,
      description: "Test your knowledge of tsunami warning signs...",
      warningSign: "Multiple indicators",
      steps: [
        {
          id: 1,
          question: "Which of these is NOT a natural tsunami warning sign?",
          options: [
            { text: "Dark clouds on the horizon", correct: true, explanation: "Correct! Clouds are not tsunami indicators. Focus on ocean/ground behavior.", points: 100 },
            { text: "Loud ocean roaring sound", correct: false, explanation: "This IS a warning sign! Sounds like jet or train approaching.", points: 0 },
            { text: "Ocean water rapidly receding", correct: false, explanation: "This IS a critical warning sign! Waves follow in minutes.", points: 0 },
            { text: "Strong earthquake lasting 20+ seconds", correct: false, explanation: "This IS a major warning sign near coasts!", points: 0 }
          ]
        },
        {
          id: 2,
          question: "What causes most tsunamis?",
          options: [
            { text: "Undersea earthquakes (magnitude 7.0+)", correct: true, explanation: "Correct! 80% of tsunamis caused by underwater earthquakes.", points: 100 },
            { text: "High winds and storms", correct: false, explanation: "No, storms cause storm surge, not tsunamis.", points: 0 },
            { text: "High tides", correct: false, explanation: "Tides are unrelated. Tsunamis can happen at any tide level.", points: 0 },
            { text: "Ships passing by", correct: false, explanation: "Ships create small wakes, not tsunamis.", points: 0 }
          ]
        },
        {
          id: 3,
          question: "How fast can tsunami waves travel in deep ocean?",
          options: [
            { text: "500-600 mph (800-900 km/h) - jet speed!", correct: true, explanation: "Correct! Tsunamis slow as they approach shore but grow taller.", points: 100 },
            { text: "50 mph like a car", correct: false, explanation: "Much faster! They cross oceans in hours.", points: 0 },
            { text: "5 mph like a person running", correct: false, explanation: "Far too slow! You cannot outrun a tsunami.", points: 0 },
            { text: "100 mph like a train", correct: false, explanation: "Even faster than trains in deep water!", points: 0 }
          ]
        },
        {
          id: 4,
          question: "What should be in your tsunami evacuation kit?",
          options: [
            { text: "Phone, meds, water, flashlight, radio", correct: true, explanation: "Perfect! Essentials only. Grab and GO.", points: 100 },
            { text: "Valuables, photo albums, jewelry", correct: false, explanation: "Wrong priority! Your life matters most.", points: 0 },
            { text: "Full suitcase of clothes", correct: false, explanation: "Too much! No time to pack. Have kit ready.", points: 20 },
            { text: "Nothing - just run", correct: false, explanation: "Grab kit if nearby, but don't delay evacuation.", points: 70 }
          ]
        },
        {
          id: 5,
          question: "Which coastal region has the highest tsunami risk?",
          options: [
            { text: "Pacific 'Ring of Fire' coasts", correct: true, explanation: "Correct! 80% of tsunamis occur in Pacific due to tectonic activity.", points: 100 },
            { text: "Atlantic coasts", correct: false, explanation: "Lower risk but not zero. Underwater landslides can trigger tsunamis.", points: 30 },
            { text: "Landlocked areas", correct: false, explanation: "No tsunami risk! But learn to help coastal family/friends.", points: 0 },
            { text: "All coasts have equal risk", correct: false, explanation: "False. Pacific coasts face highest risk.", points: 0 }
          ]
        }
      ]
    }
  ];

  // Start game with selected scenario
  const startScenario = (scenarioData) => {
    setScenario(scenarioData);
    setGameState('playing');
    setTimeRemaining(scenarioData.timeLimit);
    setCurrentStep(0);
    setScore(0);
    setLives(3);
    setDecisions([]);
    setShowWarningSign(true);
    setTimeout(() => setShowWarningSign(false), 3000);
  };

  // Timer countdown
  useEffect(() => {
    if (gameState === 'playing' && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'playing' && timeRemaining === 0) {
      setGameState('failed');
    }
  }, [gameState, timeRemaining]);

  // Handle answer selection
  const handleAnswer = (option) => {
    const currentQuestion = scenario.steps[currentStep];
    const isCorrect = option.correct;

    setDecisions(prev => [...prev, {
      question: currentQuestion.question,
      selected: option.text,
      correct: isCorrect,
      explanation: option.explanation
    }]);

    if (isCorrect) {
      setScore(prev => prev + option.points);

      // Move to next step or finish
      if (currentStep < scenario.steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        setGameState('success');
      }
    } else {
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives === 0) {
          setGameState('failed');
        }
        return newLives;
      });
    }
  };

  const resetGame = () => {
    setGameState('intro');
    setScenario(null);
  };

  // Render intro/scenario selection
  if (gameState === 'intro') {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl p-8 mb-8 shadow-xl">
          <div className="flex items-center justify-center mb-4">
            <Waves className="w-16 h-16 mr-4" />
            <h1 className="text-4xl font-bold">🌊 Tsunami Escape</h1>
          </div>
          <p className="text-xl text-center mb-4">
            Learn life-saving tsunami evacuation skills through interactive scenarios
          </p>
          <div className="bg-white/20 rounded-lg p-4">
            <h3 className="font-bold mb-2 flex items-center">
              <Info className="w-5 h-5 mr-2" />
              What You'll Learn:
            </h3>
            <ul className="text-sm space-y-1">
              <li>• Recognize natural tsunami warning signs</li>
              <li>• Make split-second evacuation decisions</li>
              <li>• Identify safe evacuation routes and zones</li>
              <li>• Understand tsunami behavior and timing</li>
            </ul>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4">Choose Your Scenario</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {scenarios.map((s) => (
            <ScenarioCard key={s.id} scenario={s} onStart={() => startScenario(s)} />
          ))}
        </div>

        <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
          <h3 className="font-bold text-yellow-900 mb-2 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Real-World Tsunami Facts
          </h3>
          <ul className="text-sm text-yellow-800 space-y-2">
            <li>• 2004 Indian Ocean tsunami: 230,000+ deaths across 14 countries</li>
            <li>• 2011 Japan tsunami: 40-meter waves, 18,000+ deaths, Fukushima disaster</li>
            <li>• Tsunamis can travel entire Pacific Ocean in less than a day</li>
            <li>• Warning signs may give only 10-30 minutes to evacuate</li>
            <li>• <strong>Education saves lives:</strong> Japan's preparedness limited 2011 casualties</li>
          </ul>
        </div>
      </div>
    );
  }

  // Render playing state
  if (gameState === 'playing') {
    const currentQuestion = scenario.steps[currentStep];
    const progress = ((currentStep + 1) / scenario.steps.length) * 100;

    return (
      <div className="max-w-4xl mx-auto">
        {/* Warning Sign Flash */}
        <AnimatePresence>
          {showWarningSign && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-red-600 flex items-center justify-center z-50"
            >
              <div className="text-white text-center">
                <AlertTriangle className="w-32 h-32 mx-auto mb-4 animate-pulse" />
                <h2 className="text-5xl font-bold mb-4">TSUNAMI WARNING!</h2>
                <p className="text-2xl">{scenario.warningSign}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game HUD */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">{scenario.name}</h2>
              <p className="text-gray-600">{scenario.location}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-red-600">
                  <Clock className="w-5 h-5 mr-1" />
                  <span className="text-2xl font-bold">{timeRemaining}s</span>
                </div>
                <div className="flex items-center">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full ${i < lives ? 'bg-green-500' : 'bg-gray-300'} ml-1`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-1">Score: {score}</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 text-center">
            Question {currentStep + 1} of {scenario.steps.length}
          </p>
        </div>

        {/* Question */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-8 shadow-xl border-4 border-orange-300"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{currentQuestion.question}</h3>
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAnswer(option)}
                className="w-full text-left bg-white hover:bg-blue-50 border-2 border-gray-300 hover:border-blue-500 rounded-lg p-4 transition-all shadow-md hover:shadow-lg"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center mr-3">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="font-medium">{option.text}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Recent Decisions */}
        {decisions.length > 0 && (
          <div className="mt-6 space-y-3">
            {decisions.slice(-2).map((decision, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg ${decision.correct ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'}`}
              >
                <div className="flex items-start">
                  {decision.correct ? (
                    <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{decision.selected}</p>
                    <p className="text-sm text-gray-700 mt-1">{decision.explanation}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render success/fail screens
  if (gameState === 'success') {
    return <SuccessScreen scenario={scenario} score={score} decisions={decisions} onReset={resetGame} />;
  }

  if (gameState === 'failed') {
    return <FailScreen scenario={scenario} score={score} decisions={decisions} onReset={resetGame} />;
  }

  return null;
};

// Scenario Card Component
const ScenarioCard = ({ scenario, onStart }) => {
  const difficultyColors = {
    Easy: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Hard: 'bg-red-100 text-red-800'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer"
      onClick={onStart}
    >
      <div className="flex items-center justify-between mb-3">
        <MapPin className="w-8 h-8 text-blue-600" />
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${difficultyColors[scenario.difficulty]}`}>
          {scenario.difficulty}
        </span>
      </div>
      <h3 className="text-xl font-bold mb-2">{scenario.name}</h3>
      <p className="text-gray-600 text-sm mb-3">{scenario.location}</p>
      <p className="text-gray-700 text-sm mb-4">{scenario.description}</p>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center text-gray-600">
          <Clock className="w-4 h-4 mr-1" />
          <span>{scenario.timeLimit}s</span>
        </div>
        <div className="text-blue-600 font-semibold">
          {scenario.steps.length} Questions →
        </div>
      </div>
    </motion.div>
  );
};

// Success Screen
const SuccessScreen = ({ scenario, score, decisions, onReset }) => {
  const maxScore = scenario.steps.reduce((sum, step) => sum + 100, 0);
  const percentage = Math.round((score / maxScore) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-3xl mx-auto"
    >
      <div className="bg-gradient-to-br from-green-400 to-blue-500 text-white rounded-2xl p-8 shadow-2xl mb-6">
        <div className="text-center">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 1 }}
          >
            <Award className="w-24 h-24 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-4xl font-bold mb-3">Evacuation Successful! 🎉</h2>
          <p className="text-xl mb-4">You made it to safety!</p>
          <div className="bg-white/20 rounded-lg p-6 mb-4">
            <div className="text-5xl font-bold mb-2">{percentage}%</div>
            <div className="text-lg">Score: {score} / {maxScore} points</div>
          </div>
          <p className="text-lg">
            {percentage >= 90 ? "Outstanding! You're a tsunami safety expert!" :
             percentage >= 70 ? "Well done! You know how to stay safe." :
             "You survived, but review the answers to learn more."}
          </p>
        </div>
      </div>

      {/* Decision Review */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-2xl font-bold mb-4">Decision Review</h3>
        <div className="space-y-4">
          {decisions.map((decision, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${decision.correct ? 'bg-green-50' : 'bg-yellow-50'}`}
            >
              <div className="flex items-start">
                {decision.correct ? (
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
                ) : (
                  <Info className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-1" />
                )}
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Q{index + 1}: {decision.question}</p>
                  <p className="text-sm text-gray-700 mb-2">Your answer: {decision.selected}</p>
                  <p className="text-sm text-gray-600 italic">{decision.explanation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={onReset}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg mr-4"
        >
          <RefreshCw className="inline w-5 h-5 mr-2" />
          Try Another Scenario
        </button>
      </div>
    </motion.div>
  );
};

// Fail Screen
const FailScreen = ({ scenario, score, decisions, onReset }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    className="max-w-3xl mx-auto"
  >
    <div className="bg-gradient-to-br from-red-400 to-orange-500 text-white rounded-2xl p-8 shadow-2xl mb-6">
      <div className="text-center">
        <AlertTriangle className="w-24 h-24 mx-auto mb-4" />
        <h2 className="text-4xl font-bold mb-3">Learning Opportunity</h2>
        <p className="text-xl mb-4">
          {decisions.filter(d => !d.correct).length > 0
            ? "Review the correct answers to improve your tsunami safety knowledge"
            : "Time ran out! Speed is critical in tsunami evacuations"}
        </p>
        <div className="bg-white/20 rounded-lg p-4">
          <p className="text-lg">Score: {score} points</p>
        </div>
      </div>
    </div>

    {/* Learning Review */}
    {decisions.length > 0 && (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-2xl font-bold mb-4">What We Learned</h3>
        <div className="space-y-4">
          {decisions.map((decision, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${decision.correct ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}
            >
              <div className="flex items-start">
                {decision.correct ? (
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-1" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-1" />
                )}
                <div>
                  <p className="font-semibold text-gray-900 mb-1">{decision.question}</p>
                  <p className="text-sm text-gray-700 mb-2">You chose: {decision.selected}</p>
                  <p className="text-sm text-gray-600 italic">{decision.explanation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    <div className="text-center">
      <button
        onClick={onReset}
        className="bg-white text-red-600 px-8 py-3 rounded-lg font-bold hover:bg-red-50 transition-colors shadow-lg"
      >
        <RefreshCw className="inline w-5 h-5 mr-2" />
        Try Again
      </button>
    </div>
  </motion.div>
);

export default TsunamiEscape;
