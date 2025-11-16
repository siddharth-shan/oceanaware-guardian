# 🌊 OceanAware Guardian

> AI-Powered Ocean Hazard Monitoring & Conservation Education Platform for Bow Seat Ocean Awareness Contest 2026

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Bow Seat Ocean Awareness Contest](https://img.shields.io/badge/Bow%20Seat-2026%20Contest-ocean.svg)](https://bowseat.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-purple.svg)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

## 🌟 Overview

**OceanAware Guardian** is an interactive ocean conservation platform created for the 2026 Bow Seat Ocean Awareness Contest. Built on the foundation of EcoQuest's Congressional App Challenge-winning wildfire safety app, this platform transforms cutting-edge emergency response technology into a powerful tool for ocean education and conservation advocacy.

### 🎯 **Contest Theme: Your Story, Our Ocean**

This platform explores how our ocean **sustains**, **protects**, and **inspires** us through:
- 🌊 **Real-time ocean hazard monitoring** (tsunamis, storm surges, coastal erosion)
- 🤖 **AI-powered ocean health analysis** using computer vision
- 🎓 **Interactive educational quests** teaching marine conservation
- 📊 **Data visualization studio** showing sea level rise and ocean changes (2020-2100)
- 🏘️ **Community conservation hub** for local coastal action
- 💡 **Policy recommendation engine** providing actionable conservation steps

---

## ✨ Core Features

### 🗺️ **Ocean Hazard Intelligence Mapping**
- **Multi-Layer Interactive System**: Tsunami zones, storm surge predictions, coastal erosion rates, sea level rise projections
- **Real-Time Data Integration**: NOAA tsunami warnings, NASA sea level data, USGS coastal change monitoring
- **Predictive Modeling**: Physics-based ocean hazard forecasting with interactive timelines
- **Evacuation Planning**: Community-specific emergency response coordination

### 🤖 **AI-Powered Ocean Health Analysis**
- **Advanced Computer Vision**: Analyzes coastal imagery for plastic pollution, erosion signs, coral health
- **Multi-Model AI Pipeline**: Adapts existing SegFormer and SAM models for marine ecosystem assessment
- **Ocean Health Score**: Comprehensive metrics including biodiversity, pollution levels, ecosystem vitality
- **Conservation Recommendations**: Location-specific action plans based on AI analysis

### 🎓 **Interactive Ocean Education Quests**
Transform learning into adventure with gamified challenges:
- **Tsunami Safety Detective**: Learn evacuation routes and warning signs
- **Coral Guardian**: Identify coral species and threats
- **Beach Cleanup Champion**: Track local conservation efforts
- **Sea Level Scientist**: Explore climate projections
- **Microplastic Hunter**: Understand ocean pollution pathways

### 📊 **Data Visualization Studio**
- **Sea Level Rise Timeline**: Interactive 2020-2100 projections
- **Ocean Temperature Heatmaps**: Global warming impact visualization
- **Coastal Erosion Animation**: Before/after comparisons
- **Marine Biodiversity Tracker**: Species health monitoring
- **Interactive Storytelling**: "A Day in the Life of a Coastline"

### 🏘️ **Coastal Community Hub**
- **Safety Check-ins**: Community-wide status during ocean hazards
- **Hazard Reporting**: Crowd-sourced erosion and pollution alerts
- **Conservation Projects**: Local beach cleanup and reef monitoring coordination
- **Resource Sharing**: Equipment and educational material exchange
- **Anonymous Help Network**: Privacy-first mutual aid system (COPPA compliant)

### 💡 **Conservation Action Recommendation Engine**
Personalized advocacy pathways:
- **Local Actions**: Wetland restoration, coral reef protection, beach cleanups
- **Policy Advocacy**: Contact representatives about coastal protection, marine sanctuaries
- **Educational Outreach**: Share ocean facts, create conservation art
- **Community Organizing**: Join citizen science projects, start local initiatives

---

## 🚀 **Quick Start**

### **Installation**

\`\`\`bash
# Clone the repository
git clone https://github.com/siddharth-shan/oceanaware-guardian.git
cd oceanaware-guardian

# Install dependencies
npm install
cd server && npm install && cd ..

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development servers
npm run dev:all
\`\`\`

### **Environment Variables**
\`\`\`env
# NOAA APIs
VITE_NOAA_API_KEY=your_noaa_key

# NASA Ocean Data
VITE_NASA_EARTHDATA_KEY=your_nasa_key

# Firebase (Anonymous Auth - COPPA Compliant)
VITE_FIREBASE_API_KEY=your_firebase_key

# Azure Cosmos DB
AZURE_COSMOS_KEY=your_cosmos_key
\`\`\`

---

## 📊 **Bow Seat Contest Submission**

### **Category**: Interactive & Multimedia
### **Theme**: Your Story, Our Ocean: How Our Ocean Sustains, Protects, and Inspires Us
### **Deadline**: June 8, 2026

**Theme Alignment:**
- **Sustains**: Real-time data on ocean resources, reciprocal relationship education
- **Protects**: Tsunami/storm surge warnings, climate buffer visualization
- **Inspires**: Interactive storytelling, youth activism platform, conservation art

---

## 🛠️ **Technical Stack**

- **Frontend**: React 18, Vite, Tailwind CSS, Leaflet, Recharts
- **Backend**: Node.js, Express, Azure Cosmos DB
- **AI/ML**: SegFormer, SAM, Custom ocean health models
- **Data**: NOAA, NASA, USGS APIs
- **Auth**: Firebase Anonymous (COPPA compliant)
- **Deployment**: Azure App Service, Vercel

---

## ♿ **Accessibility**

- ✅ COPPA Compliant (Anonymous auth for <13)
- ✅ Bilingual (English/Spanish)
- ✅ WCAG 2.1 AA
- ✅ Voice narration
- ✅ High contrast mode

---

## 🌍 **EcoQuest Nonprofit**

This project extends EcoQuest's mission from wildfire safety to ocean conservation:
- **Congressional App Challenge 2025**: Wildfire platform
- **Ocean Awareness Contest 2026**: Marine conservation
- **Youth-Led**: Student-driven environmental technology

---

## 📜 **License**

MIT License - Built with 💙 for our blue planet

**Contact**: Siddharth Shan | EcoQuest Founder

