import mongoose from "mongoose";

const connectDB = async () => {

    try {
        mongoose.connection.on('connected', () => console.log("Database Connected"));
        await mongoose.connect(`${process.env.MONGODB_URL}/authen-mern`)

    } catch (err) {
        console.error("MongoDB connection error:", err.message);
    }

}

export default connectDB;