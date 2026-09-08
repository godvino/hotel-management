const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      console.error('❌ MONGODB_URI is not configured in your environment (.env file).');
      console.error('👉 Please set your MongoDB Cloud Atlas connection string in .env:');
      console.error('   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/hotel_booking?retryWrites=true&w=majority\n');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });

    console.log(`📦 MongoDB Cloud Database Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Cloud Connection Error:', error.message);
    console.error('👉 Ensure your MongoDB Atlas IP Access List has 0.0.0.0/0 (allow from anywhere) and credentials are valid.\n');
    process.exit(1);
  }
};

const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

module.exports = { connectDB, closeDB };
