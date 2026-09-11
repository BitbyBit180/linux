import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/linux_hub';
  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    console.error('Tip: start local MongoDB (mongod) or set MONGO_URI in backend/.env to your Atlas URI.');
    process.exit(1);
  }
};

export default connectDB;
