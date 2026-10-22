import mongoose, { Document, Schema } from "mongoose";

export interface ActualDoc extends Document {
    name: string;
    tags: string[];
    active: boolean;
    type: 'income' | 'expense';
    amount: number;
    project: Schema.Types.ObjectId;
    budget: Schema.Types.ObjectId;
    trx: Schema.Types.ObjectId;
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
    budget: {
        type: Schema.Types.ObjectId,
        ref: 'Budget',
        required: true
    },
    trx: {
        type: Schema.Types.ObjectId,
        ref: 'Transaction',
        required: true
    },
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
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

export const Actual = mongoose.model<ActualDoc>("Actual", actualSchema);