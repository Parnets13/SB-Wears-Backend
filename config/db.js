const mongoose = require('mongoose');
require('dotenv').config()

const connectDB = async () => {
    try {
      await mongoose.connect(process.env.MONGO_DB_URL, {
      // await mongoose.connect("mongodb://localhost:27017/sbwears_sbwears_db", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("MongoDB connected successfully");
    } catch (error) {
      console.error("MongoDB connection failed:", error.message);
      process.exit(1);
    }
  };

module.exports = connectDB;