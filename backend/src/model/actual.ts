import mongoose, { Document, Schema } from "mongoose";

export interface ActualDoc extends Document {
    name: string;
    note?: string;
    tags: string[];
    active: boolean;
    type: 'income' | 'expense';
    amount: number;
    project: Schema.Types.ObjectId;
    budget: Schema.Types.ObjectId;
    transaction: Schema.Types.ObjectId | null;
    exDate: Date;
    assignedTo: Schema.Types.ObjectId;
    updatedAt: Date;
    updatedBy: Schema.Types.ObjectId;
    createdAt: Date;
}

const actualSchema = new Schema<ActualDoc>({
    name: {
        type: String,
        required: true,
        trim: true
    },
    tags: {
        type: [String],
        default: []
    },
    note: {
        type: String,
        default: "",
        trim: true
    },
    done: {
        type: Boolean,
        default: false
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
    budget: {
        type: Schema.Types.ObjectId,
        ref: 'Budget',
        required: true
    },
    transaction: {
        type: Schema.Types.ObjectId,
        ref: 'Transaction',
        default: null
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        required: false
    },
    exDate: {
        type: Date,
        required: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Actual = mongoose.model<ActualDoc>("Actual", actualSchema);