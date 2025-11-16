/**
 * Ocean Education Quests
 *
 * Interactive ocean conservation and education quests
 * Aligned with Bow Seat Ocean Awareness Contest 2026 themes:
 * - Sustains: How the ocean sustains life
 * - Protects: How the ocean protects us
 * - Inspires: How the ocean inspires us
 *
 * Created for Ocean Awareness Contest 2026
 */

export const oceanQuests = [
  {
    id: 1,
    title: 'Ocean Champion: Beach Cleanup',
    description: 'Organize and participate in a beach cleanup event',
    points: 50,
    category: 'protects',
    estimatedTime: '2-4 hours',
    difficulty: 'Easy',
    icon: '🏖️',
    resources: {
      overview: 'Beach cleanups are one of the most direct ways to protect ocean health. Marine debris harms wildlife, pollutes ecosystems, and impacts coastal communities. Every piece of trash removed makes a difference.',
      subtasks: [
        {
          id: 'bc-1',
          title: 'Plan Your Cleanup',
          description: 'Organize a successful beach cleanup event',
          checklist: [
            'Choose a beach location and get necessary permits',
            'Set a date and duration (2-4 hours recommended)',
            'Gather supplies: gloves, bags, buckets, hand sanitizer',
            'Create sign-up sheet for volunteers',
            'Plan for waste disposal and recycling',
            'Prepare safety briefing and instructions'
          ]
        },
        {
          id: 'bc-2',
          title: 'Execute the Cleanup',
          description: 'Lead an effective cleanup operation',
          checklist: [
            'Conduct safety briefing for all participants',
            'Distribute gloves, bags, and collection zones',
            'Separate recyclables from general waste',
            'Document before/after photos',
            'Track types and quantities of debris collected',
            'Properly dispose of all collected materials'
          ]
        },
        {
          id: 'bc-3',
          title: 'Report and Share Impact',
          description: 'Document and share your conservation impact',
          checklist: [
            'Count and categorize items collected',
            'Submit data to Ocean Conservancy or similar org',
            'Share results on social media with #OceanCleanup',
            'Thank volunteers and share impact metrics',
            'Plan next cleanup event',
            'Submit report through OceanAware Guardian app'
          ]
        }
      ],
      resources: [
        {
          type: 'guide',
          title: 'Ocean Conservancy Cleanup Guide',
          url: 'https://oceanconservancy.org/trash-free-seas/international-coastal-cleanup/',
          description: 'Official International Coastal Cleanup resources and data collection'
        },
        {
          type: 'guide',
          title: 'Surfrider Foundation Beach Cleanup Guide',
          url: 'https://www.surfrider.org/programs/ocean-friendly-gardens',
          description: 'Best practices for organizing effective beach cleanups'
        }
      ],
      tips: [
        'Mornings are best to avoid heat and find more debris',
        'Focus on microplastics - they harm marine life most',
        'Wear sun protection and bring water',
        'Never touch medical waste or hazardous materials',
        'Make it fun - bring music and snacks for volunteers'
      ],
      impact: {
        description: 'Beach cleanups directly protect marine ecosystems',
        metrics: ['Debris removed', 'Wildlife protected', 'Volunteers engaged']
      }
    }
  },
  {
    id: 2,
    title: 'Coral Guardian: Reef Protection',
    description: 'Learn about and support coral reef conservation',
    points: 40,
    category: 'sustains',
    estimatedTime: '2-3 hours',
    difficulty: 'Medium',
    icon: '🪸',
    resources: {
      overview: 'Coral reefs are among Earth\'s most biodiverse ecosystems, supporting 25% of marine life while covering less than 1% of the ocean floor. Climate change and pollution threaten their survival.',
      subtasks: [
        {
          id: 'cr-1',
          title: 'Learn About Coral Ecosystems',
          description: 'Understand coral reef ecology and importance',
          checklist: [
            'Watch "Chasing Coral" documentary',
            'Learn about coral bleaching and causes',
            'Identify 5 coral reef fish species',
            'Understand symbiotic relationships in reefs',
            'Learn about coral restoration techniques',
            'Complete OceanAware Guardian coral quiz'
          ]
        },
        {
          id: 'cr-2',
          title: 'Take Action for Reefs',
          description: 'Implement reef-friendly practices',
          checklist: [
            'Use reef-safe sunscreen (no oxybenzone)',
            'Reduce carbon footprint (coral enemy #1)',
            'Don\'t touch or stand on coral when snorkeling',
            'Support sustainable seafood choices',
            'Donate to coral restoration organizations',
            'Avoid purchasing coral souvenirs'
          ]
        },
        {
          id: 'cr-3',
          title: 'Spread Awareness',
          description: 'Educate others about reef conservation',
          checklist: [
            'Create social media post about coral importance',
            'Share reef-safe sunscreen information',
            'Organize school presentation on reefs',
            'Write letter to representatives about climate action',
            'Join virtual reef monitoring program',
            'Share learnings through OceanAware Guardian'
          ]
        }
      ],
      resources: [
        {
          type: 'documentary',
          title: 'Chasing Coral (Netflix)',
          url: 'https://www.chasingcoral.com/',
          description: 'Award-winning documentary about coral bleaching'
        },
        {
          type: 'guide',
          title: 'NOAA Coral Reef Conservation',
          url: 'https://coralreef.noaa.gov/',
          description: 'Science-based coral reef information and conservation programs'
        },
        {
          type: 'action',
          title: 'Coral Restoration Foundation',
          url: 'https://www.coralrestoration.org/',
          description: 'Support hands-on coral restoration efforts'
        }
      ],
      tips: [
        'Ocean acidification is making it harder for corals to build skeletons',
        'Rising temperatures cause corals to expel their symbiotic algae',
        'Reefs protect coastlines from storm surge and erosion',
        '50% of coral reefs have been lost since 1980s',
        'You can "adopt" a coral through restoration programs'
      ],
      impact: {
        description: 'Protecting reefs sustains ocean biodiversity',
        metrics: ['Reef-safe products used', 'Education reach', 'Carbon reduced']
      }
    }
  },
  {
    id: 3,
    title: 'Plastic Warrior: Reduce Single-Use',
    description: 'Eliminate single-use plastics from daily life',
    points: 35,
    category: 'protects',
    estimatedTime: '1 week challenge',
    difficulty: 'Medium',
    icon: '♻️',
    resources: {
      overview: '8 million tons of plastic enter our oceans every year. Single-use plastics account for 40% of all plastic produced. Small changes in daily habits create massive ocean impact.',
      subtasks: [
        {
          id: 'pw-1',
          title: 'Audit Your Plastic Use',
          description: 'Track one week of plastic consumption',
          checklist: [
            'Record all single-use plastics used for 1 week',
            'Categorize: bottles, bags, straws, packaging, etc.',
            'Identify top 3 plastic sources',
            'Calculate estimated annual plastic waste',
            'Take photos of plastic waste accumulated',
            'Submit audit through OceanAware Guardian'
          ]
        },
        {
          id: 'pw-2',
          title: 'Make the Switch',
          description: 'Replace single-use with reusables',
          checklist: [
            'Get reusable water bottle and use daily',
            'Carry reusable shopping bags',
            'Use metal/glass straws or skip straws',
            'Choose products in glass/paper packaging',
            'Pack lunch in reusable containers',
            'Buy from bulk bins with reusable bags'
          ]
        },
        {
          id: 'pw-3',
          title: 'Inspire Others',
          description: 'Spread the plastic-free movement',
          checklist: [
            'Share before/after plastic reduction photos',
            'Challenge friends to plastic-free week',
            'Ask local businesses to reduce plastic',
            'Create "Plastic-Free Tips" infographic',
            'Calculate plastic saved annually',
            'Join Plastic Free July movement'
          ]
        }
      ],
      resources: [
        {
          type: 'guide',
          title: 'Plastic Pollution Coalition',
          url: 'https://www.plasticpollutioncoalition.org/',
          description: 'Resources and campaigns to end plastic pollution'
        },
        {
          type: 'challenge',
          title: 'Plastic Free July',
          url: 'https://www.plasticfreejuly.org/',
          description: 'Global movement to reduce plastic waste'
        },
        {
          type: 'app',
          title: 'Beat the Microbead App',
          url: 'https://www.beatthemicrobead.org/',
          description: 'Scan products for microplastics'
        }
      ],
      tips: [
        'Start small - swap one item per week',
        'Microplastics in beauty products wash into oceans',
        'Plastic bags can be mistaken for jellyfish by turtles',
        'It takes 450 years for plastic bottle to decompose',
        'Reusable items save money in the long run'
      ],
      impact: {
        description: 'Reducing plastic protects marine life',
        metrics: ['Plastic items eliminated', 'Waste prevented (lbs)', 'People inspired']
      }
    }
  },
  {
    id: 4,
    title: 'Ocean Explorer: Marine Biodiversity',
    description: 'Discover and document local marine species',
    points: 45,
    category: 'inspires',
    estimatedTime: '3-5 hours',
    difficulty: 'Medium',
    icon: '🐠',
    resources: {
      overview: 'Scientists estimate 91% of ocean species remain undiscovered. Citizen science helps document biodiversity and track ecosystem health. Every observation contributes to scientific understanding.',
      subtasks: [
        {
          id: 'oe-1',
          title: 'Prepare for Marine Observation',
          description: 'Learn identification and documentation',
          checklist: [
            'Download iNaturalist or similar app',
            'Study common local marine species',
            'Learn proper wildlife observation ethics',
            'Gather camera, field guide, notebook',
            'Identify safe observation locations',
            'Plan visit during low tide if coastal'
          ]
        },
        {
          id: 'oe-2',
          title: 'Conduct Field Observations',
          description: 'Document marine biodiversity',
          checklist: [
            'Visit beach, tide pool, or coastal area',
            'Photograph species found (don\'t disturb!)',
            'Note location, time, and conditions',
            'Record at least 10 different species',
            'Observe behavior and interactions',
            'Never remove animals from habitat'
          ]
        },
        {
          id: 'oe-3',
          title: 'Share Scientific Data',
          description: 'Contribute to citizen science',
          checklist: [
            'Upload observations to iNaturalist',
            'Get species identifications from community',
            'Submit data to appropriate databases',
            'Create species diversity report',
            'Share favorite discoveries on social media',
            'Plan return visit to monitor changes'
          ]
        }
      ],
      resources: [
        {
          type: 'app',
          title: 'iNaturalist',
          url: 'https://www.inaturalist.org/',
          description: 'Global platform for recording and identifying species'
        },
        {
          type: 'guide',
          title: 'Marine Species Identification',
          url: 'https://www.fishbase.org/',
          description: 'Comprehensive fish and marine species database'
        },
        {
          type: 'guide',
          title: 'REEF Fish Survey Project',
          url: 'https://www.reef.org/',
          description: 'Volunteer fish survey and data collection program'
        }
      ],
      tips: [
        'Early morning low tides reveal most tide pool life',
        'Look under rocks but always return them gently',
        'Zoom lens helps photograph without disturbing',
        'Learn scientific names - they\'re universal',
        'Each ecosystem has indicator species showing health'
      ],
      impact: {
        description: 'Biodiversity monitoring inspires conservation',
        metrics: ['Species documented', 'Citizen science contributions', 'Education hours']
      }
    }
  },
  {
    id: 5,
    title: 'Climate Champion: Carbon Footprint',
    description: 'Reduce personal carbon footprint to protect oceans',
    points: 40,
    category: 'protects',
    estimatedTime: '1 month challenge',
    difficulty: 'Hard',
    icon: '🌍',
    resources: {
      overview: 'The ocean absorbs 30% of CO2 emissions, causing acidification that harms marine life. Reducing your carbon footprint directly protects ocean chemistry and prevents coral bleaching.',
      subtasks: [
        {
          id: 'cc-1',
          title: 'Calculate Carbon Footprint',
          description: 'Measure your climate impact',
          checklist: [
            'Use EPA carbon calculator',
            'Track transportation emissions (car, plane, bus)',
            'Calculate home energy usage',
            'Assess food and consumption patterns',
            'Identify top 3 emission sources',
            'Set reduction goals (target: 20% decrease)'
          ]
        },
        {
          id: 'cc-2',
          title: 'Implement Reductions',
          description: 'Take climate action for one month',
          checklist: [
            'Reduce meat consumption (try Meatless Mondays)',
            'Switch to renewable energy if possible',
            'Use public transit/bike/walk instead of driving',
            'Unplug electronics when not in use',
            'Buy local and seasonal foods',
            'Avoid fast fashion purchases'
          ]
        },
        {
          id: 'cc-3',
          title: 'Amplify Impact',
          description: 'Multiply your climate action',
          checklist: [
            'Recalculate carbon footprint after 1 month',
            'Share reduction strategies with family',
            'Contact representatives about climate policy',
            'Support renewable energy initiatives',
            'Join climate action group',
            'Plan long-term sustainability changes'
          ]
        }
      ],
      resources: [
        {
          type: 'calculator',
          title: 'EPA Carbon Footprint Calculator',
          url: 'https://www.epa.gov/carbon-footprint-calculator',
          description: 'Calculate your household carbon emissions'
        },
        {
          type: 'guide',
          title: 'Project Drawdown Solutions',
          url: 'https://drawdown.org/',
          description: 'Science-based climate solutions ranking'
        },
        {
          type: 'action',
          title: 'Citizens\' Climate Lobby',
          url: 'https://citizensclimatelobby.org/',
          description: 'Advocate for climate policy'
        }
      ],
      tips: [
        'Food production creates 26% of global emissions',
        'One transatlantic flight = 1.6 tons of CO2',
        'Ocean acidification has increased 30% since pre-industrial',
        'Renewable energy is now cheaper than fossil fuels',
        'Individual action + policy change = maximum impact'
      ],
      impact: {
        description: 'Climate action protects ocean chemistry',
        metrics: ['CO2 reduced (tons)', 'Policy actions', 'Lifestyle changes']
      }
    }
  },
  {
    id: 6,
    title: 'Ocean Artist: Creative Advocacy',
    description: 'Create ocean-inspired art to raise awareness',
    points: 30,
    category: 'inspires',
    estimatedTime: '4-8 hours',
    difficulty: 'Easy',
    icon: '🎨',
    resources: {
      overview: 'Art inspires emotional connections to the ocean that facts alone cannot achieve. Creative expression amplifies conservation messages and engages diverse audiences in ocean protection.',
      subtasks: [
        {
          id: 'oa-1',
          title: 'Create Ocean Art',
          description: 'Express ocean connection through creativity',
          checklist: [
            'Choose medium: painting, photography, poetry, music, etc.',
            'Select ocean theme: beauty, threats, hope, action',
            'Research issue or species for authenticity',
            'Create original piece (any skill level welcome)',
            'Include conservation message or call-to-action',
            'Document creative process'
          ]
        },
        {
          id: 'oa-2',
          title: 'Share Your Voice',
          description: 'Amplify ocean advocacy through art',
          checklist: [
            'Post artwork on social media with ocean hashtags',
            'Write artist statement about your message',
            'Submit to Bow Seat Ocean Awareness Contest',
            'Share in school art show or community space',
            'Create prints/copies to spread message',
            'Engage with comments and questions'
          ]
        },
        {
          id: 'oa-3',
          title: 'Inspire Action',
          description: 'Convert inspiration to conservation',
          checklist: [
            'Include actionable steps with art',
            'Link to ocean conservation organizations',
            'Track engagement metrics',
            'Collaborate with other ocean artists',
            'Plan ocean art exhibition or gallery',
            'Donate proceeds to ocean conservation'
          ]
        }
      ],
      resources: [
        {
          type: 'contest',
          title: 'Bow Seat Ocean Awareness Contest',
          url: 'https://bowseat.org/programs/ocean-awareness-contest/',
          description: 'Annual youth ocean art and advocacy competition'
        },
        {
          type: 'inspiration',
          title: 'Ocean Conservancy Art Gallery',
          url: 'https://oceanconservancy.org/',
          description: 'Examples of ocean conservation art'
        },
        {
          type: 'guide',
          title: 'Creative Climate Communication',
          url: 'https://www.climateoutreach.org/',
          description: 'Research on effective visual climate messaging'
        }
      ],
      tips: [
        'Personal stories resonate more than statistics',
        'Balance beauty with urgency',
        'Include solutions alongside problems',
        'Collaborate across art forms for greater impact',
        'Art can reach audiences science cannot'
      ],
      impact: {
        description: 'Art inspires ocean connection and action',
        metrics: ['Artwork created', 'People reached', 'Actions inspired']
      }
    }
  }
];

