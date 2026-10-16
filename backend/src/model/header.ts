import mongoose, { Document, Schema } from "mongoose";

export interface HeaderDoc extends Document {
    name: string;
    tags: string[];
    active: boolean;
    type: 'income' | 'expense';
    project: Schema.Types.ObjectId;
    arrBudget: Schema.Types.ObjectId[];
    order: number;
    updatedBy: Schema.Types.ObjectId;
    createdAt: Date;
}

const headerSchema = new Schema<HeaderDoc>({
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
    project: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    arrBudget: {
        type: [Schema.Types.ObjectId],
        default: []
    },
    order: {
        type: Number,
        default: 0
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

export const Header = mongoose.model<HeaderDoc>("Header", headerSchema);