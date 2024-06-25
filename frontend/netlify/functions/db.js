import mongoose from 'mongoose';
require('dotenv').config();

const connectToDatabase = async () => {
  const db = await mongoose.connect(process.env.URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  return db;
};

connectToDatabase();