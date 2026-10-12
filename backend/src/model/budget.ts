import mongoose, { Document, Schema } from "mongoose";

export interface BudgetDoc extends Document {
    name: string;
    tags: string[];
    active: boolean;
    type: 'income' | 'expense';
    done: boolean;
    amount: number;
    project: Schema.Types.ObjectId;
    updatedBy: Schema.Types.ObjectId;
    createdAt: Date;
}

const budgetSchema = new Schema<BudgetDoc>({
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
    done: {
        type: Boolean,
        default: false
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

export const Budget = mongoose.model<BudgetDoc>("Budget", budgetSchema);