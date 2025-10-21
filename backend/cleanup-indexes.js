// Check and drop any remaining unique indexes
const { MongoClient } = require('mongodb');

async function checkAndDropIndexes() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/farcaster-tool');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('gamerecords');
    
    // List all existing indexes
    const indexes = await collection.indexes();
    console.log('All existing indexes:');
    indexes.forEach(idx => {
      console.log(`- ${idx.name}: ${JSON.stringify(idx.key)} (unique: ${idx.unique})`);
    });
    
    // Drop any unique indexes except _id_
    for (const index of indexes) {
      if (index.name !== '_id_' && index.unique) {
        try {
          await collection.dropIndex(index.name);
          console.log(`✅ Dropped unique index: ${index.name}`);
        } catch (error) {
          if (error.message.includes('index not found')) {
            console.log(`⚠️  Index ${index.name} not found (already dropped)`);
          } else {
            console.error(`❌ Error dropping ${index.name}:`, error.message);
          }
        }
      }
    }
    
    // List indexes after cleanup
    const indexesAfter = await collection.indexes();
    console.log('\nRemaining indexes after cleanup:');
    indexesAfter.forEach(idx => {
      console.log(`- ${idx.name}: ${JSON.stringify(idx.key)} (unique: ${idx.unique})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkAndDropIndexes();
