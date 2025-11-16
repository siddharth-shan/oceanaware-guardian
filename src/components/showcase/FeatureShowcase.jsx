import React from 'react';
import { Brain, Users, Zap, Target, Activity, Waves, Palette, BookOpen, Music, Sparkles } from 'lucide-react';

const FeatureShowcase = ({ onNavigate }) => {
  const coreFeatures = [
    {
      id: 'ocean-story',
      title: 'Interactive Coastal Story',
      description: 'Scroll-driven narrative showing how climate change transforms coastlines from 2020 to 2100',
      icon: Waves,
      color: 'from-blue-500 to-cyan-500',
      tab: 'ocean-story',
      status: 'Interactive Story',
      cta: 'Experience the Journey'
    },
    {
      id: 'data-art',
      title: 'Ocean Data Art',
      description: 'Beautiful artistic visualizations of ocean health data - science meets beauty in three panels',
      icon: Palette,
      color: 'from-purple-500 to-pink-500',
      tab: 'data-art',
      status: 'Artistic Viz',
      cta: 'View Data Art'
    },
    {
      id: 'conservation-games',
      title: 'Conservation Games',
      description: 'Learn through play: Tsunami Escape, Rebuild the Coast, and Stop the Shrinking Beach',
      icon: Target,
      color: 'from-green-500 to-teal-500',
      tab: 'ocean-quests',
      status: '3 Games',
      cta: 'Play Games'
    },
    {
      id: 'ocean-curriculum',
      title: 'Ocean Curriculum',
      description: 'Free experiments, lesson plans, and digital storybook for teachers and students',
      icon: BookOpen,
      color: 'from-orange-500 to-red-500',
      tab: 'ocean-curriculum',
      status: 'NGSS-Aligned',
      cta: 'Explore Resources'
    },
    {
      id: 'data-sonification',
      title: 'Ocean Sounds',
      description: 'Hear ocean data as music - multi-sensory learning and accessibility for visually impaired',
      icon: Music,
      color: 'from-indigo-500 to-purple-500',
      tab: 'ocean-sounds',
      status: 'Audio Innovation',
      cta: 'Listen Now'
    },
    {
      id: 'art-generator',
      title: 'Art Generator',
      description: 'Create custom ocean data art - download and share your unique visualization',
      icon: Sparkles,
      color: 'from-pink-500 to-rose-500',
      tab: 'art-generator',
      status: 'User Creation',
      cta: 'Generate Art'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg border border-blue-200">
      <div className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Core Platform Features
          </h2>
          <p className="text-gray-600 text-sm">
            Interactive ocean conservation and coastal safety education tools
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coreFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.id}
                onClick={() => {
                  if (feature.subTab) {
                    onNavigate(feature.tab, feature.subTab);
                  } else {
                    onNavigate(feature.tab);
                  }
                }}
                className="group relative bg-white rounded-xl p-4 border border-gray-200 hover:border-transparent hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-left"
              >


                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`} />

                <div className="relative z-10">
                  {/* Icon and Title */}
                  <div className="flex items-start space-x-3 mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${feature.color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm leading-tight group-hover:text-gray-700">
                        {feature.title}
                      </h3>
                      <div className="flex items-center mt-1">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${feature.color} mr-2`} />
                        <p className="text-xs text-gray-500">
                          {feature.status}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">
                    {feature.description}
                  </p>

                  {/* Call to Action */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                      {feature.cta}
                    </span>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Access Note */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <h4 className="font-bold text-blue-800 text-sm">Quick Access</h4>
          </div>
          <p className="text-xs text-blue-700 leading-relaxed">
            Click any feature above to explore its capabilities. Each tool combines storytelling,
            science, and innovation to inspire ocean conservation action.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeatureShowcase;
