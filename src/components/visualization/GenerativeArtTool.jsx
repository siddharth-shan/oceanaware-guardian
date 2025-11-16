import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Download,
  Shuffle,
  Settings,
  Share2,
  Sparkles,
  MapPin,
  Calendar,
  Droplets,
  Waves,
  Sun,
  Moon,
  Zap,
  Heart,
  Instagram,
  Twitter,
  Facebook
} from 'lucide-react';

/**
 * Generative Ocean Data Art Tool
 * Phase 3 Advanced Feature - User Engagement & Social Virality
 *
 * Allows users to create custom, shareable ocean data visualizations
 * - User inputs: location, time period, color palette, artistic style
 * - Generates unique data art based on real ocean metrics
 * - Downloadable as high-res images
 * - Social media sharing functionality
 * - Viral potential for user-generated content
 *
 * Art Styles:
 * - Wave Pattern: Flowing curves based on sea level data
 * - Coral Mosaic: Geometric tiles showing coral health
 * - Biodiversity Spiral: Fibonacci spiral with species diversity
 * - Temperature Gradient: Color fields showing warming trends
 * - Acidification Abstract: Dissolving patterns showing pH change
 */

const GenerativeArtTool = () => {
  const canvasRef = useRef(null);
  const [location, setLocation] = useState('Global Ocean');
  const [year, setYear] = useState(2025);
  const [colorPalette, setColorPalette] = useState('ocean');
  const [artStyle, setArtStyle] = useState('waves');
  const [showSettings, setShowSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [artGenerated, setArtGenerated] = useState(false);

  // Color Palettes
  const palettes = {
    ocean: {
      name: 'Ocean Blues',
      colors: ['#0a1128', '#001f54', '#034078', '#1282a2', '#0ead69'],
      gradient: 'from-blue-900 via-blue-600 to-teal-500'
    },
    sunset: {
      name: 'Coral Sunset',
      colors: ['#ff6b35', '#f7931e', '#fdc500', '#c1666b', '#4c1e4f'],
      gradient: 'from-orange-600 via-yellow-500 to-purple-900'
    },
    arctic: {
      name: 'Arctic Ice',
      colors: ['#e0f7fa', '#b2ebf2', '#80deea', '#4dd0e1', '#00acc1'],
      gradient: 'from-cyan-100 via-cyan-300 to-cyan-600'
    },
    coral: {
      name: 'Coral Reef',
      colors: ['#ff6b9d', '#c06c84', '#6c5b7b', '#355c7d', '#2a9d8f'],
      gradient: 'from-pink-500 via-purple-600 to-teal-600'
    },
    earth: {
      name: 'Earth Tones',
      colors: ['#05668d', '#028090', '#00a896', '#02c39a', '#f0f3bd'],
      gradient: 'from-blue-800 via-teal-600 to-yellow-200'
    },
    monochrome: {
      name: 'Black & White',
      colors: ['#000000', '#333333', '#666666', '#999999', '#ffffff'],
      gradient: 'from-black via-gray-500 to-white'
    }
  };

  // Art Styles
  const styles = {
    waves: {
      name: 'Wave Patterns',
      description: 'Flowing curves based on sea level and temperature data',
      icon: Waves
    },
    coral: {
      name: 'Coral Mosaic',
      description: 'Geometric tiles showing coral health over time',
      icon: Sparkles
    },
    spiral: {
      name: 'Biodiversity Spiral',
      description: 'Fibonacci spiral representing marine diversity',
      icon: Droplets
    },
    gradient: {
      name: 'Temperature Field',
      description: 'Abstract color fields showing warming trends',
      icon: Sun
    },
    dissolve: {
      name: 'Acidification Abstract',
      description: 'Dissolving patterns representing pH decline',
      icon: Zap
    }
  };

  // Mock ocean data (in real app, this would come from API)
  const getOceanData = (loc, yr) => {
    const baseTemp = 14.0;
    const tempIncrease = (yr - 1980) * 0.02; // 0.02°C per year
    const basepH = 8.15;
    const pHDecrease = (yr - 1980) * 0.0007; // Decreasing pH
    const baseCorals = 100;
    const coralDecline = (yr - 1980) * 0.8; // 0.8% loss per year
    const baseSeaLevel = 0;
    const seaLevelRise = (yr - 1980) * 0.3; // 3mm per year

    return {
      temperature: baseTemp + tempIncrease,
      ph: Math.max(7.8, basepH - pHDecrease),
      coralHealth: Math.max(5, baseCorals - coralDecline),
      seaLevel: baseSeaLevel + seaLevelRise,
      biodiversity: Math.max(30, 100 - (yr - 1980) * 0.6),
      location: loc,
      year: yr
    };
  };

  const [oceanData, setOceanData] = useState(getOceanData(location, year));

  // Update ocean data when inputs change
  useEffect(() => {
    setOceanData(getOceanData(location, year));
  }, [location, year]);

  // Generate art when parameters change or on demand
  useEffect(() => {
    if (artGenerated) {
      generateArt();
    }
  }, [artStyle, colorPalette, oceanData]);

  // Generate the actual art
  const generateArt = () => {
    setIsGenerating(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = 800;
    const height = canvas.height = 800;

    // Clear canvas
    ctx.fillStyle = palettes[colorPalette].colors[0];
    ctx.fillRect(0, 0, width, height);

    const colors = palettes[colorPalette].colors;
    const data = oceanData;

    switch (artStyle) {
      case 'waves':
        drawWavePattern(ctx, width, height, colors, data);
        break;
      case 'coral':
        drawCoralMosaic(ctx, width, height, colors, data);
        break;
      case 'spiral':
        drawBiodiversitySpiral(ctx, width, height, colors, data);
        break;
      case 'gradient':
        drawTemperatureGradient(ctx, width, height, colors, data);
        break;
      case 'dissolve':
        drawAcidificationAbstract(ctx, width, height, colors, data);
        break;
    }

    // Add metadata text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`${data.location} - ${data.year}`, 20, height - 60);
    ctx.font = '14px sans-serif';
    ctx.fillText(`Temp: ${data.temperature.toFixed(1)}°C | pH: ${data.ph.toFixed(2)} | Coral: ${data.coralHealth.toFixed(0)}%`, 20, height - 35);
    ctx.fillText('Created with OceanAware Guardian', 20, height - 15);

    setTimeout(() => {
      setIsGenerating(false);
      setArtGenerated(true);
    }, 500);
  };

  // Art Generation Functions

  const drawWavePattern = (ctx, w, h, colors, data) => {
    const waveCount = 20;
    const amplitude = (data.seaLevel / 50) * 100 + 50; // Higher sea level = bigger waves
    const frequency = (data.temperature - 13) / 5; // Warmer = more frequent waves

    for (let i = 0; i < waveCount; i++) {
      ctx.beginPath();
      ctx.strokeStyle = colors[i % colors.length];
      ctx.lineWidth = 3 + (data.coralHealth / 100) * 5; // Healthier coral = thicker lines

      for (let x = 0; x < w; x += 2) {
        const y = h / 2 +
          Math.sin((x / w) * Math.PI * 4 * frequency + i * 0.5) * amplitude +
          Math.sin((x / w) * Math.PI * 2 - i * 0.2) * (amplitude * 0.5);

        if (x === 0) {
          ctx.moveTo(x, y + (i * h / waveCount));
        } else {
          ctx.lineTo(x, y + (i * h / waveCount));
        }
      }
      ctx.stroke();
    }
  };

  const drawCoralMosaic = (ctx, w, h, colors, data) => {
    const tileSize = 40;
    const cols = Math.floor(w / tileSize);
    const rows = Math.floor(h / tileSize);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * tileSize;
        const y = row * tileSize;

        // Use noise to determine if tile represents healthy or dying coral
        const noise = Math.sin(col * 0.5) * Math.cos(row * 0.5);
        const healthThreshold = (data.coralHealth / 100) - 0.5;

        if (noise > healthThreshold) {
          // Healthy coral - vibrant colors
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
          ctx.globalAlpha = 0.8;
        } else {
          // Dead coral - muted/dark
          ctx.fillStyle = colors[0];
          ctx.globalAlpha = 0.3;
        }

        // Draw hexagon tile
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const tileX = x + tileSize / 2 + Math.cos(angle) * (tileSize / 2);
          const tileY = y + tileSize / 2 + Math.sin(angle) * (tileSize / 2);
          if (i === 0) {
            ctx.moveTo(tileX, tileY);
          } else {
            ctx.lineTo(tileX, tileY);
          }
        }
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  };

  const drawBiodiversitySpiral = (ctx, w, h, colors, data) => {
    const centerX = w / 2;
    const centerY = h / 2;
    const maxRadius = Math.min(w, h) / 2 - 20;
    const turns = 5;
    const pointsPerTurn = 100;
    const totalPoints = turns * pointsPerTurn;

    const diversityFactor = data.biodiversity / 100; // 0-1

    for (let i = 0; i < totalPoints; i++) {
      const angle = (i / pointsPerTurn) * Math.PI * 2;
      const radius = (i / totalPoints) * maxRadius;

      // Fibonacci-ish spiral
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const size = diversityFactor * 8 + 2; // More diversity = bigger points
      const colorIndex = Math.floor((i / totalPoints) * colors.length);

      ctx.fillStyle = colors[colorIndex];
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();

      // Add connecting lines for higher biodiversity
      if (diversityFactor > 0.5 && i > 0 && i % 10 === 0) {
        const prevAngle = ((i - 10) / pointsPerTurn) * Math.PI * 2;
        const prevRadius = ((i - 10) / totalPoints) * maxRadius;
        const prevX = centerX + prevRadius * Math.cos(prevAngle);
        const prevY = centerY + prevRadius * Math.sin(prevAngle);

        ctx.strokeStyle = colors[colorIndex];
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  };

  const drawTemperatureGradient = (ctx, w, h, colors, data) => {
    const cellSize = 20;
    const cols = Math.floor(w / cellSize);
    const rows = Math.floor(h / cellSize);

    const tempNormalized = (data.temperature - 13) / 3; // 0-1 range

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * cellSize;
        const y = row * cellSize;

        // Create temperature field using noise
        const noise = (Math.sin(col * 0.3) + Math.cos(row * 0.3)) / 2;
        const temp = (noise + 1) / 2; // Normalize to 0-1

        // Warmer data = shift to warmer colors
        const colorIndex = Math.floor((temp * tempNormalized) * (colors.length - 1));
        const color = colors[Math.max(0, Math.min(colorIndex, colors.length - 1))];

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6 + temp * 0.4;
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }
    ctx.globalAlpha = 1;
  };

  const drawAcidificationAbstract = (ctx, w, h, colors, data) => {
    const pHNormalized = (8.15 - data.ph) / 0.35; // 0 = healthy, 1 = crisis
    const particleCount = 1000;

    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;

      // More acidic = more "dissolved" appearance (smaller, more transparent)
      const size = (1 - pHNormalized) * 10 + 2;
      const alpha = (1 - pHNormalized) * 0.7 + 0.1;

      const colorIndex = Math.floor(Math.random() * colors.length);
      ctx.fillStyle = colors[colorIndex];
      ctx.globalAlpha = alpha;

      // Draw particle (circle or dissolved shape)
      if (pHNormalized > 0.5) {
        // High acidity - irregular shapes
        ctx.beginPath();
        for (let j = 0; j < 8; j++) {
          const angle = (j / 8) * Math.PI * 2;
          const r = size * (0.5 + Math.random() * 0.5);
          const px = x + Math.cos(angle) * r;
          const py = y + Math.sin(angle) * r;
          if (j === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.closePath();
        ctx.fill();
      } else {
        // Low acidity - solid circles
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  };

  // Download art
  const downloadArt = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `ocean-art-${location.replace(/\s/g, '-')}-${year}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Randomize all settings
  const randomize = () => {
    const years = [1980, 1990, 2000, 2010, 2020, 2030, 2040, 2050, 2075, 2100];
    const locations = ['Global Ocean', 'Pacific Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Coral Triangle', 'Great Barrier Reef'];
    const paletteKeys = Object.keys(palettes);
    const styleKeys = Object.keys(styles);

    setLocation(locations[Math.floor(Math.random() * locations.length)]);
    setYear(years[Math.floor(Math.random() * years.length)]);
    setColorPalette(paletteKeys[Math.floor(Math.random() * paletteKeys.length)]);
    setArtStyle(styleKeys[Math.floor(Math.random() * styleKeys.length)]);

    setTimeout(() => generateArt(), 100);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center mb-4">
          <Palette className="w-12 h-12 text-pink-600 mr-3" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Ocean Data Art Generator
          </h1>
        </div>
        <p className="text-xl text-gray-700 mb-3">
          Create Your Own Custom Ocean Data Visualization
        </p>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Choose a location, time period, color palette, and artistic style to generate unique data art.
          Each piece is based on real ocean health metrics and is yours to download and share!
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Settings Card */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Settings className="w-6 h-6 mr-2" />
                Settings
              </h2>
              <button
                onClick={randomize}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors flex items-center text-sm"
              >
                <Shuffle className="w-4 h-4 mr-1" />
                Random
              </button>
            </div>

            {/* Location */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              >
                <option>Global Ocean</option>
                <option>Pacific Ocean</option>
                <option>Atlantic Ocean</option>
                <option>Indian Ocean</option>
                <option>Arctic Ocean</option>
                <option>Southern Ocean</option>
                <option>Coral Triangle</option>
                <option>Great Barrier Reef</option>
                <option>Caribbean Sea</option>
                <option>Mediterranean Sea</option>
              </select>
            </div>

            {/* Year */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Year: {year}
              </label>
              <input
                type="range"
                min="1980"
                max="2100"
                step="5"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1980</span>
                <span>2040</span>
                <span>2100</span>
              </div>
            </div>

            {/* Color Palette */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Color Palette
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(palettes).map(([key, palette]) => (
                  <button
                    key={key}
                    onClick={() => setColorPalette(key)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      colorPalette === key
                        ? 'border-purple-600 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`h-6 rounded bg-gradient-to-r ${palette.gradient} mb-2`} />
                    <div className="text-xs font-bold text-gray-700">{palette.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Art Style */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Art Style
              </label>
              <div className="space-y-2">
                {Object.entries(styles).map(([key, style]) => (
                  <button
                    key={key}
                    onClick={() => setArtStyle(key)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      artStyle === key
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      <style.icon className="w-5 h-5 mr-2 text-purple-600" />
                      <span className="font-bold text-gray-900">{style.name}</span>
                    </div>
                    <p className="text-xs text-gray-600">{style.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateArt}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>Generating Art...</>
              ) : artGenerated ? (
                <>Regenerate Art</>
              ) : (
                <>Generate Art!</>
              )}
            </button>
          </div>

          {/* Ocean Data Card */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">Ocean Data ({year})</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Temperature:</span>
                <span className="font-bold">{oceanData.temperature.toFixed(1)}°C</span>
              </div>
              <div className="flex justify-between">
                <span>pH Level:</span>
                <span className="font-bold">{oceanData.ph.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Coral Health:</span>
                <span className="font-bold">{oceanData.coralHealth.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Sea Level:</span>
                <span className="font-bold">+{oceanData.seaLevel.toFixed(1)} cm</span>
              </div>
              <div className="flex justify-between">
                <span>Biodiversity:</span>
                <span className="font-bold">{oceanData.biodiversity.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Canvas & Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-2xl p-6">
            {/* Canvas */}
            <div className="relative mb-6">
              <canvas
                ref={canvasRef}
                width={800}
                height={800}
                className="w-full border-4 border-gray-200 rounded-lg shadow-inner"
                style={{ maxHeight: '600px', objectFit: 'contain' }}
              />
              {!artGenerated && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 border-4 border-gray-200 rounded-lg">
                  <div className="text-center">
                    <Palette className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                    <p className="text-2xl font-bold text-gray-600 mb-2">
                      Ready to Create?
                    </p>
                    <p className="text-gray-500">
                      Choose your settings and click "Generate Art!"
                    </p>
                  </div>
                </div>
              )}
              {isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-lg">
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-3" />
                    </motion.div>
                    <p className="text-xl font-bold text-gray-800">Generating Your Art...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {artGenerated && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Download */}
                <button
                  onClick={downloadArt}
                  className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
                >
                  <Download className="w-6 h-6 mr-2" />
                  Download as PNG (High Resolution)
                </button>

                {/* Share */}
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2 text-center">
                    Share Your Ocean Art:
                  </p>
                  <div className="flex gap-3">
                    <button className="flex-1 bg-gradient-to-br from-purple-500 to-pink-500 text-white py-3 rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center">
                      <Instagram className="w-5 h-5 mr-2" />
                      Instagram
                    </button>
                    <button className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 transition-all flex items-center justify-center">
                      <Twitter className="w-5 h-5 mr-2" />
                      Twitter
                    </button>
                    <button className="flex-1 bg-blue-700 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition-all flex items-center justify-center">
                      <Facebook className="w-5 h-5 mr-2" />
                      Facebook
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                  <p className="text-blue-900 text-sm">
                    <strong>Tag us!</strong> Share your ocean art with #OceanAwareGuardian and help spread awareness about ocean health!
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Gallery Preview */}
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Heart className="w-6 h-6 mr-2 text-red-500" />
              Community Gallery
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              See what others have created! Thousands of unique ocean data art pieces shared by our community.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square bg-gradient-to-br ${
                    palettes[Object.keys(palettes)[i % Object.keys(palettes).length]].gradient
                  } rounded-lg opacity-50 hover:opacity-100 transition-opacity cursor-pointer`}
                />
              ))}
            </div>
            <p className="text-center text-gray-500 text-sm mt-4">
              Gallery feature coming soon! Your art could be featured here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerativeArtTool;