// Quest categories for filtering
export const QUEST_CATEGORIES = {
  SUSTAINS: 'sustains',
  PROTECTS: 'protects',
  INSPIRES: 'inspires',
  ALL: 'all'
};

// Difficulty levels
export const DIFFICULTY_LEVELS = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard'
};

/**
 * Get quests by category
 */
export function getQuestsByCategory(category) {
  if (category === QUEST_CATEGORIES.ALL) {
    return oceanQuests;
  }
  return oceanQuests.filter(quest => quest.category === category);
}

/**
 * Get quest by ID
 */
export function getQuestById(id) {
  return oceanQuests.find(quest => quest.id === id);
}

/**
 * Calculate total available points
 */
export function getTotalAvailablePoints() {
  return oceanQuests.reduce((sum, quest) => sum + quest.points, 0);
}

/**
 * Get quest progress statistics
 */
export function getQuestStats(completedQuests = []) {
  const total = oceanQuests.length;
  const completed = completedQuests.length;
  const remaining = total - completed;
  const points Earned = completedQuests.reduce((sum, questId) => {
    const quest = getQuestById(questId);
    return sum + (quest?.points || 0);
  }, 0);
  const totalPoints = getTotalAvailablePoints();

  return {
    total,
    completed,
    remaining,
    pointsEarned,
    totalPoints,
    percentComplete: total > 0 ? Math.round((completed / total) * 100) : 0,
    pointsPercent: totalPoints > 0 ? Math.round((pointsEarned / totalPoints) * 100) : 0
  };
}
