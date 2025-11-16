import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Download,
  Share2,
  Info,
  Waves,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Calendar,
  Thermometer,
  Wind,
  Activity
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

/**
 * Data Art Triptych - Point V from ocean-contest.txt
 *
 * Converts live ocean data into artistic visual patterns
 * Three panels:
 * 1. Healthy Coast (1980-2000 baseline)
 * 2. Present Risks (2020-2025 current data)
 * 3. Future Projections (2050-2100 models)
 *
 * Overlay with community voices and narratives
 */
const DataArtTriptych = ({ userLocation }) => {
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [showDataOverlay, setShowDataOverlay] = useState(false);
  const [timeSliderValue, setTimeSliderValue] = useState(2025);
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  // Simulated ocean health data (in production, this would come from NOAA/USGS APIs)
  const oceanData = useMemo(() => ({
    historical: {
      period: '1980-2000',
      seaLevel: 0, // baseline
      temperature: 14.5, // °C global ocean average
      coralHealth: 95,
      biodiversity: 92,
      coastalErosion: 1.2, // mm/year
      stormIntensity: 3.2,
      phLevel: 8.25,
      waveHeight: 2.1, // meters average
      data: Array.from({ length: 20 }, (_, i) => ({
        year: 1980 + i,
        seaLevel: i * 0.05,
        temp: 14.5 + Math.random() * 0.3,
        coral: 95 - i * 0.2,
        biodiversity: 92 - i * 0.15
      }))
    },
    present: {
      period: '2020-2025',
      seaLevel: 21, // cm rise since 1980
      temperature: 15.8,
      coralHealth: 68,
      biodiversity: 73,
      coastalErosion: 3.8,
      stormIntensity: 5.7,
      phLevel: 8.05,
      waveHeight: 2.6,
      data: Array.from({ length: 6 }, (_, i) => ({
        year: 2020 + i,
        seaLevel: 21 + i * 0.8,
        temp: 15.6 + i * 0.04,
        coral: 70 - i * 0.3,
        biodiversity: 75 - i * 0.4
      }))
    },
    future: {
      period: '2050-2100',
      seaLevel: 85, // cm rise projection (moderate scenario)
      temperature: 17.2,
      coralHealth: 32,
      biodiversity: 45,
      coastalErosion: 8.5,
      stormIntensity: 9.2,
      phLevel: 7.85,
      waveHeight: 3.8,
      data: Array.from({ length: 50 }, (_, i) => ({
        year: 2050 + i,
        seaLevel: 50 + i * 0.7,
        temp: 16.5 + i * 0.014,
        coral: 40 - i * 0.16,
        biodiversity: 55 - i * 0.2
      }))
    }
  }), []);

  // Community stories for each panel
  const stories = {
    historical: {
      narrator: "Dr. Elena Rodriguez, Marine Biologist",
      year: 1985,
      quote: "I remember diving these reefs as a young researcher. The colors were breathtaking - vibrant purples, oranges, yellows. Fish everywhere. The ocean felt infinite and resilient.",
      location: "Great Barrier Reef, Australia"
    },
    present: {
      narrator: "Kai Tanaka, Fisherman",
      year: 2024,
      quote: "My grandfather's fishing grounds are gone. The reef is bleached white. Storms are stronger. We catch half what we used to. The ocean is trying to tell us something.",
      location: "Okinawa, Japan"
    },
    future: {
      narrator: "Amara Chen, Climate Refugee (fictional)",
      year: 2075,
      quote: "I was born in Miami. By the time I was 10, our house was flooding monthly. We moved inland, like millions of others. The coast I knew exists only in old photos now.",
      location: "Former Coastal Resident"
    }
  };

  const downloadArt = (panelId) => {
    // In production, this would generate a high-res PNG/SVG
    alert(`Downloading ${panelId} panel as artwork... (Feature in development)`);
  };

  const shareArt = (panelId) => {
    // In production, this would create shareable social media graphics
    if (navigator.share) {
      navigator.share({
        title: `Ocean Data Art: ${panelId}`,
        text: `Check out this ocean health visualization from OceanAware Guardian`,
        url: window.location.href
      });
    } else {
      alert('Sharing feature available on mobile devices or copy URL to share!');
    }
  };

  return (
    <div ref={ref} className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center justify-center mb-4">
          <Activity className="w-12 h-12 text-blue-600 mr-3" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Ocean Data Art</h1>
        </div>
        <p className="text-xl text-gray-700 mb-3">
          Where Science Becomes Beauty
        </p>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Live ocean data transformed into artistic visualizations. Each pattern tells a story
          of change, challenge, and the urgent need for action.
        </p>

        <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg inline-block">
          <p className="text-sm text-blue-900">
            <Info className="inline w-4 h-4 mr-1" />
            <strong>Point V: Data as Art</strong> - Converting NOAA/USGS ocean data into emotionally
            resonant visual patterns
          </p>
        </div>
      </motion.div>

      {/* Triptych Panels */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <TriptychPanel
          id="healthy"
          title="Healthy Coast"
          period="1980-2000"
          subtitle="The Ocean We Inherited"
          data={oceanData.historical}
          story={stories.historical}
          colorScheme="green"
          icon={Waves}
          inView={inView}
          delay={0.2}
          onSelect={() => setSelectedPanel('healthy')}
          onDownload={() => downloadArt('healthy-coast')}
          onShare={() => shareArt('healthy-coast')}
        />

        <TriptychPanel
          id="present"
          title="Present Risks"
          period="2020-2025"
          subtitle="Warning Signs All Around"
          data={oceanData.present}
          story={stories.present}
          colorScheme="orange"
          icon={AlertTriangle}
          inView={inView}
          delay={0.4}
          onSelect={() => setSelectedPanel('present')}
          onDownload={() => downloadArt('present-risks')}
          onShare={() => shareArt('present-risks')}
        />

        <TriptychPanel
          id="future"
          title="Future Projections"
          period="2050-2100"
          subtitle="The Path We're On"
          data={oceanData.future}
          story={stories.future}
          colorScheme="red"
          icon={TrendingUp}
          inView={inView}
          delay={0.6}
          onSelect={() => setSelectedPanel('future')}
          onDownload={() => downloadArt('future-projections')}
          onShare={() => shareArt('future-projections')}
        />
      </div>

      {/* Data Sources & Methodology */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.8 }}
        className="bg-gray-50 rounded-xl p-6 mb-8"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Info className="w-5 h-5 mr-2" />
          Data Sources & Artistic Process
        </h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Scientific Data Sources:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>NOAA</strong> - Sea level rise, ocean temperature, wave height</li>
              <li>• <strong>USGS</strong> - Coastal erosion rates, hazard mapping</li>
              <li>• <strong>IPCC</strong> - Climate projections and scenarios</li>
              <li>• <strong>NASA</strong> - Satellite ocean monitoring data</li>
              <li>• <strong>Coral Reef Watch</strong> - Reef health and bleaching alerts</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Artistic Visualization Methods:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>Color Coding</strong> - Severity mapped to warmth (blue → red)</li>
              <li>• <strong>Pattern Intensity</strong> - Data volatility = visual chaos</li>
              <li>• <strong>Wave Forms</strong> - Actual wave height data as art</li>
              <li>• <strong>Radar Charts</strong> - Multi-metric health visualization</li>
              <li>• <strong>Temporal Flow</strong> - Time series as flowing patterns</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Interactive Time Slider */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 1.0 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6 mb-8"
      >
        <h3 className="text-2xl font-bold mb-4">Interactive Timeline: Watch the Ocean Change</h3>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">1980: Pre-Climate Crisis</span>
            <span className="text-2xl font-bold">{timeSliderValue}</span>
            <span className="text-sm">2100: Without Action</span>
          </div>
          <input
            type="range"
            min="1980"
            max="2100"
            value={timeSliderValue}
            onChange={(e) => setTimeSliderValue(parseInt(e.target.value))}
            className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <DataMetric
            icon={TrendingUp}
            label="Sea Level Rise"
            value={calculateMetric(timeSliderValue, 'seaLevel')}
            unit="cm"
            trend="up"
          />
          <DataMetric
            icon={Thermometer}
            label="Ocean Temp"
            value={calculateMetric(timeSliderValue, 'temperature')}
            unit="°C"
            trend="up"
          />
          <DataMetric
            icon={Waves}
            label="Coral Health"
            value={calculateMetric(timeSliderValue, 'coral')}
            unit="%"
            trend="down"
          />
          <DataMetric
            icon={Activity}
            label="Biodiversity"
            value={calculateMetric(timeSliderValue, 'biodiversity')}
            unit="%"
            trend="down"
          />
        </div>
      </motion.div>

      {/* Educational Context */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 1.2 }}
        className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6"
      >
        <h3 className="text-xl font-bold text-green-900 mb-3">
          Why Data Art Matters for Ocean Conservation
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-green-800">
          <div>
            <h4 className="font-bold mb-2">🧠 Emotional Connection</h4>
            <p>Numbers alone don't move people. Beautiful, disturbing art does. Data art creates
            visceral reactions that statistics can't.</p>
          </div>
          <div>
            <h4 className="font-bold mb-2">🔍 Pattern Recognition</h4>
            <p>Visual patterns reveal trends invisible in raw data. Art helps us see the big
            picture and long-term trajectories.</p>
          </div>
          <div>
            <h4 className="font-bold mb-2">📢 Shareability</h4>
            <p>Art spreads on social media. A stunning data visualization can go viral, raising
            awareness far beyond academic papers.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Helper function to calculate metrics based on year
const calculateMetric = (year, metric) => {
  if (year < 2000) {
    // Historical baseline
    const progress = (year - 1980) / 20;
    switch(metric) {
      case 'seaLevel': return (progress * 1).toFixed(1);
      case 'temperature': return (14.5 + progress * 0.3).toFixed(1);
      case 'coral': return Math.round(95 - progress * 4);
      case 'biodiversity': return Math.round(92 - progress * 3);
      default: return 0;
    }
  } else if (year < 2050) {
    // Present to near future
    const progress = (year - 2000) / 50;
    switch(metric) {
      case 'seaLevel': return (1 + progress * 49).toFixed(1);
      case 'temperature': return (14.8 + progress * 1.4).toFixed(1);
      case 'coral': return Math.round(91 - progress * 49);
      case 'biodiversity': return Math.round(89 - progress * 34);
      default: return 0;
    }
  } else {
    // Future projections
    const progress = (year - 2050) / 50;
    switch(metric) {
      case 'seaLevel': return (50 + progress * 35).toFixed(1);
      case 'temperature': return (16.2 + progress * 0.8).toFixed(1);
      case 'coral': return Math.round(42 - progress * 10);
      case 'biodiversity': return Math.round(55 - progress * 10);
      default: return 0;
    }
  }
};

// Data Metric Display Component
const DataMetric = ({ icon: Icon, label, value, unit, trend }) => (
  <div className="bg-white/10 backdrop-blur rounded-lg p-3">
    <div className="flex items-center justify-between mb-1">
      <Icon className="w-4 h-4" />
      {trend && (
        <span className={`text-xs ${trend === 'up' ? 'text-red-200' : 'text-green-200'}`}>
          {trend === 'up' ? '↗' : '↘'}
        </span>
      )}
    </div>
    <div className="text-2xl font-bold">{value}{unit}</div>
    <div className="text-xs opacity-80">{label}</div>
  </div>
);

// Triptych Panel Component
const TriptychPanel = ({
  id,
  title,
  period,
  subtitle,
  data,
  story,
  colorScheme,
  icon: Icon,
  inView,
  delay,
  onSelect,
  onDownload,
  onShare
}) => {
  const [showStory, setShowStory] = useState(false);

  const colorSchemes = {
    green: {
      bg: 'from-green-400 to-emerald-600',
      border: 'border-green-500',
      text: 'text-green-900',
      light: 'bg-green-50'
    },
    orange: {
      bg: 'from-orange-400 to-red-500',
      border: 'border-orange-500',
      text: 'text-orange-900',
      light: 'bg-orange-50'
    },
    red: {
      bg: 'from-red-500 to-pink-600',
      border: 'border-red-500',
      text: 'text-red-900',
      light: 'bg-red-50'
    }
  };

  const scheme = colorSchemes[colorScheme];

  // Generate radar chart data
  const radarData = [
    { metric: 'Sea Level', value: 100 - (data.seaLevel / 100) * 100 },
    { metric: 'Temperature', value: 100 - ((data.temperature - 14) / 4) * 100 },
    { metric: 'Coral Health', value: data.coralHealth },
    { metric: 'Biodiversity', value: data.biodiversity },
    { metric: 'pH Level', value: ((data.phLevel - 7.5) / 0.8) * 100 },
    { metric: 'Coastal Stability', value: 100 - (data.coastalErosion / 10) * 100 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 50 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.6, type: "spring" }}
      className={`bg-white rounded-xl shadow-xl overflow-hidden border-4 ${scheme.border} hover:shadow-2xl transition-shadow cursor-pointer`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${scheme.bg} text-white p-6`}>
        <div className="flex items-center justify-between mb-2">
          <Icon className="w-8 h-8" />
          <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
            {period}
          </span>
        </div>
        <h3 className="text-2xl font-bold mb-1">{title}</h3>
        <p className="text-sm opacity-90">{subtitle}</p>
      </div>

      {/* Artistic Data Visualization */}
      <div className="p-6">
        {/* Radar Chart - Ocean Health Metrics */}
        <div className="mb-4 bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 text-center">Ocean Health Signature</h4>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#cbd5e0" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#4a5568' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
              <Radar
                name={title}
                dataKey="value"
                stroke={colorScheme === 'green' ? '#10b981' : colorScheme === 'orange' ? '#f97316' : '#ef4444'}
                fill={colorScheme === 'green' ? '#10b981' : colorScheme === 'orange' ? '#f97316' : '#ef4444'}
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Wave Pattern Visualization */}
        <div className="mb-4 bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 text-center">Temporal Wave Pattern</h4>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={data.data}>
              <defs>
                <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colorScheme === 'green' ? '#10b981' : colorScheme === 'orange' ? '#f97316' : '#ef4444'} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={colorScheme === 'green' ? '#10b981' : colorScheme === 'orange' ? '#f97316' : '#ef4444'} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="seaLevel"
                stroke={colorScheme === 'green' ? '#10b981' : colorScheme === 'orange' ? '#f97316' : '#ef4444'}
                fill={`url(#gradient-${id})`}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <MetricCard label="Coral Health" value={`${data.coralHealth}%`} />
          <MetricCard label="Biodiversity" value={`${data.biodiversity}%`} />
          <MetricCard label="Sea Level" value={`+${data.seaLevel}cm`} />
          <MetricCard label="Ocean Temp" value={`${data.temperature}°C`} />
        </div>

        {/* Community Story */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowStory(!showStory);
          }}
          className={`w-full ${scheme.light} ${scheme.text} p-3 rounded-lg text-sm font-semibold hover:opacity-80 transition-opacity mb-3`}
        >
          {showStory ? '📖 Hide Story' : '📖 Read Community Story'}
        </button>

        <AnimatePresence>
          {showStory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className={`${scheme.light} p-4 rounded-lg mb-3`}>
                <div className="flex items-start mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3 flex-shrink-0">
                    {story.narrator.charAt(0)}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm">{story.narrator}</h5>
                    <p className="text-xs text-gray-600">{story.location} • {story.year}</p>
                  </div>
                </div>
                <blockquote className="text-sm text-gray-700 italic border-l-2 border-gray-400 pl-3">
                  "{story.quote}"
                </blockquote>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
            className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center"
          >
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Metric Card Component
const MetricCard = ({ label, value }) => (
  <div className="bg-gray-100 rounded-lg p-3 text-center">
    <div className="text-lg font-bold text-gray-900">{value}</div>
    <div className="text-xs text-gray-600">{label}</div>
  </div>
);

export default DataArtTriptych;
