import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const uri = process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_URI_PROD 
      : (process.env.MONGODB_URI_DEV.startsWith('mongodb') ? process.env.MONGODB_URI_DEV : `mongodb:${process.env.MONGODB_URI_DEV}`);
    
    const dbName = process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_DB_NAME_PROD 
      : process.env.MONGODB_DB_NAME_DEV;

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
