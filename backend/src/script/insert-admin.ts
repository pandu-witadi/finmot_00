import mongoose from "mongoose";
import dotenv from "dotenv";

import { User } from "../model/user.js";
import { hashPassword } from "../utils/security.js";
import { signToken, JwtPayload } from "../utils/jwt.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/finmot_00";

const insertAdmin = async (): Promise<void> => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const adminEmail = "admin@mail.com";
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log("Admin user already exists");
            process.exit(0);
        }

        const hashedPassword = await hashPassword("pegel1nux");

        const admin = new User({
            email: adminEmail,
            password: hashedPassword,
            name: "Administrator",
            role: "admin",
        });

        await admin.save();
        console.log("Admin user created successfully");
        console.log(`Email: ${adminEmail}`);
        console.log("Password: *****");

        // Generate JWT token for admin
        const payload: JwtPayload = {
            id: admin._id.toString(),
            email: adminEmail,
            role: admin.role,
        };
        const token = signToken(payload);
        console.log("\nGenerated JWT Token:");
        console.log(token);

        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
        process.exit(0);
    } catch (error) {
        console.error("Error inserting admin:", error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

insertAdmin();
