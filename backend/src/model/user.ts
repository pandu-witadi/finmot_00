import mongoose, { Document, Schema } from "mongoose";

export interface UserDoc extends Document {
    email: string;
    password?: string;
    name: string;
    role: "user" | "admin" | "finance" | "vendor" | "guest" | "government";
    bankInfo?: Array<{
        bank: string;
        code: string;
        accountNo: string;
        name: string;
    }>;
    deposit?: {
        total?: number;
        detail?: Array<{
            sign?: "+" | "-";
            amount?: number;
            note?: string;
            date?: Date;
        }>;
    };
    createdAt: Date;
}


const bankEntry = {
    bank: {
        type: String,
        trim: true,
        default: ""
    },
    code: {
        type: String,
        trim: true,
        default: ""
    },
    accountNo: {
        type: String,
        trim: true,
        default: ""
    },
    name: {
        type: String,
        trim: true,
        default: ""
    }
}


const depositEntry = {
    sign: {
        type: String,
        enum: ["+", "-"],
        default: "+"
    },
    amount: {
        type: Number,
        default: 0
    },
    note: {
        type: String,
        default: ""
    },
    date: {
        type: Date,
        default: Date.now
    }
}

const userSchema = new Schema<UserDoc>({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        select: false,
    },
    name: {
        type: String,
        default: "",
        trim: true
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
    bankInfo: [ bankEntry ],
    deposit: {
        total : Number,
        detail: [ depositEntry ]
    }
});

export const User = mongoose.model<UserDoc>("User", userSchema);
