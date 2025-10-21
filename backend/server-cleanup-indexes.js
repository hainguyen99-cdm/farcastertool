// Server cleanup script - run this on your server to drop all unique indexes
const { MongoClient } = require('mongodb');

async function cleanupServerIndexes() {
  // Use your server's MongoDB connection string
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/farcaster-tool');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB on server');
    
    const db = client.db();
    const collection = db.collection('gamerecords');
    
    // List all existing indexes
    const indexes = await collection.indexes();
    console.log('Server database indexes:');
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
    
    // Verify cleanup
    const indexesAfter = await collection.indexes();
    console.log('\nServer indexes after cleanup:');
    indexesAfter.forEach(idx => {
      console.log(`- ${idx.name}: ${JSON.stringify(idx.key)} (unique: ${idx.unique})`);
    });
    
    console.log('\n✅ Server database cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

cleanupServerIndexes();
