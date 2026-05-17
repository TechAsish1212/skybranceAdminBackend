import mongoose, { Document } from "mongoose";

export interface IQuoteDocument extends Document {
    name: string;
    email: string;
    mobileNumber: string;
    countryCode: string;

    details: string;
    status: 'new' | 'in_progress' | 'completed' | 'not_interested' | 'follow_up' | 'closed' | 'rejected' | 'ghosted';

    companyOrganizationName?: string;
    companyOrganizationWebsite?: string;
    yourRole?: string;
    industryType?: string;

    currency?: string;
    projectType?: string;
    projectBudget?: string;
    projectTimeline?: string;
    referenceLinks?: string[];

    preferredLanguage?: string;
    leadSource?: string;
    notes?: string[];

    createdAt: Date;
    updatedAt: Date;
}

const quoteSchema = new mongoose.Schema<IQuoteDocument>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
    },
    mobileNumber: {
        type: String,
        required: false,
        trim: true,
    },
    countryCode: {
        type: String,
        default: "+91",
        trim: true,
    },
    details: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000,
    },
    status: {
        type: String,
        enum: ['new', 'in_progress', 'completed', 'not_interested', 'follow_up', 'closed', 'rejected', 'ghosted'],
        default: 'new',
    },
    companyOrganizationName: {
        type: String,
        trim: true,
    },
    companyOrganizationWebsite: {
        type: String,
        trim: true,
    },
    yourRole: {
        type: String,
        trim: true,
    },
    industryType: {
        type: String,
        trim: true,
    },
    currency: {
        type: String,
        trim: true,
    },
    projectType: {
        type: String,
        trim: true,
    },
    projectBudget: {
        type: String,
        trim: true,
    },
    projectTimeline: {
        type: String,
        trim: true,
    },
    referenceLinks: [{
        type: String,
        trim: true,
    }],
    preferredLanguage: {
        type: String,
        trim: true,
    },
    leadSource: {
        type: String,
        trim: true,
    },
    notes: [{
        type: String,
        trim: true,
    }],

}, { timestamps: true, versionKey: false });

const quote = mongoose.model<IQuoteDocument>('quote', quoteSchema);

export default quote;