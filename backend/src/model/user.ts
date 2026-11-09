import mongoose, { Document, Schema } from "mongoose";

export interface UserDoc extends Document {
    email: string;
    password?: string;
    name: string;
    fullname?: string;
    role: "user" | "admin" | "finance" | "vendor" | "guest" | "government";
    type: "individual" | "corporate" | "government" | "other";
    bankInfo?: Array<{
        bank: string;
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
    type: {
        type: String,
        enum: ["individual", "corporate", "government", "other"],
        default: "individual",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    fullname: {
        type: String,
        default: "",
        trim: true
    },
    bankInfo: [ bankEntry ],
    deposit: {
        total : Number,
        detail: [ depositEntry ]
    }
});

export const User = mongoose.model<UserDoc>("User", userSchema);
