import mongoose, { Document, Schema } from "mongoose";

export interface UserDoc extends Document {
    email: string;
    password: string;
    name: string;
    role: "user" | "admin" | "finance" | "vendor" | "guest" | "government";
    createdAt: Date;
}

const userSchema = new Schema<UserDoc>({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    name: {
        type: String,
        default: "",
    },
    role: {
        type: String,
        enum: ["user", "admin", "finance", "vendor", "guest", "government"],
        default: "user",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export const User = mongoose.model<UserDoc>("User", userSchema);