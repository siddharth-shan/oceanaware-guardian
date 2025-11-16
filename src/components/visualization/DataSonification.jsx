import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Info,
  Waves,
  Thermometer,
  Droplet,
  Heart,
  TrendingDown,
  TrendingUp,
  Sparkles
} from 'lucide-react';

/**
 * Ocean Data Sonification - Converting Data to Sound
 * Phase 3 Advanced Feature - Innovation & Accessibility
 *
 * Transforms ocean health metrics into musical soundscapes
 * - Multi-sensory experience (visual + auditory)
 * - Accessibility for visually impaired users
 * - Unique innovation for contest differentiation
 * - Educational value: "hear" the ocean's story
 *
 * Musical Mapping:
 * - Ocean Temperature → Pitch (warmer = higher notes)
 * - pH Level → Harmony (more acidic = dissonant)
 * - Coral Health → Timbre (healthy = rich tones, dying = thin tones)
 * - Sea Level → Volume (higher = louder)
 * - Marine Biodiversity → Rhythm complexity
 */

const DataSonification = () => {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [currentTimePeriod, setCurrentTimePeriod] = useState('1980');
  const [showInfo, setShowInfo] = useState(false);
  const audioContextRef = useRef(null);
  const oscillatorsRef = useRef([]);
  const gainNodeRef = useRef(null);

  // Ocean data across time periods
  const oceanData = {
    '1980': {
      year: 1980,
      temperature: 13.8, // °C global ocean surface temp
      ph: 8.15, // Ocean pH (baseline)
      coralHealth: 95, // % healthy coral
      seaLevel: 0, // cm above 1980 baseline
      biodiversity: 100, // % baseline
      fishPopulation: 100 // % baseline
    },
    '2000': {
      year: 2000,
      temperature: 14.2,
      ph: 8.11,
      coralHealth: 75,
      seaLevel: 5,
      biodiversity: 85,
      fishPopulation: 70
    },
    '2020': {
      year: 2020,
      temperature: 14.6,
      ph: 8.06,
      coralHealth: 50,
      seaLevel: 12,
      biodiversity: 70,
      fishPopulation: 50
    },
    '2050': {
      year: 2050,
      temperature: 15.2, // Projected
      ph: 8.00, // Projected
      coralHealth: 25,
      seaLevel: 30,
      biodiversity: 50,
      fishPopulation: 30
    },
    '2100': {
      year: 2100,
      temperature: 16.0, // Projected
      ph: 7.95, // Projected
      coralHealth: 5,
      seaLevel: 80,
      biodiversity: 30,
      fishPopulation: 15
    }
  };

  const currentData = oceanData[currentTimePeriod];

  // Initialize Web Audio API
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.connect(audioContextRef.current.destination);

    return () => {
      stopSonification();
      audioContextRef.current?.close();
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = muted ? 0 : volume;
    }
  }, [volume, muted]);

  // Convert ocean metrics to musical parameters
  const dataToSound = (data) => {
    // Temperature → Pitch (200-800 Hz range)
    // Warmer ocean = higher frequency (more anxiety-inducing)
    const tempFreq = 200 + ((data.temperature - 13) / 3) * 600;

    // pH → Harmony (consonant to dissonant)
    // Lower pH (more acidic) = more dissonant intervals
    const phHarmony = 8.15 - data.ph; // 0 = healthy, 0.2 = crisis
    const harmonyInterval = phHarmony > 0.1 ? 7 : 5; // Tritone (dissonant) vs Perfect 5th

    // Coral Health → Wave shape and complexity
    // Healthy = sine (pure tone), Dying = sawtooth (harsh)
    const waveType = data.coralHealth > 70 ? 'sine' : data.coralHealth > 40 ? 'triangle' : 'sawtooth';

    // Sea Level → Overall volume envelope
    const seaLevelVolume = 0.3 + (data.seaLevel / 100) * 0.4;

    // Biodiversity → Number of simultaneous tones
    const toneCount = Math.max(1, Math.floor((data.biodiversity / 100) * 5));

    // Fish Population → Pulse rate (healthy = slower, crisis = faster/anxious)
    const pulseRate = 0.5 + ((100 - data.fishPopulation) / 100) * 2; // 0.5-2.5 Hz

    return {
      tempFreq,
      harmonyInterval,
      waveType,
      seaLevelVolume,
      toneCount,
      pulseRate,
      phHarmony
    };
  };

  // Start playing sonification
  const startSonification = () => {
    if (!audioContextRef.current) return;

    stopSonification(); // Clear any existing oscillators

    const params = dataToSound(currentData);
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    // Create oscillators for the soundscape
    const createOscillator = (freq, type, delaySeconds = 0) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + delaySeconds);

      // Pulsing volume envelope
      oscGain.gain.setValueAtTime(0, now + delaySeconds);
      oscGain.gain.linearRampToValueAtTime(params.seaLevelVolume * 0.3, now + delaySeconds + 0.5);

      // Create pulsing effect based on fish population
      const pulseDuration = 1 / params.pulseRate;
      for (let i = 0; i < 20; i++) {
        const pulseTime = now + delaySeconds + 0.5 + (i * pulseDuration);
        oscGain.gain.linearRampToValueAtTime(params.seaLevelVolume * 0.1, pulseTime);
        oscGain.gain.linearRampToValueAtTime(params.seaLevelVolume * 0.3, pulseTime + pulseDuration / 2);
      }

      osc.connect(oscGain);
      oscGain.connect(gainNodeRef.current);
      osc.start(now + delaySeconds);

      oscillatorsRef.current.push({ osc, gain: oscGain });
      return osc;
    };

    // Base tone (temperature)
    createOscillator(params.tempFreq, params.waveType, 0);

    // Harmony tone (pH level)
    if (params.toneCount >= 2) {
      const harmonyFreq = params.tempFreq * (params.harmonyInterval / 12 * Math.log2(2));
      createOscillator(harmonyFreq, params.waveType, 0.2);
    }

    // Biodiversity tones (additional layers)
    if (params.toneCount >= 3) {
      createOscillator(params.tempFreq * 0.5, 'sine', 0.4); // Sub-bass
    }
    if (params.toneCount >= 4) {
      createOscillator(params.tempFreq * 1.5, 'triangle', 0.6);
    }
    if (params.toneCount >= 5) {
      createOscillator(params.tempFreq * 2, 'sine', 0.8); // High shimmer
    }

    setPlaying(true);
  };

  // Stop playing
  const stopSonification = () => {
    oscillatorsRef.current.forEach(({ osc }) => {
      try {
        osc.stop();
      } catch (e) {
        // Already stopped
      }
    });
    oscillatorsRef.current = [];
    setPlaying(false);
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (playing) {
      stopSonification();
    } else {
      startSonification();
    }
  };

  // Change time period
  const handleTimePeriodChange = (year) => {
    const wasPlaying = playing;
    stopSonification();
    setCurrentTimePeriod(year);
    if (wasPlaying) {
      setTimeout(() => startSonification(), 100);
    }
  };

  // Get health status
  const getHealthStatus = (data) => {
    const avgHealth = (data.coralHealth + data.biodiversity + data.fishPopulation) / 3;
    if (avgHealth > 80) return { label: 'Healthy', color: 'green', icon: Heart };
    if (avgHealth > 50) return { label: 'At Risk', color: 'yellow', icon: TrendingDown };
    return { label: 'Crisis', color: 'red', icon: TrendingDown };
  };

  const healthStatus = getHealthStatus(currentData);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center mb-4">
          <Music className="w-12 h-12 text-purple-600 mr-3" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Ocean Data Sonification
          </h1>
        </div>
        <p className="text-xl text-gray-700 mb-3">
          Listen to the Ocean's Story Through Sound
        </p>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Experience ocean health data as musical soundscapes. Each metric is transformed into sound:
          temperature becomes pitch, pH creates harmony, and biodiversity adds layers of complexity.
        </p>

        <button
          onClick={() => setShowInfo(!showInfo)}
          className="mt-4 text-blue-600 hover:text-blue-700 font-bold flex items-center justify-center mx-auto"
        >
          <Info className="w-4 h-4 mr-2" />
          {showInfo ? 'Hide' : 'Show'} How It Works
        </button>

        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg text-left max-w-2xl mx-auto"
          >
            <h3 className="font-bold text-blue-900 mb-3">How Ocean Data Becomes Music:</h3>
            <ul className="space-y-2 text-blue-800 text-sm">
              <li><strong>🌡️ Temperature → Pitch:</strong> Warmer ocean = higher notes (more anxiety-inducing)</li>
              <li><strong>💧 pH Level → Harmony:</strong> More acidic = dissonant, unsettling intervals</li>
              <li><strong>🪸 Coral Health → Tone Quality:</strong> Healthy = pure sine waves, dying = harsh sawtooth</li>
              <li><strong>📈 Sea Level → Volume:</strong> Higher seas = louder, more intense soundscape</li>
              <li><strong>🐠 Biodiversity → Layers:</strong> Rich ecosystems = complex multi-layered harmonies</li>
              <li><strong>🐟 Fish Population → Pulse Rate:</strong> Crisis = faster, anxious pulsing</li>
            </ul>
            <p className="mt-4 text-blue-900 font-bold">
              🎧 Listen with headphones for the best experience!
            </p>
          </motion.div>
        )}
      </div>

      {/* Timeline Selector */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          Select Time Period to Hear Ocean Changes
        </h2>

        <div className="flex flex-wrap justify-center gap-3">
          {Object.keys(oceanData).map((year) => (
            <button
              key={year}
              onClick={() => handleTimePeriodChange(year)}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                currentTimePeriod === year
                  ? 'bg-purple-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {year}
              {parseInt(year) > 2025 && (
                <span className="ml-2 text-xs opacity-70">(Projected)</span>
              )}
            </button>
          ))}
        </div>

        {/* Progress Line */}
        <div className="mt-6 relative">
          <div className="absolute top-1/2 left-0 right-0 h-2 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-full" />
          <div className="relative flex justify-between">
            {Object.keys(oceanData).map((year) => (
              <div
                key={year}
                className={`w-4 h-4 rounded-full border-2 ${
                  currentTimePeriod === year
                    ? 'bg-purple-600 border-purple-600 scale-150'
                    : 'bg-white border-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Visualization & Controls */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Left: Visual Representation */}
        <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-6 text-center">{currentData.year}</h2>

          <div className="space-y-4 mb-8">
            <DataMetric
              icon={Thermometer}
              label="Ocean Temperature"
              value={`${currentData.temperature.toFixed(1)}°C`}
              percent={(currentData.temperature - 13) / 3 * 100}
              sound="Higher pitch = warmer"
            />
            <DataMetric
              icon={Droplet}
              label="Ocean pH (Acidity)"
              value={currentData.ph.toFixed(2)}
              percent={((8.15 - currentData.ph) / 0.2) * 100}
              inverted
              sound="Lower pH = dissonant harmony"
            />
            <DataMetric
              icon={Waves}
              label="Coral Health"
              value={`${currentData.coralHealth}%`}
              percent={currentData.coralHealth}
              sound="Lower health = harsher tones"
            />
            <DataMetric
              icon={TrendingUp}
              label="Sea Level Rise"
              value={`+${currentData.seaLevel} cm`}
              percent={(currentData.seaLevel / 100) * 100}
              sound="Higher level = louder volume"
            />
            <DataMetric
              icon={Heart}
              label="Marine Biodiversity"
              value={`${currentData.biodiversity}%`}
              percent={currentData.biodiversity}
              sound="More biodiversity = more layers"
            />
          </div>

          {/* Overall Health Indicator */}
          <div className={`bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center`}>
            <healthStatus.icon className="w-12 h-12 mx-auto mb-2" />
            <div className="text-2xl font-bold mb-1">
              Ocean Health: {healthStatus.label}
            </div>
            <div className="text-sm opacity-90">
              {healthStatus.label === 'Healthy' && 'Ecosystem thriving, diverse soundscape'}
              {healthStatus.label === 'At Risk' && 'Ecosystem stressed, simplified sounds'}
              {healthStatus.label === 'Crisis' && 'Ecosystem failing, harsh tones'}
            </div>
          </div>
        </div>

        {/* Right: Audio Controls */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Soundscape Player
          </h2>

          {/* Waveform Visualization (simplified) */}
          <div className="bg-gray-900 rounded-lg p-8 mb-6 h-48 flex items-center justify-center overflow-hidden relative">
            {playing ? (
              <div className="flex items-center justify-center gap-1 h-full">
                {Array.from({ length: 50 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="bg-purple-500 w-2 rounded-full"
                    animate={{
                      height: [
                        Math.random() * 100 + 20,
                        Math.random() * 100 + 20,
                        Math.random() * 100 + 20
                      ]
                    }}
                    transition={{
                      duration: 0.5 + Math.random() * 0.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center">
                <Music className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Press play to hear the ocean's soundscape</p>
              </div>
            )}
          </div>

          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className={`w-full py-6 rounded-xl font-bold text-xl mb-4 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 ${
              playing
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
            }`}
          >
            {playing ? (
              <><Pause className="inline w-6 h-6 mr-2" /> Pause Soundscape</>
            ) : (
              <><Play className="inline w-6 h-6 mr-2" /> Play Soundscape</>
            )}
          </button>

          {/* Volume Control */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-gray-700 flex items-center">
                {muted ? <VolumeX className="w-5 h-5 mr-2" /> : <Volume2 className="w-5 h-5 mr-2" />}
                Volume
              </label>
              <button
                onClick={() => setMuted(!muted)}
                className="text-sm text-purple-600 hover:text-purple-700 font-bold"
              >
                {muted ? 'Unmute' : 'Mute'}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              disabled={muted}
            />
          </div>

          {/* Info Boxes */}
          <div className="space-y-3">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-blue-900 text-sm">
                <Sparkles className="inline w-4 h-4 mr-1" />
                <strong>Accessibility Feature:</strong> This sonification allows visually impaired users to experience ocean data through sound.
              </p>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-green-900 text-sm">
                <strong>Try This:</strong> Play each time period from 1980 to 2100. Notice how the sound becomes higher, harsher, and more anxious as ocean health declines.
              </p>
            </div>
          </div>

          {/* Download Button (Framework) */}
          <button
            className="w-full mt-6 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center justify-center"
            onClick={() => alert('Download feature: Export this soundscape as MP3 for sharing (in development)')}
          >
            <Download className="w-5 h-5 mr-2" />
            Download Soundscape (MP3)
          </button>
        </div>
      </div>

      {/* Educational Information */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-2xl p-8">
        <h2 className="text-3xl font-bold mb-6 text-center">Why Sonify Ocean Data?</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6">
            <Music className="w-12 h-12 mb-3" />
            <h3 className="font-bold text-xl mb-2">Multi-Sensory Learning</h3>
            <p className="text-sm">
              Different people process information differently. Hearing data in addition to seeing it helps more students understand ocean changes.
            </p>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6">
            <Heart className="w-12 h-12 mb-3" />
            <h3 className="font-bold text-xl mb-2">Emotional Connection</h3>
            <p className="text-sm">
              Music evokes emotion. Hearing the ocean's decline as increasingly harsh, anxious sounds creates a powerful emotional impact that inspires action.
            </p>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6">
            <Sparkles className="w-12 h-12 mb-3" />
            <h3 className="font-bold text-xl mb-2">Accessibility</h3>
            <p className="text-sm">
              Visually impaired users can fully experience ocean data through sound, making environmental education more inclusive for all.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center bg-white/20 backdrop-blur-sm rounded-lg p-4">
          <p className="text-sm">
            <strong>Real-World Application:</strong> Scientists use sonification to detect patterns in data that might be invisible in graphs. NASA sonifies space data, and marine biologists sonify whale migration patterns!
          </p>
        </div>
      </div>
    </div>
  );
};

// Data Metric Component
const DataMetric = ({ icon: Icon, label, value, percent, inverted, sound }) => {
  const actualPercent = inverted ? 100 - percent : percent;
  const color = actualPercent > 70 ? 'bg-green-400' : actualPercent > 40 ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Icon className="w-5 h-5 mr-2" />
          <span className="font-bold">{label}</span>
        </div>
        <span className="text-xl font-bold">{value}</span>
      </div>
      <div className="w-full bg-white/20 rounded-full h-2 mb-1">
        <div
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${actualPercent}%` }}
        />
      </div>
      <p className="text-xs opacity-80 italic">{sound}</p>
    </div>
  );
};

export default DataSonification;
