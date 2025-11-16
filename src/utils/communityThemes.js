/**
 * Community Hub Theme System
 * Provides distinct color schemes for different categories to improve visual hierarchy
 */

export const communityThemes = {
  // Emergency Category - Red/Orange for urgent attention
  emergency: {
    primary: {
      bg: 'bg-red-50',
      border: 'border-red-200', 
      text: 'text-red-800',
      accent: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 text-white',
      icon: 'text-red-600'
    },
    secondary: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800', 
      accent: 'text-orange-600',
      button: 'bg-orange-600 hover:bg-orange-700 text-white',
      icon: 'text-orange-600'
    },
    gradient: 'bg-gradient-to-r from-red-500 to-red-600',
    shadow: 'shadow-red-100',
    ring: 'ring-red-500'
  },

  // Status Updates - Green/Yellow/Orange progression
  status: {
    safe: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      accent: 'text-green-600', 
      button: 'bg-green-600 hover:bg-green-700 text-white',
      icon: 'text-green-600'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      accent: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      icon: 'text-yellow-600'
    },
    evacuating: {
      bg: 'bg-orange-50', 
      border: 'border-orange-200',
      text: 'text-orange-800',
      accent: 'text-orange-600',
      button: 'bg-orange-600 hover:bg-orange-700 text-white',
      icon: 'text-orange-600'
    },
    gradient: 'bg-gradient-to-r from-green-500 to-blue-500',
    shadow: 'shadow-green-100',
    ring: 'ring-green-500'
  },

  // Community Coordination - Blue for collaborative features
  community: {
    primary: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      accent: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      icon: 'text-blue-600'
    },
    secondary: {
      bg: 'bg-cyan-50',
      border: 'border-cyan-200', 
      text: 'text-cyan-800',
      accent: 'text-cyan-600',
      button: 'bg-cyan-600 hover:bg-cyan-700 text-white',
      icon: 'text-cyan-600'
    },
    tertiary: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-800',
      accent: 'text-indigo-600', 
      button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      icon: 'text-indigo-600'
    },
    gradient: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    shadow: 'shadow-blue-100',
    ring: 'ring-blue-500'
  },

  // Reporting System - Purple for information sharing
  reporting: {
    primary: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-800',
      accent: 'text-purple-600',
      button: 'bg-purple-600 hover:bg-purple-700 text-white',
      icon: 'text-purple-600'
    },
    secondary: {
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      text: 'text-violet-800', 
      accent: 'text-violet-600',
      button: 'bg-violet-600 hover:bg-violet-700 text-white',
      icon: 'text-violet-600'
    },
    gradient: 'bg-gradient-to-r from-purple-500 to-violet-500',
    shadow: 'shadow-purple-100',
    ring: 'ring-purple-500'
  },

  // Neutral Elements - Gray for secondary content
  neutral: {
    primary: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-800',
      accent: 'text-gray-600',
      button: 'bg-gray-600 hover:bg-gray-700 text-white',
      icon: 'text-gray-600'
    },
    secondary: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-800',
      accent: 'text-slate-600',
      button: 'bg-slate-600 hover:bg-slate-700 text-white', 
      icon: 'text-slate-600'
    },
    gradient: 'bg-gradient-to-r from-gray-500 to-slate-500',
    shadow: 'shadow-gray-100',
    ring: 'ring-gray-500'
  }
};

// Helper function to get theme by category
export const getThemeByCategory = (category, variant = 'primary') => {
  const themeMap = {
    'emergency': communityThemes.emergency.primary,
    'status': communityThemes.status.safe,
    'community': communityThemes.community.primary,
    'reporting': communityThemes.reporting.primary,
    'neutral': communityThemes.neutral.primary
  };
  
  return themeMap[category] || communityThemes.neutral.primary;
};

// Helper function to get specific status theme
export const getStatusTheme = (status) => {
  const statusThemeMap = {
    'safe': communityThemes.status.safe,
    'evacuating': communityThemes.status.evacuating,
    'need-help': communityThemes.emergency.primary,
    'community-emergency': communityThemes.emergency.secondary,
    'neighborhood-coordinated': communityThemes.community.primary,
    'resources-available': communityThemes.community.secondary
  };
  
  return statusThemeMap[status] || communityThemes.neutral.primary;
};