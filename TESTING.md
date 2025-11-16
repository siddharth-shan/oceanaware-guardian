# 🧪 OceanAware Guardian - Testing Guide

## Quick Start

### Start Development Environment

**Option 1: Using npm script (Recommended)**
```bash
npm run start:dev
```

**Option 2: Using shell script directly**
```bash
./start-dev.sh
```

**Option 3: Manual start (both servers)**
```bash
npm run dev:all
```

This will start:
- 📱 **Frontend (Vite)**: http://localhost:5173
- 🔧 **Backend (Express)**: http://localhost:3000

### Stop Development Servers

**Option 1: Using npm script**
```bash
npm run stop:dev
```

**Option 2: Using shell script directly**
```bash
./stop-dev.sh
```

**Option 3: Keyboard interrupt**
```bash
Press Ctrl+C in the terminal running the servers
```

---

## Testing Checklist

### ✅ Phase 1: Foundation Testing
- [ ] Application loads at http://localhost:5173
- [ ] No console errors on initial load
- [ ] Ocean-themed branding visible (OceanAware Guardian)
- [ ] Ocean blue color scheme (#0077B6)

### ✅ Phase 2: UI Transformation Testing
- [ ] Navigation tabs show ocean theme
- [ ] "Ocean Monitoring" tab (not "Fire Monitoring")
- [ ] "Ocean Education" tab (not "Safety Prep")
- [ ] Header gradient is ocean blue (not orange)
- [ ] All ocean colors rendering correctly

### ✅ Phase 3: Core Features Testing

#### 3.1 Ocean Hazard Monitoring
Navigate to: **Ocean Monitoring → Ocean Hazards**
- [ ] Dashboard loads without errors
- [ ] 5 hazard sections visible:
  - [ ] Tsunami Monitoring
  - [ ] Sea Level Rise
  - [ ] Coastal Erosion
  - [ ] Ocean Temperature
  - [ ] Marine Weather Alerts
- [ ] Mock data displays (if no API keys configured)
- [ ] Hazard levels color-coded (green/yellow/orange/red)
- [ ] Refresh button works
- [ ] Collapsible sections expand/collapse

#### 3.2 AI Ocean Health Analysis
Navigate to: **Ocean Monitoring → Health Analysis**
- [ ] Image upload functionality works
- [ ] Analysis types available:
  - [ ] Coral Health
  - [ ] Coastal Erosion
  - [ ] Ocean Pollution
  - [ ] Marine Debris
  - [ ] Algae Bloom
- [ ] Progress tracking displays
- [ ] Health scores calculated (0-10)
- [ ] Recommendations generated

#### 3.3 Ocean Education Quests
Navigate to: **Ocean Education**
- [ ] 6 quests display:
  - [ ] Ocean Champion: Beach Cleanup (50 pts)
  - [ ] Coral Guardian: Reef Protection (40 pts)
  - [ ] Plastic Warrior: Reduce Single-Use (35 pts)
  - [ ] Ocean Explorer: Marine Biodiversity (45 pts)
  - [ ] Climate Champion: Carbon Footprint (40 pts)
  - [ ] Ocean Artist: Creative Advocacy (30 pts)
- [ ] Quest details expand when clicked
- [ ] Subtasks show with checklists
- [ ] External resources link correctly
- [ ] Progress tracking works

#### 3.4 Data Visualization Studio
Navigate to: **Ocean Monitoring → (Create new viz section)**
- [ ] 4 chart types available:
  - [ ] Sea Level Rise Chart
  - [ ] Ocean Temperature Chart
  - [ ] Coastal Erosion Chart
  - [ ] Ocean Health Score Chart
- [ ] Chart selector tabs work
- [ ] Data visualizations render
- [ ] Color coding by severity
- [ ] Data sources attributed

#### 3.5 Conservation Action Engine
Navigate to: **Ocean Education → Conservation Actions**
- [ ] Actions display based on hazard data
- [ ] 4 categories filter:
  - [ ] All Actions
  - [ ] Immediate
  - [ ] Community
  - [ ] Lifestyle
  - [ ] Advocacy
- [ ] Action cards show:
  - [ ] Title and description
  - [ ] Priority level (high/medium/low)
  - [ ] Time estimate
  - [ ] Difficulty level
  - [ ] Impact points
  - [ ] Action steps
  - [ ] External resources
- [ ] Completion tracking works
- [ ] Progress bar updates
- [ ] Impact summary displays

---

## Common Issues & Solutions

### Issue: Ports already in use
**Error**: `EADDRINUSE: address already in use :::5173` or `:::3000`

**Solution**:
```bash
npm run stop:dev
# Wait 5 seconds
npm run start:dev
```

### Issue: node_modules missing
**Error**: `Cannot find module...`

**Solution**:
```bash
npm install
cd server && npm install
cd ..
npm run start:dev
```

### Issue: .env.local not configured
**Warning**: Mock data being used

**Solution**:
1. Copy `.env.example` to `.env.local`
2. Add your API keys for:
   - NOAA Tides & Currents
   - NASA Earthdata
   - USGS Coastal Change
   - HuggingFace
   - Firebase

### Issue: Vite not stopping
**Problem**: `npm run stop:dev` doesn't kill Vite

**Solution**:
```bash
# Manual kill
pkill -f vite
# Or find and kill by port
lsof -ti:5173 | xargs kill
```

---

## API Testing (Without API Keys)

The application includes mock data fallbacks for all features:

- **Ocean Hazards**: Displays sample tsunami, sea level, erosion data
- **AI Analysis**: Returns mock health scores and recommendations
- **Visualizations**: Shows example charts with historical trends

To test with **real data**, configure API keys in `.env.local`:
```bash
cp .env.example .env.local
# Edit .env.local and add your API keys
```

---

## E2E Testing with Playwright

Run end-to-end tests:
```bash
# All tests
npm run test:e2e

# UI mode (interactive)
npm run test:e2e:ui

# Headed mode (watch browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug
```

---

## Performance Testing

### Lighthouse Audit
1. Open http://localhost:5173 in Chrome
2. Open DevTools (F12)
3. Go to "Lighthouse" tab
4. Click "Analyze page load"
5. Check scores for:
   - Performance: Target 90+
   - Accessibility: Target 95+
   - Best Practices: Target 95+
   - SEO: Target 90+

### Network Performance
Check Network tab in DevTools:
- Initial page load should be < 3s
- API responses should be < 1s (with caching)
- Images should be optimized

---

## Browser Compatibility Testing

Test on:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (WebKit)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## Development Workflow

1. **Start servers**: `npm run start:dev`
2. **Make code changes**: Files auto-reload with HMR
3. **Check console**: No errors or warnings
4. **Test in browser**: Verify functionality
5. **Run linter**: `npm run lint`
6. **Run tests**: `npm run test`
7. **Stop servers**: `npm run stop:dev` or Ctrl+C
8. **Commit changes**: `git add . && git commit -m "..."`

---

## Quick Test Scenarios

### Scenario 1: New User First Visit
1. Open http://localhost:5173
2. Should see: Ocean-themed dashboard
3. Navigate to "Ocean Monitoring"
4. Should see: Hazard dashboard with data
5. Click through all tabs - verify no errors

### Scenario 2: Ocean Education Quest
1. Go to "Ocean Education"
2. Click "Ocean Champion: Beach Cleanup"
3. Expand subtasks
4. Mark subtask as complete
5. Verify progress updates

### Scenario 3: AI Health Analysis
1. Go to "Ocean Monitoring → Health Analysis"
2. Upload ocean image (or use sample)
3. Select analysis type: "Coral Health"
4. Click "Analyze"
5. Wait for results (mock data)
6. Verify health score and recommendations

### Scenario 4: Conservation Actions
1. Go to conservation actions section
2. Filter by category "Immediate"
3. Click action to expand
4. Mark as complete
5. Verify progress bar updates

---

## Next Steps

After testing Phase 3 features:
- ✅ Verify all features work
- ✅ Check for console errors
- ✅ Test on mobile viewport
- ✅ Run linter and tests
- 🚀 Proceed to Phase 4: Community Features

---

**Last Updated**: November 16, 2025
**Version**: 1.0.0 (Phase 3 Complete)
