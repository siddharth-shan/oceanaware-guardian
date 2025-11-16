/**
 * Cosmos DB Cleanup Script
 * Cleans up Community Hub containers for fresh start
 */

import { CosmosClient } from '@azure/cosmos';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env.local' });

const cosmosConnectionString = process.env.COSMOS_PRIMARY_CONNECTION_STRING;
const databaseName = 'EcoQuestDB';

const containersToClean = [
  'CommunityCheckins',
  'CommunityReports', 
  'HelpOffers',
  'AnonymousMessages'
];

async function cleanupCosmosDB() {
  try {
    if (!cosmosConnectionString) {
      throw new Error('COSMOS_PRIMARY_CONNECTION_STRING not found in environment variables');
    }

    console.log('🧹 Starting Cosmos DB cleanup...');
    
    const cosmosClient = new CosmosClient(cosmosConnectionString);
    const database = cosmosClient.database(databaseName);

    for (const containerName of containersToClean) {
      try {
        console.log(`📦 Cleaning container: ${containerName}`);
        
        const container = database.container(containerName);
        
        // Query all items
        const querySpec = {
          query: 'SELECT c.id, c.geoRegion FROM c'
        };
        
        const { resources: items } = await container.items.query(querySpec).fetchAll();
        
        console.log(`   Found ${items.length} items to delete`);
        
        // Delete all items
        for (const item of items) {
          await container.item(item.id, item.geoRegion).delete();
        }
        
        console.log(`✅ Cleaned ${containerName}: ${items.length} items deleted`);
        
      } catch (error) {
        if (error.code === 404) {
          console.log(`⚠️  Container ${containerName} not found - skipping`);
        } else {
          console.error(`❌ Error cleaning ${containerName}:`, error.message);
        }
      }
    }
    
    console.log('🎉 Cosmos DB cleanup completed successfully');
    
  } catch (error) {
    console.error('❌ Cosmos DB cleanup failed:', error);
    process.exit(1);
  }
}

// Run cleanup
cleanupCosmosDB();