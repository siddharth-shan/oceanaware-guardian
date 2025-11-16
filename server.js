#!/usr/bin/env node

// Azure-compatible server startup script
// This runs from the root directory where node_modules are available

console.log('🚀 Starting EcoQuest Wildfire Watch server...');
console.log('Current working directory:', process.cwd());
console.log('Node version:', process.version);
console.log('NODE_PATH:', process.env.NODE_PATH);

// Import and start the actual server
import('./server/server.js').catch(error => {
  console.error('❌ Failed to start server:', error);
  console.error('Error details:', error.message);
  process.exit(1);
});