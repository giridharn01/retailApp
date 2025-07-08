const dotenv = require('dotenv');
dotenv.config();
const dbUri = process.env.MONGODB_URI;

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(dbUri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;