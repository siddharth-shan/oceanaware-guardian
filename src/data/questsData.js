export const safetyQuests = [
  {
    id: 1,
    title: 'Create Defensible Space',
    description: 'Clear 30 feet around your home',
    points: 25,
    category: 'preparation',
    estimatedTime: '2-4 hours',
    difficulty: 'Medium',
    resources: {
      overview: 'Defensible space is the buffer you create between a building and the grass, trees, shrubs, or any wildland area that surrounds it. This space is needed to slow or stop the spread of wildfire and it protects your home from catching fire.',
      subtasks: [
        {
          id: 'ds-1',
          title: 'Zone 1 Clearance (0-30 feet)',
          description: 'Create immediate safety zone around structures',
          checklist: [
            'Remove all dead plants, grass, and weeds (0-5 feet)',
            'Remove tree branches within 10 feet of chimney',
            'Keep lawn watered and cut to maximum 4 inches',
            'Remove flammable items from under decks/stairs',
            'Clear gutters and roof of debris',
            'Trim tree branches 10+ feet from roof',
            'Create 5-foot non-combustible zone around structure'
          ]
        },
        {
          id: 'ds-2', 
          title: 'Zone 2 Management (30-100 feet)',
          description: 'Reduce fire intensity and spread',
          checklist: [
            'Create horizontal spacing between shrub clusters',
            'Maintain vertical spacing between vegetation layers',
            'Remove ladder fuels (vegetation connecting ground to trees)',
            'Thin tree density to reduce crown fire risk',
            'Create fuel breaks with roads/driveways',
            'Remove dead wood and debris'
          ]
        },
        {
          id: 'ds-3',
          title: 'Fire-Resistant Landscaping',
          description: 'Install and maintain fire-safe plants',
          checklist: [
            'Research fire-resistant plants for your region',
            'Install drought-tolerant, low-resin plants',
            'Create defensible plant groupings',
            'Install gravel or stone mulch (avoid bark)',
            'Install drip irrigation systems',
            'Maintain green lawn areas as fire breaks'
          ]
        }
      ],
      resources: [
        { 
          type: 'guide', 
          title: 'CAL FIRE Defensible Space Guide', 
          url: 'https://www.fire.ca.gov/dspace',
          description: 'Official CAL FIRE defensible space requirements and guidelines'
        },
        { 
          type: 'guide', 
          title: 'Ready for Wildfire Defensible Space', 
          url: 'https://readyforwildfire.org/prepare-for-wildfire/defensible-space/',
          description: 'Comprehensive CAL FIRE defensible space guide with zones and requirements'
        },
        { 
          type: 'guide', 
          title: 'UC ANR Fire Network Resources', 
          url: 'https://ucanr.edu/sites/fire/',
          description: 'UC Agriculture and Natural Resources fire science and landscaping resources'
        },
        {
          type: 'guide',
          title: 'NFPA Firewise USA Program',
          url: 'https://www.nfpa.org/education-and-research/wildfire/firewise-usa',
          description: 'NFPA Firewise landscaping and community wildfire protection recommendations'
        }
      ],
      tips: [
        'Start closest to your home and work outward',
        'Focus on removing dead and dying vegetation first',
        'Consider hiring a certified arborist for large tree work',
        'Check with local fire department for specific requirements'
      ]
    }
  },
  {
    id: 2,
    title: 'Build Emergency Kit',
    description: 'Pack 72-hour survival kit',
    points: 30,
    category: 'preparation',
    estimatedTime: '1-2 hours',
    difficulty: 'Easy',
    resources: {
      overview: 'An emergency kit should sustain you and your family for at least 72 hours during evacuation or when emergency services are unavailable.',
      subtasks: [
        {
          id: 'ek-1',
          title: 'Water & Food Supplies',
          description: 'Essential sustenance for 72+ hours',
          checklist: [
            'Water: 1 gallon per person per day for 3 days minimum',
            'Water purification tablets or portable filter',
            'Non-perishable food for 3+ days (canned goods, energy bars)',
            'Manual can opener and eating utensils',
            'Pet food and water (if applicable)',
            'Baby formula and diapers (if applicable)',
            'Comfort foods and snacks for stress relief'
          ]
        },
        {
          id: 'ek-2',
          title: 'Communication & Safety Tools',
          description: 'Stay informed and signal for help',
          checklist: [
            'Battery-powered or hand crank radio (NOAA Weather Radio)',
            'Flashlight with extra batteries',
            'Cell phone with chargers and backup battery',
            'Whistle for signaling help',
            'Matches in waterproof container',
            'Emergency contact list (laminated)',
            'Local maps and evacuation route information'
          ]
        },
        {
          id: 'ek-3',
          title: 'Medical & Personal Care',
          description: 'Health and hygiene essentials',
          checklist: [
            'First aid kit with bandages, antiseptic, pain relievers',
            '7-day supply of prescription medications',
            'Glasses/contact lenses and cleaning solution',
            'Personal hygiene items (soap, toothbrush, feminine supplies)',
            'Sanitation supplies (hand sanitizer, wet wipes)',
            'Medical devices (inhaler, glucose meter)',
            'List of medical conditions and allergies'
          ]
        },
        {
          id: 'ek-4',
          title: 'Important Documents & Money',
          description: 'Critical paperwork and financial resources',
          checklist: [
            'Copies of IDs, insurance policies, bank records',
            'Important family documents (birth certificates, passports)',
            'Cash in small bills and coins',
            'Credit cards and traveler\'s checks',
            'Emergency contact information',
            'Store documents in waterproof container',
            'Keep digital copies on encrypted flash drive'
          ]
        },
        {
          id: 'ek-5',
          title: 'Tools & Supplies',
          description: 'Practical items for emergency situations',
          checklist: [
            'Multi-tool or Swiss Army knife',
            'Duct tape and plastic sheeting',
            'Work gloves and safety goggles',
            'Blankets and sleeping bags',
            'Change of clothing and sturdy shoes',
            'Rain gear and warm clothing',
            'Plastic bags for waste and protection'
          ]
        }
      ],
      resources: [
        { 
          type: 'checklist', 
          title: 'Ready.gov Emergency Kit Checklist', 
          url: 'https://www.ready.gov/kit',
          description: 'Comprehensive emergency kit checklist from FEMA'
        },
        { 
          type: 'app', 
          title: 'FEMA Emergency App', 
          url: 'https://www.fema.gov/about/news-multimedia/mobile-products',
          description: 'Free FEMA app with emergency alerts and safety tips - download from App Store or Google Play'
        },
        { 
          type: 'guide', 
          title: 'Pet Emergency Kit Guide', 
          url: 'https://www.ready.gov/pets',
          description: 'Special considerations for pets during emergencies'
        }
      ],
      tips: [
        'Store kit in easy-to-carry containers',
        'Replace water and food every 6 months',
        'Include cash in small bills',
        'Store copies of important documents in waterproof container'
      ]
    }
  },
  {
    id: 3,
    title: 'Family Evacuation Plan',
    description: 'Plan routes and meeting points',
    points: 20,
    category: 'planning',
    estimatedTime: '30-60 minutes',
    difficulty: 'Easy',
    resources: {
      overview: 'A well-practiced evacuation plan can save precious time and lives during a wildfire emergency.',
      steps: [
        'Identify multiple evacuation routes from your neighborhood',
        'Choose meeting locations both near and far from your home',
        'Assign responsibilities to each family member',
        'Practice the plan regularly, especially with children',
        'Keep important documents easily accessible',
        'Plan for pets and livestock evacuation'
      ],
      resources: [
        { 
          type: 'template', 
          title: 'Family Emergency Plan Template', 
          url: 'https://www.ready.gov/plan',
          description: 'FEMA family emergency plan template'
        },
        { 
          type: 'guide', 
          title: 'CAL FIRE GO! Evacuation Guide', 
          url: 'https://readyforwildfire.org/prepare-for-wildfire/go-evacuation-guide/',
          description: 'Essential guide for wildfire evacuation safety and planning'
        },
        {
          type: 'guide',
          title: 'Wildfire Action Plan Guide',
          url: 'https://readyforwildfire.org/prepare-for-wildfire/wildfire-action-plan/',
          description: 'CAL FIRE comprehensive wildfire action plan and evacuation preparation'
        }
      ],
      tips: [
        'Practice evacuation routes during different times of day',
        'Keep vehicle fuel tanks at least half full',
        'Know your address and nearest cross streets',
        'Plan for family members who may be at work or school'
      ]
    }
  },
  {
    id: 4,
    title: 'Sign Up for Alerts',
    description: 'Register for local emergency alerts',
    points: 15,
    category: 'technology',
    estimatedTime: '15-30 minutes',
    difficulty: 'Easy',
    resources: {
      overview: 'Emergency alert systems provide critical, real-time information during wildfire events.',
      steps: [
        'Register for your county\'s emergency notification system',
        'Sign up for Wireless Emergency Alerts (WEA) on your phone',
        'Download official emergency apps (FEMA, Red Cross)',
        'Follow local fire department and emergency services on social media',
        'Register for utility company outage and safety alerts'
      ],
      resources: [
        { 
          type: 'link', 
          title: 'Find Your County Alert System', 
          url: 'https://www.fema.gov/emergency-managers/practitioners/integrated-public-alert-warning-system',
          description: 'Directory of local emergency alert systems'
        },
        { 
          type: 'app', 
          title: 'Wireless Emergency Alerts Info', 
          url: 'https://www.fcc.gov/consumers/guides/wireless-emergency-alerts-wea',
          description: 'How to enable emergency alerts on your phone'
        },
        {
          type: 'tool',
          title: 'Alert Registration Helper',
          url: 'https://www.ready.gov/alerts',
          description: 'FEMA guide to emergency alert systems'
        }
      ],
      tips: [
        'Test alerts regularly to ensure they work',
        'Keep phone charged and have backup power sources',
        'Don\'t rely on just one alert system',
        'Share alert information with neighbors'
      ]
    }
  },
  {
    id: 5,
    title: 'Vegetation Assessment',
    description: 'Document fire hazards around property',
    points: 25,
    category: 'assessment',
    estimatedTime: '45-90 minutes',
    difficulty: 'Medium',
    resources: {
      overview: 'Regular vegetation assessment helps identify and mitigate fire risks before they become dangerous.',
      steps: [
        'Walk around your entire property perimeter',
        'Take photos of potential fire hazards',
        'Document dead or dying vegetation',
        'Note vegetation proximity to structures',
        'Create a prioritized maintenance schedule'
      ],
      resources: [
        { 
          type: 'checklist', 
          title: 'Property Assessment Checklist', 
          url: 'https://www.fire.ca.gov/programs/communications/defensible-space/',
          description: 'CAL FIRE property assessment guidelines'
        },
        { 
          type: 'guide', 
          title: 'UC Fire-Smart Landscaping Guide', 
          url: 'https://ucanr.edu/site/uc-marin-master-gardeners/plan-your-fire-smart-landscape',
          description: 'UC Cooperative Extension fire-smart landscape planning guide'
        },
        {
          type: 'app',
          title: 'iNaturalist Plant ID',
          url: 'https://www.inaturalist.org/',
          description: 'Free app to identify plants and their fire risk'
        }
      ],
      tips: [
        'Assess property monthly during fire season',
        'Focus on areas closest to structures first',
        'Document with photos for insurance purposes',
        'Consider hiring certified landscape professionals'
      ]
    }
  },
  {
    id: 6,
    title: 'Community Report',
    description: 'Report a potential fire hazard',
    points: 35,
    category: 'community',
    estimatedTime: '10-20 minutes',
    difficulty: 'Easy',
    resources: {
      overview: 'Community reporting creates a network of wildfire watchers, increasing early detection capabilities.',
      steps: [
        'Learn to identify common fire hazards in your area',
        'Take clear, detailed photos of hazards',
        'Note exact location with GPS coordinates or address',
        'Report through proper local channels',
        'Follow up on reports when appropriate'
      ],
      resources: [
        { 
          type: 'hotline', 
          title: 'CAL FIRE Tip Line', 
          url: 'tel:1-800-468-4408',
          description: 'Report fire hazards to CAL FIRE: 1-800-468-4408'
        },
        { 
          type: 'guide', 
          title: 'Ready for Wildfire Preparation Guide', 
          url: 'https://readyforwildfire.org/prepare-for-wildfire/',
          description: 'CAL FIRE comprehensive wildfire preparation and safety guide'
        },
        {
          type: 'map',
          title: 'CAL FIRE Incident Information',
          url: 'https://www.fire.ca.gov/incidents/',
          description: 'Current California fire incident map and reporting system'
        }
      ],
      tips: [
        'Report hazards immediately - don\'t wait',
        'Include as much detail as possible in reports',
        'Take photos from multiple angles',
        'Coordinate with neighbors for comprehensive reporting'
      ]
    }
  }
];

export const getQuestByCategory = (category) => {
  return safetyQuests.filter(quest => quest.category === category);
};

export const getQuestById = (id) => {
  return safetyQuests.find(quest => quest.id === id);
};

export const getTotalPoints = () => {
  return safetyQuests.reduce((total, quest) => total + quest.points, 0);
};

export const getCompletionPercentage = (completedQuests) => {
  return Math.round((completedQuests.length / safetyQuests.length) * 100);
};

export const getQuestProgress = (completedQuests) => {
  const totalQuests = safetyQuests.length;
  const completedCount = completedQuests.length;
  const totalPoints = getTotalPoints();
  const earnedPoints = safetyQuests
    .filter(quest => completedQuests.includes(quest.id))
    .reduce((total, quest) => total + quest.points, 0);

  return {
    totalQuests,
    completedCount,
    totalPoints,
    earnedPoints,
    completionPercentage: getCompletionPercentage(completedQuests)
  };
};