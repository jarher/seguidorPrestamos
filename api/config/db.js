import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const isProd = process.env.NODE_ENV === 'production';

    const uri = process.env.MONGODB_URI
      || (isProd ? process.env.MONGODB_URI_PROD : null)
      || process.env.MONGODB_URI_DEV
      || process.env.MONGODB_URI_PROD;
    
    if (!uri) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    const dbName = isProd
      ? (process.env.MONGODB_DB_NAME_PROD || 'lenders_hq_prod')
      : (process.env.MONGODB_DB_NAME_DEV || 'lenders_hq_dev');


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
