import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Waves,
  Fish,
  Trash2,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Target,
  Award,
  ArrowRight,
  RotateCcw,
  Info,
  Sparkles
} from 'lucide-react';
import CaptainMarinaGuide, { marinaMessages } from '../guide/CaptainMarinaGuide';

const AIMarineTrainer = () => {
  const [phase, setPhase] = useState('intro'); // intro, training, lesson, testing, complete
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [accuracy, setAccuracy] = useState(50);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userLabels, setUserLabels] = useState({});
  const [lessonViewed, setLessonViewed] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [biasDetected, setBiasDetected] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Training dataset: 40 images (20 marine life, 20 pollution)
  const trainingImages = [
    // Marine Life (20)
    { id: 1, type: 'marine', name: 'Sea Turtle', emoji: '🐢', description: 'Green sea turtle swimming' },
    { id: 2, type: 'marine', name: 'Clownfish', emoji: '🐠', description: 'Colorful reef fish' },
    { id: 3, type: 'marine', name: 'Dolphin', emoji: '🐬', description: 'Bottlenose dolphin' },
    { id: 4, type: 'marine', name: 'Octopus', emoji: '🐙', description: 'Pacific octopus' },
    { id: 5, type: 'marine', name: 'Whale', emoji: '🐋', description: 'Humpback whale' },
    { id: 6, type: 'marine', name: 'Coral', emoji: '🪸', description: 'Healthy coral reef' },
    { id: 7, type: 'marine', name: 'Jellyfish', emoji: '🪼', description: 'Moon jellyfish' },
    { id: 8, type: 'marine', name: 'Starfish', emoji: '⭐', description: 'Orange starfish' },
    { id: 9, type: 'marine', name: 'Crab', emoji: '🦀', description: 'Hermit crab' },
    { id: 10, type: 'marine', name: 'Seahorse', emoji: '🌊', description: 'Lined seahorse' },
    { id: 11, type: 'marine', name: 'Tropical Fish', emoji: '🐡', description: 'Pufferfish' },
    { id: 12, type: 'marine', name: 'Shark', emoji: '🦈', description: 'Reef shark' },
    { id: 13, type: 'marine', name: 'Seal', emoji: '🦭', description: 'Harbor seal' },
    { id: 14, type: 'marine', name: 'Stingray', emoji: '🐠', description: 'Manta ray gliding' },
    { id: 15, type: 'marine', name: 'Sea Urchin', emoji: '🦔', description: 'Purple sea urchin' },
    { id: 16, type: 'marine', name: 'Anemone', emoji: '🌺', description: 'Sea anemone' },
    { id: 17, type: 'marine', name: 'Blue Tang', emoji: '🐟', description: 'Blue reef fish' },
    { id: 18, type: 'marine', name: 'Lobster', emoji: '🦞', description: 'Spiny lobster' },
    { id: 19, type: 'marine', name: 'Penguin', emoji: '🐧', description: 'Swimming penguin' },
    { id: 20, type: 'marine', name: 'Manatee', emoji: '🦛', description: 'Gentle manatee' },

    // Pollution (20)
    { id: 21, type: 'pollution', name: 'Plastic Bottle', emoji: '🍾', description: 'Empty plastic bottle' },
    { id: 22, type: 'pollution', name: 'Plastic Bag', emoji: '🛍️', description: 'Floating plastic bag' },
    { id: 23, type: 'pollution', name: 'Fishing Net', emoji: '🥅', description: 'Abandoned fishing net' },
    { id: 24, type: 'pollution', name: 'Tin Can', emoji: '🥫', description: 'Aluminum can' },
    { id: 25, type: 'pollution', name: 'Plastic Straw', emoji: '🥤', description: 'Single-use straw' },
    { id: 26, type: 'pollution', name: 'Food Wrapper', emoji: '🍔', description: 'Fast food wrapper' },
    { id: 27, type: 'pollution', name: 'Cigarette Butt', emoji: '🚬', description: 'Discarded cigarette' },
    { id: 28, type: 'pollution', name: 'Plastic Cup', emoji: '🥤', description: 'Disposable cup' },
    { id: 29, type: 'pollution', name: 'Tire', emoji: '⭕', description: 'Car tire debris' },
    { id: 30, type: 'pollution', name: 'Oil Spill', emoji: '🛢️', description: 'Oil contamination' },
    { id: 31, type: 'pollution', name: 'Microplastics', emoji: '⚫', description: 'Tiny plastic particles' },
    { id: 32, type: 'pollution', name: 'Styrofoam', emoji: '📦', description: 'Foam packaging' },
    { id: 33, type: 'pollution', name: 'Balloon', emoji: '🎈', description: 'Released balloon' },
    { id: 34, type: 'pollution', name: 'Six-Pack Ring', emoji: '⭕', description: 'Plastic ring holder' },
    { id: 35, type: 'pollution', name: 'Food Container', emoji: '📦', description: 'Takeout container' },
    { id: 36, type: 'pollution', name: 'Plastic Utensils', emoji: '🍴', description: 'Disposable fork/spoon' },
    { id: 37, type: 'pollution', name: 'Chemical Waste', emoji: '⚗️', description: 'Toxic chemicals' },
    { id: 38, type: 'pollution', name: 'Glass Bottle', emoji: '🍾', description: 'Broken glass' },
    { id: 39, type: 'pollution', name: 'Rope', emoji: '🪢', description: 'Synthetic rope debris' },
    { id: 40, type: 'pollution', name: 'Battery', emoji: '🔋', description: 'Discarded battery' },
  ];

  // Shuffle images for training
  const [shuffledImages, setShuffledImages] = useState([]);

  useEffect(() => {
    const shuffled = [...trainingImages].sort(() => Math.random() - 0.5);
    setShuffledImages(shuffled);
  }, []);

  // Test dataset (10 images)
  const testImages = [
    { id: 101, type: 'marine', name: 'Whale Shark', emoji: '🦈', description: 'Largest fish in ocean' },
    { id: 102, type: 'pollution', name: 'Plastic Bag', emoji: '🛍️', description: 'Looks like jellyfish' },
    { id: 103, type: 'marine', name: 'Sea Lion', emoji: '🦭', description: 'California sea lion' },
    { id: 104, type: 'pollution', name: 'Fishing Line', emoji: '🪢', description: 'Tangled fishing line' },
    { id: 105, type: 'marine', name: 'Nautilus', emoji: '🐚', description: 'Chambered nautilus' },
    { id: 106, type: 'pollution', name: 'Plastic Wrapper', emoji: '📦', description: 'Chip bag wrapper' },
    { id: 107, type: 'marine', name: 'Eel', emoji: '🐍', description: 'Moray eel' },
    { id: 108, type: 'pollution', name: 'Glove', emoji: '🧤', description: 'Rubber glove' },
    { id: 109, type: 'marine', name: 'Otter', emoji: '🦦', description: 'Sea otter floating' },
    { id: 110, type: 'pollution', name: 'Bottle Cap', emoji: '⭕', description: 'Small plastic cap' },
  ];

  const currentImage = shuffledImages[currentImageIndex];

  // Calculate AI performance based on training data
  useEffect(() => {
    if (Object.keys(userLabels).length > 0) {
      const totalLabeled = Object.keys(userLabels).length;
      const correctLabels = Object.entries(userLabels).filter(
        ([id, label]) => {
          const image = trainingImages.find(img => img.id === parseInt(id));
          return image && label === image.type;
        }
      ).length;

      // Calculate accuracy: starts at 50%, improves with correct labels
      const baseAccuracy = 50;
      const improvementRate = (correctLabels / trainingImages.length) * 50;
      const newAccuracy = Math.min(95, Math.round(baseAccuracy + improvementRate));
      setAccuracy(newAccuracy);

      // Check for bias (unbalanced training data)
      const marineCount = Object.entries(userLabels).filter(([id, label]) => label === 'marine').length;
      const pollutionCount = Object.entries(userLabels).filter(([id, label]) => label === 'pollution').length;
      const imbalance = Math.abs(marineCount - pollutionCount);

      if (totalLabeled > 15 && imbalance > 5) {
        setBiasDetected(true);
      } else {
        setBiasDetected(false);
      }

      setTrainingProgress(Math.round((totalLabeled / trainingImages.length) * 100));
    }
  }, [userLabels]);

  const handleLabel = (label) => {
    if (!currentImage) return;

    setUserLabels(prev => ({
      ...prev,
      [currentImage.id]: label
    }));

    // Move to next image
    if (currentImageIndex < shuffledImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      setShowHint(false);
    } else {
      // Training complete
      setTimeout(() => {
        setPhase('lesson');
      }, 500);
    }
  };

  const handleTest = (imageId, prediction) => {
    const image = testImages.find(img => img.id === imageId);
    const isCorrect = prediction === image.type;

    setTestResults(prev => ({
      ...prev,
      [imageId]: { prediction, correct: isCorrect, actualType: image.type }
    }));
  };

  const calculateTestScore = () => {
    if (!testResults) return 0;
    const results = Object.values(testResults);
    const correct = results.filter(r => r.correct).length;
    return Math.round((correct / testImages.length) * 100);
  };

  const restartTraining = () => {
    setPhase('intro');
    setTrainingProgress(0);
    setAccuracy(50);
    setCurrentImageIndex(0);
    setUserLabels({});
    setLessonViewed(false);
    setTestResults(null);
    setBiasDetected(false);
    setShowHint(false);
    const shuffled = [...trainingImages].sort(() => Math.random() - 0.5);
    setShuffledImages(shuffled);
  };

  // Intro Phase
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                <Brain className="w-12 h-12" />
                <h1 className="text-4xl font-bold">AI Ocean Guardian</h1>
              </div>
              <p className="text-xl text-blue-100">
                Train an AI to protect our oceans by learning to identify marine life and pollution
              </p>
            </div>

            {/* Captain Marina Introduction */}
            <div className="p-8">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">👩‍✈️</div>
                  <div>
                    <h3 className="font-bold text-lg text-blue-900 mb-2">Captain Marina here!</h3>
                    <p className="text-blue-800 leading-relaxed">
                      During my ocean voyages, I discovered that AI can be a powerful tool for conservation.
                      But AI is only as good as the data we teach it with. Today, you'll learn how to train
                      an AI system to recognize the difference between marine life and ocean pollution.
                    </p>
                  </div>
                </div>
              </div>

              {/* How it works */}
              <h2 className="text-2xl font-bold text-gray-800 mb-4">How It Works</h2>
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3">
                    1
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">Label Images</h3>
                  <p className="text-gray-600 text-sm">
                    You'll see 40 images. Label each as either "Marine Life" or "Pollution" to teach the AI.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 rounded-xl">
                  <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3">
                    2
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">Learn About AI</h3>
                  <p className="text-gray-600 text-sm">
                    Discover how training data affects AI accuracy, bias, and real-world conservation applications.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-xl">
                  <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3">
                    3
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">Test Your AI</h3>
                  <p className="text-gray-600 text-sm">
                    See how well your trained AI performs on new ocean images it's never seen before.
                  </p>
                </div>
              </div>

              {/* Real-world connection */}
              <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg mb-6">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-green-900 mb-2">Real-World Impact</h3>
                    <p className="text-green-800 text-sm leading-relaxed">
                      Scientists use AI like this to identify marine species from underwater cameras,
                      detect plastic pollution from satellite images, and track ocean health. Projects
                      like <span className="font-semibold">Flukebook.org</span> use AI to protect whales
                      and dolphins by identifying individuals from photos!
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setPhase('training')}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                Start Training Your AI
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Captain Marina Guide - Intro */}
        <CaptainMarinaGuide
          message={marinaMessages.aiGuardian.intro.message}
          emotion={marinaMessages.aiGuardian.intro.emotion}
          position="bottom-right"
          dismissible={true}
          showInitially={true}
        />
      </div>
    );
  }

  // Training Phase
  if (phase === 'training') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Progress Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Training Your AI</h2>
              <div className="text-sm text-gray-600">
                Image {currentImageIndex + 1} of {shuffledImages.length}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{trainingProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${trainingProgress}%` }}
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* AI Accuracy Meter */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-gray-800">AI Accuracy</span>
                </div>
                <div className="text-3xl font-bold text-purple-600">{accuracy}%</div>
                <p className="text-xs text-gray-600 mt-1">
                  {accuracy < 60 && "Needs more training"}
                  {accuracy >= 60 && accuracy < 80 && "Getting better!"}
                  {accuracy >= 80 && accuracy < 90 && "Performing well!"}
                  {accuracy >= 90 && "Excellent performance!"}
                </p>
              </div>

              {biasDetected && (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <span className="font-semibold text-gray-800">Bias Detected</span>
                  </div>
                  <p className="text-sm text-orange-800">
                    Unbalanced training data may cause AI to favor one category
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Current Image Card */}
          {currentImage && (
            <motion.div
              key={currentImage.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-8">
                <div className="text-center">
                  <div className="text-8xl mb-4">{currentImage.emoji}</div>
                  <h3 className="text-2xl font-bold text-white mb-2">{currentImage.name}</h3>
                  <p className="text-blue-100">{currentImage.description}</p>
                </div>
              </div>

              <div className="p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                  What category does this belong to?
                </h3>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => handleLabel('marine')}
                    className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg group"
                  >
                    <Fish className="w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-lg">Marine Life</div>
                    <div className="text-sm text-green-100 mt-1">Ocean creatures & ecosystems</div>
                  </button>

                  <button
                    onClick={() => handleLabel('pollution')}
                    className="bg-gradient-to-br from-red-500 to-rose-600 text-white p-6 rounded-xl hover:from-red-600 hover:to-rose-700 transition-all shadow-lg group"
                  >
                    <Trash2 className="w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-lg">Pollution</div>
                    <div className="text-sm text-red-100 mt-1">Debris, plastics, & contaminants</div>
                  </button>
                </div>

                <button
                  onClick={() => setShowHint(!showHint)}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-2 mx-auto"
                >
                  <Info className="w-4 h-4" />
                  {showHint ? 'Hide Hint' : 'Need a Hint?'}
                </button>

                {showHint && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg"
                  >
                    <p className="text-sm text-yellow-800">
                      <strong>Hint:</strong> This is actually <strong>{currentImage.type === 'marine' ? 'Marine Life' : 'Pollution'}</strong>.
                      {currentImage.type === 'marine' ? ' Living organisms are part of the ocean ecosystem.' : ' This item doesn\'t belong in the ocean and harms marine life.'}
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Captain Marina Guide - Training Guidance */}
        {trainingProgress > 20 && (
          <CaptainMarinaGuide
            message={marinaMessages.aiGuardian.training.message}
            emotion={marinaMessages.aiGuardian.training.emotion}
            position="bottom-right"
            dismissible={true}
            showInitially={true}
            autoHide={true}
            autoHideDuration={15000}
          />
        )}
      </div>
    );
  }

  // Lesson Phase - Teaching about AI, bias, and ethics
  if (phase === 'lesson') {
    const marineCount = Object.values(userLabels).filter(l => l === 'marine').length;
    const pollutionCount = Object.values(userLabels).filter(l => l === 'pollution').length;
    const correctCount = Object.entries(userLabels).filter(
      ([id, label]) => {
        const image = trainingImages.find(img => img.id === parseInt(id));
        return image && label === image.type;
      }
    ).length;
    const accuracyScore = Math.round((correctCount / trainingImages.length) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white">
              <Lightbulb className="w-12 h-12 mb-4" />
              <h1 className="text-3xl font-bold mb-2">Understanding Your AI</h1>
              <p className="text-purple-100">Let's explore what you just created and why it matters</p>
            </div>

            <div className="p-8">
              {/* Training Summary */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-6">
                <h2 className="font-bold text-xl text-blue-900 mb-4">Your Training Summary</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-3xl font-bold text-blue-600">{trainingImages.length}</div>
                    <div className="text-sm text-gray-600">Images Labeled</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600">{accuracyScore}%</div>
                    <div className="text-sm text-gray-600">Your Accuracy</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600">{accuracy}%</div>
                    <div className="text-sm text-gray-600">AI Performance</div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-white rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Training Data Balance:</div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-green-600">Marine Life</span>
                        <span className="text-green-600 font-bold">{marineCount}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(marineCount / trainingImages.length) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-red-600">Pollution</span>
                        <span className="text-red-600 font-bold">{pollutionCount}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${(pollutionCount / trainingImages.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Lessons */}
              <h2 className="text-2xl font-bold text-gray-800 mb-4">What You Learned</h2>

              <div className="space-y-4 mb-8">
                {/* Lesson 1: Training Data */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 mb-2">Training Data is Everything</h3>
                      <p className="text-gray-700 text-sm leading-relaxed mb-2">
                        AI doesn't "know" anything on its own. It only learns from the examples (training data)
                        you provide. The quality and diversity of your training data directly determines how
                        well the AI performs.
                      </p>
                      <div className="bg-white p-3 rounded-lg mt-2">
                        <p className="text-xs text-gray-600">
                          <strong>Real Example:</strong> If you only trained the AI on tropical fish, it might
                          struggle to identify Arctic marine life like seals or penguins.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lesson 2: Bias */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 mb-2">Bias in AI Systems</h3>
                      <p className="text-gray-700 text-sm leading-relaxed mb-2">
                        {biasDetected ? (
                          <>Your training data was <strong>unbalanced</strong> ({marineCount} marine vs {pollutionCount} pollution).
                          This creates bias - the AI learns to favor the category with more examples.</>
                        ) : (
                          <>Your training data was well-balanced! When one category has significantly more examples,
                          the AI becomes biased and may incorrectly classify new images.</>
                        )}
                      </p>
                      <div className="bg-white p-3 rounded-lg mt-2">
                        <p className="text-xs text-gray-600">
                          <strong>Real Impact:</strong> Biased AI in ocean monitoring could miss pollution hotspots
                          or misidentify endangered species, leading to poor conservation decisions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lesson 3: Real-World Applications */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 mb-2">AI for Ocean Conservation</h3>
                      <p className="text-gray-700 text-sm leading-relaxed mb-3">
                        Scientists are using AI right now to protect our oceans:
                      </p>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span><strong>Flukebook.org:</strong> Identifies individual whales and dolphins from photos</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span><strong>Satellite AI:</strong> Detects plastic pollution from space</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span><strong>Underwater Cameras:</strong> Automatically counts fish populations</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span><strong>Coral Reef Monitoring:</strong> Tracks coral bleaching and health</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Lesson 4: Ethics */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      4
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 mb-2">Ethical AI Development</h3>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        As AI becomes more powerful in conservation, we must ask important questions:
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-gray-700">
                        <li>• Is our training data representative of all ocean regions?</li>
                        <li>• Could our AI disadvantage certain communities or ecosystems?</li>
                        <li>• Are we transparent about AI limitations and uncertainties?</li>
                        <li>• Do local communities have a voice in how AI is used?</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Captain Marina's Wisdom */}
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-l-4 border-cyan-500 p-6 rounded-lg mb-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">👩‍✈️</div>
                  <div>
                    <h3 className="font-bold text-lg text-cyan-900 mb-2">Captain Marina's Wisdom</h3>
                    <p className="text-cyan-800 leading-relaxed text-sm">
                      "AI is a tool, not a solution. The real power comes from combining AI with human knowledge,
                      local expertise, and compassion for our ocean. You've just taken your first step toward
                      becoming an AI-informed ocean guardian. Now let's test your AI!"
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setPhase('testing')}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                Test Your Trained AI
                <Target className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Testing Phase
  if (phase === 'testing') {
    const testComplete = testResults && Object.keys(testResults).length === testImages.length;
    const testScore = calculateTestScore();

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">AI Testing Mission</h1>
                  <p className="text-green-100">See how your AI performs on new images</p>
                </div>
                <Target className="w-12 h-12" />
              </div>
            </div>

            {!testComplete && (
              <div className="p-6 bg-blue-50">
                <p className="text-gray-700 mb-2">
                  <strong>Instructions:</strong> For each image below, predict what YOUR AI would classify it as.
                  Then we'll show you what the AI actually predicted based on your training!
                </p>
                <p className="text-sm text-gray-600">
                  These are new images the AI has never seen before.
                </p>
              </div>
            )}
          </div>

          {/* Test Images Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {testImages.map((image) => {
              const result = testResults?.[image.id];
              const hasAnswered = !!result;

              return (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden ${
                    hasAnswered ? (result.correct ? 'ring-2 ring-green-500' : 'ring-2 ring-red-500') : ''
                  }`}
                >
                  <div className={`p-6 ${
                    hasAnswered
                      ? result.correct
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50'
                        : 'bg-gradient-to-br from-red-50 to-rose-50'
                      : 'bg-gradient-to-br from-blue-50 to-cyan-50'
                  }`}>
                    <div className="text-center">
                      <div className="text-6xl mb-3">{image.emoji}</div>
                      <h3 className="font-bold text-lg text-gray-800">{image.name}</h3>
                      <p className="text-sm text-gray-600">{image.description}</p>
                    </div>
                  </div>

                  <div className="p-6">
                    {!hasAnswered ? (
                      <>
                        <p className="text-sm text-gray-700 mb-3 text-center">
                          What will the AI classify this as?
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => handleTest(image.id, 'marine')}
                            className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold text-sm transition-colors"
                          >
                            Marine Life
                          </button>
                          <button
                            onClick={() => handleTest(image.id, 'pollution')}
                            className="bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold text-sm transition-colors"
                          >
                            Pollution
                          </button>
                        </div>
                      </>
                    ) : (
                      <div>
                        <div className={`flex items-center justify-center gap-2 mb-3 ${
                          result.correct ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {result.correct ? (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              <span className="font-bold">Correct!</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-5 h-5" />
                              <span className="font-bold">Incorrect</span>
                            </>
                          )}
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-sm">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600">AI Predicted:</span>
                            <span className={`font-semibold ${
                              result.prediction === 'marine' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {result.prediction === 'marine' ? 'Marine Life' : 'Pollution'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Actually:</span>
                            <span className="font-semibold text-gray-800">
                              {result.actualType === 'marine' ? 'Marine Life' : 'Pollution'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Results Summary */}
          {testComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className={`p-8 ${
                testScore >= 80
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                  : testScore >= 60
                  ? 'bg-gradient-to-r from-yellow-600 to-orange-600'
                  : 'bg-gradient-to-r from-red-600 to-rose-600'
              } text-white`}>
                <div className="text-center">
                  <Award className="w-16 h-16 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold mb-2">Test Complete!</h2>
                  <div className="text-5xl font-bold my-4">{testScore}%</div>
                  <p className="text-xl">
                    Your AI correctly identified {Object.values(testResults).filter(r => r.correct).length} out of {testImages.length} images
                  </p>
                </div>
              </div>

              <div className="p-8">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-6">
                  <h3 className="font-bold text-lg text-blue-900 mb-3">Performance Analysis</h3>
                  <p className="text-gray-700 text-sm mb-3">
                    {testScore >= 80 && "Excellent! Your AI is performing very well. Good training data leads to reliable AI systems."}
                    {testScore >= 60 && testScore < 80 && "Good performance! With more diverse training data, your AI could improve further."}
                    {testScore < 60 && "Your AI needs more training. This often happens with limited or biased training data."}
                  </p>
                  <p className="text-gray-600 text-sm">
                    Remember: AI accuracy depends on the quality, quantity, and diversity of training data.
                    Real-world AI systems are trained on thousands or millions of images!
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={restartTraining}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-xl font-bold hover:from-blue-700 hover:to-cyan-700 transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Train Again
                  </button>
                  <button
                    onClick={() => setPhase('complete')}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    View Certificate
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // Complete Phase - Certificate
  if (phase === 'complete') {
    const testScore = calculateTestScore();

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden border-8 border-gradient-to-r from-blue-600 to-cyan-600"
          >
            {/* Certificate Header */}
            <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-12 text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <Waves className="w-full h-full" />
              </div>
              <div className="relative z-10">
                <Award className="w-20 h-20 mx-auto mb-4" />
                <h1 className="text-4xl font-bold mb-2">Certificate of Achievement</h1>
                <p className="text-xl text-blue-100">AI Ocean Guardian Training Program</p>
              </div>
            </div>

            {/* Certificate Body */}
            <div className="p-12 text-center">
              <p className="text-gray-600 mb-4">This certifies that</p>
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Ocean Conservation Trainee</h2>
              <p className="text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
                has successfully completed the AI Ocean Guardian training program, demonstrating
                understanding of machine learning, training data, AI bias, and ethical considerations
                in artificial intelligence for ocean conservation.
              </p>

              {/* Achievement Stats */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{trainingImages.length}</div>
                  <div className="text-sm text-gray-600">Images Trained</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
                  <div className="text-4xl font-bold text-green-600 mb-2">{testScore}%</div>
                  <div className="text-sm text-gray-600">AI Test Score</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
                  <div className="text-4xl font-bold text-purple-600 mb-2">{accuracy}%</div>
                  <div className="text-sm text-gray-600">AI Accuracy</div>
                </div>
              </div>

              {/* Skills Learned */}
              <div className="bg-gray-50 p-6 rounded-xl mb-8">
                <h3 className="font-bold text-lg text-gray-800 mb-4">Skills & Knowledge Acquired</h3>
                <div className="grid md:grid-cols-2 gap-3 text-left">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Machine Learning Fundamentals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Training Data Quality</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">AI Bias Recognition</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Ethical AI Development</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Ocean Conservation Technology</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Species & Pollution Identification</span>
                  </div>
                </div>
              </div>

              {/* Captain Marina's Final Message */}
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-l-4 border-cyan-500 p-6 rounded-lg mb-8">
                <div className="flex items-start gap-4">
                  <div className="text-5xl">👩‍✈️</div>
                  <div className="text-left">
                    <h3 className="font-bold text-lg text-cyan-900 mb-2">Captain Marina's Message</h3>
                    <p className="text-cyan-800 leading-relaxed">
                      "Congratulations, Ocean Guardian! You've learned how AI can be a powerful ally in
                      protecting our oceans. But remember - technology is just a tool. The real change
                      comes from passionate people like you who combine knowledge with action. Keep learning,
                      keep questioning, and keep fighting for our ocean. The future of marine conservation
                      is in your hands!"
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={restartTraining}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Train New AI
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Award className="w-5 h-5" />
                  Print Certificate
                </button>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Issued by Ocean Aware Guardian • AI Education for Conservation
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return null;
};

export default AIMarineTrainer;
