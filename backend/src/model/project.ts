import mongoose, { Document, Schema } from "mongoose";

export interface ProjectDoc extends Document {
    code: string;
    name: string;
    note: string;
    active: boolean;
    done: boolean;
    typ: 'project' | 'routine' | 'other';
    tags: string[];
    stDate: Date;
    endDate: Date;
    arrHeader: Schema.Types.ObjectId[];
    arrBudget: Schema.Types.ObjectId[];
    arrActual: Schema.Types.ObjectId[];
    arrTransaction: Schema.Types.ObjectId[];
    updatedBy: Schema.Types.ObjectId;
    createdAt: Date;
}

const projectSchema = new Schema<ProjectDoc>({
    code: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    note: {
        type: String,
        default: "",
        trim: true
    },
    active: {
        type: Boolean,
        default: true
    },
    done: {
        type: Boolean,
        default: false
    },
    typ: {
        type: String,
        enum: ['project', 'routine', 'other'],
        default: 'project'
    },
    tags: {
        type: [String],
        default: []
    },
    stDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    arrHeader: {
        type: [Schema.Types.ObjectId],
        ref: 'Header',
        default: []
    },
    arrBudget: {
        type: [Schema.Types.ObjectId],
        default: []
    },
    arrActual: {
        type: [Schema.Types.ObjectId],
        default: []
    },
    arrTransaction: {
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

export const Project = mongoose.model<ProjectDoc>("Project", projectSchema);