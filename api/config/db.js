import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGODB_URI_PROD || process.env.MONGODB_URI_DEV;
    
    if (!uri) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    const dbName = process.env.MONGODB_DB_NAME_PROD || process.env.MONGODB_DB_NAME_DEV || 'lender_hq';


    await mongoose.connect(uri, {
      dbName: dbName,
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
    });
    console.log(`MongoDB Connected: ${dbName}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
