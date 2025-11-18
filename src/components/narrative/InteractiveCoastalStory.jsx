import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Waves,
  AlertTriangle,
  TrendingUp,
  Home,
  Fish,
  Trees,
  Users,
  Heart,
  Shield,
  ArrowDown,
  Info
} from 'lucide-react';
import CaptainMarinaGuide, { marinaMessages } from '../guide/CaptainMarinaGuide';

/**
 * Interactive Coastal Story - Point VII from ocean-contest.txt
 *
 * A scroll-driven narrative showing how coastal erosion progresses over time.
 * Users scroll through a coastal scene that transforms from 2020 → 2050 → 2100
 * with scientific facts and community impact stories.
 *
 * Aligns with Bow Seat's emphasis on storytelling + narrative elements
 */
const InteractiveCoastalStory = () => {
  const containerRef = useRef(null);
  const [currentEra, setCurrentEra] = useState('present');

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Transform scroll position into era progression (0 = 2020, 0.5 = 2050, 1 = 2100)
  const erosionProgress = useTransform(scrollYProgress, [0, 0.4, 0.7, 1], [0, 30, 70, 100]);
  const seaLevel = useTransform(scrollYProgress, [0, 0.4, 0.7, 1], [0, 20, 50, 100]);
  const coastlineWidth = useTransform(scrollYProgress, [0, 0.4, 0.7, 1], [100, 70, 40, 20]);

  // Update current era based on scroll position
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      if (latest < 0.35) setCurrentEra('present');
      else if (latest < 0.65) setCurrentEra('warning');
      else setCurrentEra('future');
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <div ref={containerRef} className="relative">
      {/* Captain Marina Guide - Introduction */}
      <CaptainMarinaGuide
        message={marinaMessages.interactiveStory.intro.message}
        emotion={marinaMessages.interactiveStory.intro.emotion}
        position="bottom-right"
        dismissible={true}
        showInitially={true}
        autoHide={true}
        autoHideDuration={12000}
      />

      {/* Sticky Header showing current era */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-sm shadow-md py-3 px-6 rounded-lg mb-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${
              currentEra === 'present' ? 'bg-green-500' :
              currentEra === 'warning' ? 'bg-yellow-500' :
              'bg-red-500'
            }`} />
            <span className="font-bold text-lg">
              {currentEra === 'present' && '2020: Present Day'}
              {currentEra === 'warning' && '2050: Warning Signs'}
              {currentEra === 'future' && '2100: Without Action'}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ArrowDown className="w-4 h-4 animate-bounce" />
            <span className="hidden sm:inline">Scroll to see the future</span>
          </div>
        </div>
      </div>

      {/* Introduction Section */}
      <IntroSection />

      {/* Era 1: Present Day (2020) */}
      <EraSection
        year="2020"
        title="Our Coasts Today"
        subtitle="Thriving Communities, Hidden Threats"
        color="green"
        facts={[
          {
            icon: Home,
            title: "634 Million People",
            description: "Live in coastal areas less than 10m above sea level",
            source: "UN Atlas of the Oceans"
          },
          {
            icon: Fish,
            title: "$3 Trillion Annual Value",
            description: "Ocean economy supports billions in fishing, tourism, trade",
            source: "OECD Ocean Economy"
          },
          {
            icon: Trees,
            title: "Natural Protection",
            description: "Mangroves, coral reefs, and wetlands protect 200M+ people from storms",
            source: "Nature Conservancy"
          }
        ]}
        stories={[
          {
            name: "Maria, Miami Beach",
            quote: "I grew up playing on this beach. The water seems closer every year, but I never thought much of it until now.",
            impact: "Lives 3 blocks from ocean"
          }
        ]}
      />

      {/* Transition Section 1 */}
      <TransitionSection
        title="Rising Temperatures, Rising Seas"
        description="Global temperatures have increased 1.1°C since pre-industrial times. The ocean absorbs 90% of this heat."
        stat="3mm/year"
        statLabel="Current sea level rise rate"
      />

      {/* Era 2: 2050 Warning Signs */}
      <EraSection
        year="2050"
        title="The Warning We Ignored"
        subtitle="Visible Consequences, Urgent Action Needed"
        color="yellow"
        facts={[
          {
            icon: AlertTriangle,
            title: "30cm Sea Level Rise",
            description: "At current rates, seas will rise ~30cm by 2050, flooding many coastal areas",
            source: "IPCC Special Report"
          },
          {
            icon: TrendingUp,
            title: "Doubled Coastal Floods",
            description: "High-tide flooding events occur 10x more frequently in many cities",
            source: "NOAA Sea Level Rise"
          },
          {
            icon: Users,
            title: "200M Climate Refugees",
            description: "Coastal communities displaced by erosion, flooding, and storms",
            source: "World Bank Groundswell Report"
          }
        ]}
        stories={[
          {
            name: "Carlos, Former Beach Resident",
            quote: "Our family home was built in 1950. By 2045, we had to move inland. The beach where I proposed to my wife is now underwater at high tide.",
            impact: "Relocated 3 miles inland"
          }
        ]}
      />

      {/* Transition Section 2 */}
      <TransitionSection
        title="Accelerating Change"
        description="Feedback loops accelerate warming: ice melts → less reflection → more heat → faster melting"
        stat="1 meter+"
        statLabel="Projected rise by 2100 (high emissions scenario)"
        warning={true}
      />

      {/* Era 3: 2100 Future Without Action */}
      <EraSection
        year="2100"
        title="The Future We Can Prevent"
        subtitle="A Vision We Must Avoid"
        color="red"
        facts={[
          {
            icon: Waves,
            title: "1-2 Meter Sea Rise",
            description: "Major coastal cities partially submerged. Trillions in infrastructure lost",
            source: "IPCC AR6 Report"
          },
          {
            icon: AlertTriangle,
            title: "50% Coral Reefs Lost",
            description: "Ocean acidification and warming devastate marine ecosystems",
            source: "NOAA Coral Reef Watch"
          },
          {
            icon: Home,
            title: "Global Crisis",
            description: "Mass migration, economic collapse in coastal regions, biodiversity loss",
            source: "Multiple Scientific Studies"
          }
        ]}
        stories={[
          {
            name: "Future Scientist's Log, 2100",
            quote: "We have the data from 2020-2025. They knew. They had the technology, the knowledge, the solutions. But we didn't act fast enough.",
            impact: "Learning from history"
          }
        ]}
      />

      {/* Captain Marina Guide - 2100 Warning (shows when user reaches this section) */}
      {currentEra === 'future' && (
        <CaptainMarinaGuide
          message={marinaMessages.interactiveStory.future2100.message}
          emotion={marinaMessages.interactiveStory.future2100.emotion}
          position="bottom-right"
          dismissible={true}
          showInitially={true}
          autoHide={false}
        />
      )}

      {/* Hope & Action Section */}
      <ActionSection />
    </div>
  );
};

// Introduction Section Component
const IntroSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      className="mb-16 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 md:p-12 shadow-xl"
    >
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="mb-6"
        >
          <Waves className="w-20 h-20 text-blue-600 mx-auto" />
        </motion.div>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          A Coastline's Story
        </h1>

        <p className="text-xl text-gray-700 mb-6">
          Scroll through time to witness how climate change transforms our coasts
        </p>

        <div className="bg-white/80 backdrop-blur rounded-lg p-6 mb-6">
          <p className="text-gray-800 leading-relaxed">
            This is <strong>not science fiction</strong>. Every projection you'll see is based on
            peer-reviewed climate science. The timeline you're about to explore shows what happens
            if we continue current emission trends. But here's the critical part:{' '}
            <strong className="text-blue-600">this future is not inevitable</strong>.
          </p>
        </div>

        <div className="flex items-center justify-center space-x-2 text-blue-600 animate-bounce">
          <ArrowDown className="w-6 h-6" />
          <span className="font-semibold">Begin your journey through time</span>
          <ArrowDown className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};

// Era Section Component
const EraSection = ({ year, title, subtitle, color, facts, stories }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  const colorSchemes = {
    green: {
      bg: 'from-green-50 to-emerald-50',
      border: 'border-green-300',
      text: 'text-green-900',
      accent: 'bg-green-500'
    },
    yellow: {
      bg: 'from-yellow-50 to-orange-50',
      border: 'border-yellow-300',
      text: 'text-yellow-900',
      accent: 'bg-yellow-500'
    },
    red: {
      bg: 'from-red-50 to-pink-50',
      border: 'border-red-300',
      text: 'text-red-900',
      accent: 'bg-red-500'
    }
  };

  const scheme = colorSchemes[color];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 1 }}
      className={`min-h-screen py-16 my-12 bg-gradient-to-br ${scheme.bg} rounded-2xl border-4 ${scheme.border}`}
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Era Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : {}}
            transition={{ delay: 0.2, type: "spring" }}
            className={`inline-block ${scheme.accent} text-white text-6xl font-bold px-8 py-4 rounded-full shadow-lg mb-4`}
          >
            {year}
          </motion.div>
          <h2 className={`text-4xl md:text-5xl font-bold ${scheme.text} mb-2`}>
            {title}
          </h2>
          <p className={`text-xl ${scheme.text} opacity-80`}>
            {subtitle}
          </p>
        </div>

        {/* Scientific Facts */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {facts.map((fact, index) => (
            <FactCard key={index} {...fact} delay={index * 0.1} inView={inView} />
          ))}
        </div>

        {/* Community Stories */}
        <div className="space-y-6">
          <h3 className={`text-2xl font-bold ${scheme.text} mb-4 flex items-center justify-center`}>
            <Heart className="w-6 h-6 mr-2" />
            Human Impact
          </h3>
          {stories.map((story, index) => (
            <StoryCard key={index} {...story} inView={inView} delay={0.3 + index * 0.1} />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Fact Card Component
const FactCard = ({ icon: Icon, title, description, source, delay, inView }) => {
  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={inView ? { y: 0, opacity: 1 } : {}}
      transition={{ delay, duration: 0.6 }}
      className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow"
    >
      <Icon className="w-10 h-10 text-blue-600 mb-3" />
      <h4 className="text-xl font-bold text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-700 mb-3">{description}</p>
      <div className="flex items-start text-xs text-gray-500 border-t pt-2">
        <Info className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
        <span className="italic">Source: {source}</span>
      </div>
    </motion.div>
  );
};

// Story Card Component
const StoryCard = ({ name, quote, impact, inView, delay }) => {
  return (
    <motion.div
      initial={{ x: -50, opacity: 0 }}
      animate={inView ? { x: 0, opacity: 1 } : {}}
      transition={{ delay, duration: 0.6 }}
      className="bg-white/90 backdrop-blur rounded-lg p-6 border-l-4 border-blue-500 shadow-md"
    >
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {name.charAt(0)}
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-900 mb-1">{name}</h4>
          <p className="text-sm text-gray-500 mb-2">{impact}</p>
          <blockquote className="text-gray-700 italic">
            "{quote}"
          </blockquote>
        </div>
      </div>
    </motion.div>
  );
};

// Transition Section Component
const TransitionSection = ({ title, description, stat, statLabel, warning = false }) => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.5 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      className={`my-16 py-12 ${warning ? 'bg-gradient-to-r from-orange-100 to-red-100' : 'bg-gradient-to-r from-blue-100 to-cyan-100'} rounded-xl`}
    >
      <div className="max-w-3xl mx-auto text-center px-6">
        <motion.h3
          initial={{ scale: 0.8 }}
          animate={inView ? { scale: 1 } : {}}
          transition={{ delay: 0.2, type: "spring" }}
          className={`text-3xl font-bold mb-4 ${warning ? 'text-red-900' : 'text-blue-900'}`}
        >
          {title}
        </motion.h3>
        <p className="text-lg text-gray-700 mb-6">{description}</p>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
          className={`inline-block ${warning ? 'bg-red-500' : 'bg-blue-500'} text-white px-8 py-4 rounded-lg shadow-lg`}
        >
          <div className="text-4xl font-bold mb-1">{stat}</div>
          <div className="text-sm opacity-90">{statLabel}</div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Action Section Component
const ActionSection = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  const actions = [
    {
      icon: Shield,
      title: "Support Coastal Protection",
      description: "Advocate for wetland restoration, mangrove planting, and natural coastal buffers",
      link: "#community-action"
    },
    {
      icon: TrendingUp,
      title: "Reduce Carbon Footprint",
      description: "Climate action directly protects our coasts. Every ton of CO2 prevented matters",
      link: "#ocean-quests"
    },
    {
      icon: Users,
      title: "Educate & Mobilize",
      description: "Share this story. Talk to friends, family, and representatives about coastal protection",
      link: "#share"
    },
    {
      icon: Heart,
      title: "Join Conservation Efforts",
      description: "Participate in beach cleanups, reef monitoring, and ocean advocacy campaigns",
      link: "#ocean-quests"
    }
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      className="my-16 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 rounded-2xl p-8 md:p-12 shadow-2xl border-4 border-green-300"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Shield className="w-16 h-16 text-green-600 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            This Future Is NOT Inevitable
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            We have the technology, knowledge, and power to protect our coasts.
            The question is: <strong>will we act in time?</strong>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {actions.map((action, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : {}}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
            >
              <action.icon className="w-10 h-10 text-blue-600 mb-3" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">{action.title}</h3>
              <p className="text-gray-700">{action.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold mb-3">Your Journey Doesn't End Here</h3>
          <p className="text-lg mb-6">
            Explore our Ocean Quests and Conservation Games to turn awareness into action
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors shadow-md">
              Start Ocean Quests
            </button>
            <button className="bg-green-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-600 transition-colors shadow-md">
              Play Conservation Games
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InteractiveCoastalStory;
