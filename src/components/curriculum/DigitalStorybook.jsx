import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Home,
  Volume2,
  VolumeX,
  Award,
  CheckCircle,
  Star,
  Waves,
  Fish,
  Anchor,
  Ship,
  Heart
} from 'lucide-react';

/**
 * Captain Marina's Ocean Journey - Interactive Digital Storybook
 * Point IV from ocean-contest.txt - Phase 2 Critical Feature
 *
 * An engaging 5-chapter illustrated story for ages 6-12
 * Teaching ocean conservation through narrative adventure
 *
 * Features:
 * - 5 illustrated chapters with animations
 * - Interactive quizzes after each chapter
 * - Progress tracking
 * - Read-aloud narration (text-to-speech)
 * - Pairs with experiments, games, and data art
 */

const DigitalStorybook = () => {
  const [currentChapter, setCurrentChapter] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [completedChapters, setCompletedChapters] = useState(new Set());
  const [readAloud, setReadAloud] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const chapters = [
    {
      id: 0,
      title: "Marina's Magical Beach",
      emoji: "🏖️",
      icon: Waves,
      content: [
        "Captain Marina wasn't always a captain. When she was 8 years old, she was just Marina - a girl who loved the ocean more than anything in the world.",
        "Every day after school, Marina would run to Coral Cove Beach near her home. She would collect shells, watch the waves, and talk to the hermit crabs.",
        '"Hello, little friends!" she would say to the crabs. "What adventures did you have today?"',
        "One sunny afternoon, Marina noticed something strange. The beach looked... smaller. The sand seemed to be disappearing!",
        '"Where did all the sand go?" she wondered, looking at the high tide line marked on the rocks.',
        "Her grandmother, Abuela Rosa, sat on a beach chair nearby. She had been coming to this beach for 60 years.",
        '"Abuela," Marina asked, "was the beach always this small?"',
        'Abuela Rosa smiled sadly. "No, mi amor. When I was your age, the beach was twice as wide. The ocean is slowly taking it back."',
        '"Why?" Marina asked. "Is the ocean angry?"',
        '"Not angry," Abuela explained. "The ocean is changing. The water is rising, and the waves are getting stronger. This is called coastal erosion."',
        "That night, Marina couldn't sleep. She loved her beach. She loved her hermit crab friends. She had to do something!",
        "She decided right then: she would learn everything about the ocean and find a way to protect it."
      ],
      illustration: {
        background: "from-sky-200 via-blue-200 to-sand-200",
        elements: [
          { emoji: "🌊", position: "top-10 left-10" },
          { emoji: "🏖️", position: "bottom-10 right-10" },
          { emoji: "🐚", position: "top-32 right-20" },
          { emoji: "🦀", position: "bottom-20 left-20" },
          { emoji: "👧", position: "center" }
        ]
      },
      quiz: {
        question: "What did Marina notice was happening to her favorite beach?",
        options: [
          { text: "It was getting bigger", correct: false, feedback: "Not quite! The beach was actually getting smaller." },
          { text: "The sand was disappearing", correct: true, feedback: "Exactly! The beach was shrinking due to coastal erosion." },
          { text: "It was getting too crowded", correct: false, feedback: "The story was about the beach size, not crowds." },
          { text: "The water was turning purple", correct: false, feedback: "The ocean color wasn't changing - the beach size was!" }
        ]
      },
      realWorldConnection: "Just like Marina's beach, 75% of beaches in the United States are eroding. That means they're getting smaller every year!",
      activityLink: {
        text: "Try the Beach Erosion Experiment!",
        tab: "ocean-curriculum",
        section: "experiments"
      }
    },

    {
      id: 1,
      title: "The Great Wave Mystery",
      emoji: "🌊",
      icon: Ship,
      content: [
        "Marina spent the next few years learning about the ocean. She read every book in the library about waves, tides, and marine life.",
        "When she turned 12, her teacher, Ms. Chen, announced a special project: 'We're going on a field trip to the Marine Science Center!'",
        "At the center, Marina met Dr. Patel, a tsunami scientist. Dr. Patel showed them a huge water tank.",
        '"Who wants to see a tsunami?" Dr. Patel asked.',
        'Marina\'s hand shot up immediately. "Yes, please!"',
        "Dr. Patel created an 'earthquake' at the bottom of the tank. Marina watched in amazement as waves spread out in circles.",
        '"Notice something interesting?" Dr. Patel asked. "The waves are small in deep water..."',
        "As the waves approached the shallow end of the tank, they grew taller and taller!",
        '"This is what happens in real tsunamis," Dr. Patel explained. "In the deep ocean, tsunami waves might only be 1 foot tall. But when they reach shallow water near shore, they can grow to 100 feet!"',
        "Marina learned about the warning signs: a strong earthquake, the ocean water pulling back (called drawback), and a loud roaring sound.",
        '"If you ever feel a strong earthquake at the beach," Dr. Patel said seriously, "don\'t wait for a warning. Run to high ground immediately!"',
        "Marina practiced the escape route with her class. Up the hill, to the evacuation point, marked with a special blue sign.",
        'That night, Marina drew a map of all the safe places near her beach. "I\'ll make sure everyone knows," she promised herself.'
      ],
      illustration: {
        background: "from-blue-400 via-blue-300 to-blue-200",
        elements: [
          { emoji: "🌊", position: "top-5 left-5 text-6xl" },
          { emoji: "🏃‍♀️", position: "bottom-10 right-10" },
          { emoji: "⚠️", position: "top-20 right-10" },
          { emoji: "🔬", position: "bottom-20 left-10" },
          { emoji: "🗺️", position: "center" }
        ]
      },
      quiz: {
        question: "What should you do if you feel a strong earthquake while at the beach?",
        options: [
          { text: "Go swimming", correct: false, feedback: "Never go in the water after an earthquake! A tsunami might be coming." },
          { text: "Run to high ground immediately", correct: true, feedback: "Perfect! Don't wait for warnings - head to safety right away!" },
          { text: "Wait to see what happens", correct: false, feedback: "There's no time to wait! Move to safety immediately." },
          { text: "Take photos of the ocean", correct: false, feedback: "Safety first! Get to high ground, then think about anything else." }
        ]
      },
      realWorldConnection: "The 2011 Japan tsunami killed fewer people than the 2004 Indian Ocean tsunami because Japan had early warning systems and practiced evacuation drills - just like Marina!",
      activityLink: {
        text: "Play Tsunami Escape Game!",
        tab: "games",
        section: "tsunami"
      }
    },

    {
      id: 2,
      title: "The Disappearing Shells",
      emoji: "🐚",
      icon: Fish,
      content: [
        "When Marina turned 14, she joined the Junior Ocean Explorers club. Every Saturday, they would explore tide pools and collect data.",
        'One day, her friend Kenji noticed something odd. "Marina, look at this shell. It\'s covered in tiny holes!"',
        "Marina examined the shell under her magnifying glass. It looked like it was dissolving!",
        '"We should ask Professor Lee," Marina suggested. Professor Lee was a marine chemist who volunteered with their club.',
        'Professor Lee examined the shell carefully. "Ah," she said. "This is evidence of ocean acidification."',
        '"Ocean what-ification?" Kenji asked.',
        "Professor Lee explained: 'The ocean absorbs carbon dioxide from the air - about 30% of all the CO₂ humans produce! This is good because it slows down climate change.'",
        '"But there\'s a problem," she continued. "When CO₂ dissolves in water, it creates carbonic acid. This makes the ocean more acidic."',
        '"Like lemon juice?" Marina asked.',
        '"Exactly! And just like how vinegar can dissolve an eggshell, this acid dissolves shells and coral skeletons that are made of calcium carbonate."',
        "Professor Lee showed them a graph. The ocean\'s pH had dropped from 8.2 to 8.1 in just 200 years.",
        '"That doesn\'t sound like much," Kenji said.',
        '"The pH scale is logarithmic," Professor Lee explained. "That small change means the ocean is 30% more acidic than before!"',
        "Marina thought about all the creatures with shells: clams, oysters, coral, even tiny plankton that fish eat.",
        '"If their shells dissolve, they can\'t survive," Marina realized. "And if they can\'t survive..."',
        '"The whole ocean food web is in trouble," Professor Lee finished.',
        "Marina looked at the damaged shell in her hand. It was a warning sign. She had to help people understand."
      ],
      illustration: {
        background: "from-purple-200 via-pink-200 to-orange-200",
        elements: [
          { emoji: "🐚", position: "top-10 left-10 text-5xl opacity-50" },
          { emoji: "🪸", position: "top-10 right-10" },
          { emoji: "🦪", position: "bottom-10 left-10" },
          { emoji: "🧪", position: "bottom-10 right-10" },
          { emoji: "📊", position: "center" }
        ]
      },
      quiz: {
        question: "What happens when the ocean absorbs too much CO₂?",
        options: [
          { text: "It becomes more acidic and harms shells", correct: true, feedback: "Correct! Ocean acidification dissolves calcium carbonate shells and coral." },
          { text: "It turns purple", correct: false, feedback: "The ocean doesn't change color from CO₂, but it does become more acidic!" },
          { text: "Fish learn to fly", correct: false, feedback: "That would be amazing, but not realistic! CO₂ makes the ocean acidic." },
          { text: "Nothing bad happens", correct: false, feedback: "Unfortunately, ocean acidification is a serious problem for marine life." }
        ]
      },
      realWorldConnection: "Pacific Northwest oyster farms have lost millions of baby oysters because ocean acidification makes it hard for them to build their shells!",
      activityLink: {
        text: "Try the Ocean Acidification Experiment!",
        tab: "ocean-curriculum",
        section: "experiments"
      }
    },

    {
      id: 3,
      title: "Rising Tides, Rising Hope",
      emoji: "📈",
      icon: Anchor,
      content: [
        "Marina was now 16 and captain of her high school's Marine Conservation Club. But she faced her biggest challenge yet.",
        'The mayor announced plans to build a concrete seawall to "protect" the beach from rising seas.',
        '"This will destroy the tide pools!" Marina told her club members. "All the crabs, starfish, and anemones will have no home!"',
        '"But what else can we do?" asked her friend Zara. "Sea level is rising. My grandmother\'s house is flooding more every year."',
        "Marina knew Zara was right. Global sea level had risen 8 inches since 1880, and it was accelerating.",
        'She remembered Dr. Patel saying, "Science gives us knowledge, but action creates change."',
        "Marina spent weeks researching alternatives to concrete seawalls. She learned about 'living shorelines' - using nature to protect nature.",
        "Instead of concrete, living shorelines use oyster reefs, marsh plants, and sand dunes to absorb wave energy.",
        "Marina created a presentation with data, photos, and cost comparisons. Living shorelines cost less, lasted longer, and supported wildlife!",
        "She presented to the town council. Her hands shook, but her voice was strong.",
        '"We can protect our community AND protect marine life," Marina argued. "We don\'t have to choose."',
        "She showed them examples from Louisiana, Maryland, and Florida where living shorelines worked perfectly.",
        "The council members looked at each other. Then the mayor smiled.",
        '"Young lady, you\'ve done your homework. Let\'s try the living shoreline approach."',
        "One year later, Marina stood on the beach with her club. Oyster reefs were thriving. Marsh grass was growing. Hermit crabs were everywhere!",
        '"We did it," Zara said, hugging Marina.',
        'Marina smiled, watching the waves. "We did it together. And this is just the beginning."'
      ],
      illustration: {
        background: "from-green-300 via-blue-300 to-blue-400",
        elements: [
          { emoji: "🌱", position: "top-10 left-10" },
          { emoji: "🦪", position: "top-20 right-10" },
          { emoji: "🦀", position: "bottom-10 left-10" },
          { emoji: "🏛️", position: "top-32 left-32" },
          { emoji: "🎯", position: "center" }
        ]
      },
      quiz: {
        question: "What is a 'living shoreline'?",
        options: [
          { text: "A concrete wall", correct: false, feedback: "No - living shorelines use natural materials, not concrete!" },
          { text: "Natural solutions like oyster reefs and marsh plants that protect coastlines", correct: true, feedback: "Perfect! Living shorelines work with nature to protect shores and wildlife." },
          { text: "A beach that moves to a new location", correct: false, feedback: "Beaches don't move like that! Living shorelines stay in place but use natural materials." },
          { text: "A type of boat", correct: false, feedback: "Not a boat - it's a nature-based coastal protection method!" }
        ]
      },
      realWorldConnection: "Many coastal communities are now choosing living shorelines over concrete seawalls because they're cheaper, support wildlife, and last longer!",
      activityLink: {
        text: "Play Rebuild the Coast Game!",
        tab: "games",
        section: "rebuild"
      }
    },

    {
      id: 4,
      title: "Captain Marina's Mission",
      emoji: "⭐",
      icon: Heart,
      content: [
        "Marina is now 18 and ready for college. She earned a scholarship to study marine biology and coastal engineering.",
        'But before she left for university, she had one more mission: the OceanAware Guardian website.',
        '"I want to share everything I\'ve learned," Marina explained to Abuela Rosa. "So other kids can protect their oceans too."',
        "She created experiments so kids could see coastal erosion at home - just like she did in science class.",
        "She built games where players could practice tsunami evacuation and build coastal defenses.",
        "She made data visualizations showing ocean changes over time - turning scary numbers into beautiful, understandable art.",
        '"The ocean gave me so much," Marina said. "It taught me to observe, to question, to care. Now I want to give back."',
        "On launch day, Marina sat on Coral Cove Beach with her laptop. The living shoreline was working beautifully.",
        "Marsh grass waved in the breeze. Oysters filtered the water. Fish swam in the restored habitat.",
        'She clicked "Publish" and OceanAware Guardian went live.',
        "Within days, she got messages from kids around the world:",
        '"Your experiment helped me understand why our beach is shrinking!" - Emma, California',
        '"I showed my teacher the tsunami game. Now our whole school is doing evacuation drills!" - Yuki, Japan',
        '"We\'re starting a living shoreline project because of your story!" - Carlos, Florida',
        "Marina smiled. She wasn't just Captain Marina of one beach anymore.",
        "She was Captain Marina of a global crew of ocean protectors.",
        '"Remember," she wrote in her welcome message. "You don\'t have to be a grown-up to make a difference."',
        '"You don\'t need a fancy lab or expensive equipment."',
        '"All you need is curiosity, courage, and care for the ocean."',
        '"The ocean needs you. Your beach needs you. Your hermit crab friends need you."',
        '"So what are you waiting for, future ocean guardian?"',
        '"Let\'s get to work! 🌊"'
      ],
      illustration: {
        background: "from-yellow-200 via-orange-200 to-pink-300",
        elements: [
          { emoji: "⭐", position: "top-5 left-5 text-6xl animate-pulse" },
          { emoji: "🌍", position: "top-10 right-10 text-5xl" },
          { emoji: "💻", position: "bottom-10 left-10" },
          { emoji: "🌊", position: "bottom-10 right-10 text-5xl" },
          { emoji: "👩‍🎓", position: "center text-6xl" }
        ]
      },
      quiz: {
        question: "What is the most important lesson from Captain Marina's story?",
        options: [
          { text: "Only adults can help the ocean", correct: false, feedback: "Not true! Marina started making a difference when she was just 8 years old." },
          { text: "Ocean problems are too big to solve", correct: false, feedback: "Never give up! Marina showed that small actions lead to big changes." },
          { text: "You're never too young to make a difference", correct: true, feedback: "Exactly! With curiosity, courage, and care, anyone can protect the ocean!" },
          { text: "Only scientists can understand the ocean", correct: false, feedback: "Anyone can learn about and help the ocean - including YOU!" }
        ]
      },
      realWorldConnection: "Real youth activists around the world are creating change just like Marina! From beach cleanups to meeting with world leaders, young people are ocean heroes every day.",
      activityLink: {
        text: "Explore All Ocean Activities!",
        tab: "ocean-curriculum",
        section: "all"
      }
    }
  ];

  const currentChapterData = chapters[currentChapter];

  // Calculate progress
  const progress = ((completedChapters.size / chapters.length) * 100).toFixed(0);
  const allChaptersComplete = completedChapters.size === chapters.length;

  // Handle quiz submission
  const handleQuizAnswer = (optionIndex) => {
    const option = currentChapterData.quiz.options[optionIndex];
    setQuizAnswers({ ...quizAnswers, [currentChapter]: option });

    if (option.correct) {
      const newCompleted = new Set(completedChapters);
      newCompleted.add(currentChapter);
      setCompletedChapters(newCompleted);

      if (newCompleted.size === chapters.length && !celebrating) {
        setCelebrating(true);
        setTimeout(() => setCelebrating(false), 3000);
      }
    }
  };

  // Text-to-speech (simplified for demo)
  const toggleReadAloud = () => {
    setReadAloud(!readAloud);
    if (!readAloud && 'speechSynthesis' in window) {
      // Create full text with title and all content
      const fullText = `${currentChapterData.title}. ${currentChapterData.content.join(' ')}`;
      const utterance = new SpeechSynthesisUtterance(fullText);
      utterance.rate = 0.9; // Slightly slower for better comprehension
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    } else if (readAloud) {
      window.speechSynthesis.cancel();
    }
  };

  // Navigation
  const goToChapter = (index) => {
    setCurrentChapter(index);
    setShowQuiz(false);
    window.speechSynthesis?.cancel();
  };

  const nextChapter = () => {
    if (currentChapter < chapters.length - 1) {
      goToChapter(currentChapter + 1);
    }
  };

  const previousChapter = () => {
    if (currentChapter > 0) {
      goToChapter(currentChapter - 1);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center mb-4">
          <BookOpen className="w-12 h-12 text-purple-600 mr-3" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Captain Marina's Ocean Journey
          </h1>
        </div>
        <p className="text-xl text-gray-700 mb-2">An Interactive Ocean Adventure Story</p>
        <p className="text-gray-600 mb-4">For ages 6-12 • 5 Chapters • Learn through story!</p>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-700">Progress:</span>
            <span className="text-sm font-bold text-purple-600">{progress}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {chapters.map((ch, i) => (
              <div
                key={ch.id}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                  completedChapters.has(i)
                    ? 'bg-green-500 text-white'
                    : i === currentChapter
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {completedChapters.has(i) ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chapter Navigation */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <div className="flex flex-wrap gap-2 justify-center">
          {chapters.map((ch, i) => (
            <button
              key={ch.id}
              onClick={() => goToChapter(i)}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                currentChapter === i
                  ? 'bg-purple-600 text-white shadow-lg scale-105'
                  : completedChapters.has(i)
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-2xl mr-2">{ch.emoji}</span>
              {ch.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Story Area */}
      <AnimatePresence mode="wait">
        {!showQuiz ? (
          <motion.div
            key={`chapter-${currentChapter}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="bg-white rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Illustration Area */}
            <div className={`relative h-64 bg-gradient-to-br ${currentChapterData.illustration.background} p-8 overflow-hidden`}>
              {currentChapterData.illustration.elements.map((el, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className={`absolute ${el.position} text-4xl`}
                >
                  {el.emoji}
                </motion.div>
              ))}

              {/* Chapter Title Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center">
                  <span className="text-5xl mr-3">{currentChapterData.emoji}</span>
                  Chapter {currentChapter + 1}: {currentChapterData.title}
                </h2>
              </div>
            </div>

            {/* Story Content */}
            <div className="p-8">
              {/* Controls */}
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={toggleReadAloud}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                    readAloud
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {readAloud ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  {readAloud ? 'Stop Reading' : 'Read Aloud'}
                </button>

                <div className="text-sm text-gray-600 font-bold">
                  📖 {currentChapterData.content.length} paragraphs • ~3 min read
                </div>
              </div>

              {/* Story Text */}
              <div className="prose prose-lg max-w-none">
                {currentChapterData.content.map((paragraph, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-gray-800 leading-relaxed mb-4 text-lg"
                  >
                    {paragraph}
                  </motion.p>
                ))}
              </div>

              {/* Real-World Connection */}
              <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  Did You Know? (Real Science!)
                </h3>
                <p className="text-blue-800">{currentChapterData.realWorldConnection}</p>
              </div>

              {/* Activity Link */}
              <div className="mt-6 bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
                <h3 className="font-bold text-green-900 mb-2 flex items-center">
                  <currentChapterData.icon className="w-5 h-5 mr-2" />
                  Try It Yourself!
                </h3>
                <p className="text-green-800 mb-3">{currentChapterData.activityLink.text}</p>
                <button className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors">
                  Go to Activity →
                </button>
              </div>

              {/* Chapter Complete Button */}
              <div className="mt-8 text-center">
                <button
                  onClick={() => setShowQuiz(true)}
                  className="bg-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {completedChapters.has(currentChapter) ? (
                    <>
                      <CheckCircle className="inline w-6 h-6 mr-2" />
                      Chapter Complete! Continue →
                    </>
                  ) : (
                    <>
                      Take Chapter Quiz →
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Quiz Screen */
          <motion.div
            key={`quiz-${currentChapter}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-2xl p-8"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Chapter {currentChapter + 1} Quiz
            </h2>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 mb-6">
              <p className="text-xl text-gray-800 font-bold mb-6">
                {currentChapterData.quiz.question}
              </p>

              <div className="space-y-3">
                {currentChapterData.quiz.options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuizAnswer(i)}
                    disabled={quizAnswers[currentChapter]}
                    className={`w-full p-4 rounded-lg font-bold text-left transition-all ${
                      quizAnswers[currentChapter]
                        ? option.correct
                          ? 'bg-green-500 text-white shadow-lg'
                          : quizAnswers[currentChapter].text === option.text
                          ? 'bg-red-300 text-red-900'
                          : 'bg-gray-200 text-gray-600'
                        : 'bg-white hover:bg-purple-100 hover:shadow-lg border-2 border-gray-200'
                    }`}
                  >
                    {String.fromCharCode(65 + i)}. {option.text}
                  </button>
                ))}
              </div>

              {quizAnswers[currentChapter] && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-6 p-4 rounded-lg ${
                    quizAnswers[currentChapter].correct
                      ? 'bg-green-100 border-2 border-green-500'
                      : 'bg-yellow-100 border-2 border-yellow-500'
                  }`}
                >
                  <p className={`font-bold ${
                    quizAnswers[currentChapter].correct ? 'text-green-900' : 'text-yellow-900'
                  }`}>
                    {quizAnswers[currentChapter].feedback}
                  </p>
                </motion.div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowQuiz(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors"
              >
                Back to Story
              </button>

              {quizAnswers[currentChapter]?.correct && (
                <button
                  onClick={() => {
                    if (currentChapter < chapters.length - 1) {
                      nextChapter();
                    } else {
                      setShowQuiz(false);
                    }
                  }}
                  className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors"
                >
                  {currentChapter < chapters.length - 1 ? 'Next Chapter →' : 'Finish Story! 🎉'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={previousChapter}
          disabled={currentChapter === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${
            currentChapter === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-100 shadow-lg'
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>

        <button
          onClick={() => goToChapter(0)}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold bg-white text-gray-700 hover:bg-gray-100 shadow-lg transition-all"
        >
          <Home className="w-5 h-5" />
          Back to Chapter 1
        </button>

        <button
          onClick={nextChapter}
          disabled={currentChapter === chapters.length - 1}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${
            currentChapter === chapters.length - 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-100 shadow-lg'
          }`}
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Completion Celebration */}
      <AnimatePresence>
        {allChaptersComplete && celebrating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              className="bg-white rounded-2xl p-12 text-center max-w-md shadow-2xl"
            >
              <div className="text-8xl mb-4">🎉</div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Congratulations, Ocean Guardian!
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                You've completed Captain Marina's Ocean Journey! You're now ready to protect our oceans!
              </p>
              <div className="flex gap-3">
                <Award className="w-16 h-16 text-yellow-500 mx-auto" />
                <Star className="w-16 h-16 text-purple-500 mx-auto" />
                <Waves className="w-16 h-16 text-blue-500 mx-auto" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DigitalStorybook;
