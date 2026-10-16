import mongoose, { Document, Schema } from "mongoose";

export interface TransactionDoc extends Document {
    name: string;
    tags: string[];
    active: boolean;
    type: 'income' | 'expense';
    amount: number;
    project: Schema.Types.ObjectId;
    arrActual: Schema.Types.ObjectId[];
    updatedBy: Schema.Types.ObjectId;
    createdAt: Date;
}

const transactionSchema = new Schema<TransactionDoc>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    tags: {
        type: [String],
        default: []
    },
    active: {
        type: Boolean,
        default: true
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        default: 0
    },
    project: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    arrActual: {
        type: [Schema.Types.ObjectId],
        default: []
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Transaction = mongoose.model<TransactionDoc>("Transaction", transactionSchema);