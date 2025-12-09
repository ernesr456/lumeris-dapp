const mongoose = require('mongoose');

const connectToDatabase = async () => {
  const uri = process.env.DATABASE_URL;

  if (!uri) {
    console.error('❌ Missing DATABASE_URL environment variable.');
    process.exit(1);
  }

  try {
    const db = await mongoose.connect(uri);

    console.log(`📌 MongoDB successfully connected to: ${db.connection.host}`);
  } catch (err) {
    console.error(`🚫 MongoDB Connection Failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectToDatabase;
