import { Document, Schema, model } from "mongoose";

export interface IOrganizationDocument extends Document {
    name: string;
    email: string;
    orgNo: string;

    description?: string | null;
    phone?: string | null;
    countryCode?: string | null;

    websiteUrl?: string | null;
    logoUrl?: string | null;

    members: {
        email: string;
        role: 'owner' | 'admin' | 'viewer' | 'editor';
        addedAt?: Date;
    }[];

    createdAt: Date;
    updatedAt: Date;

    skyhLinkLimit?: number;
}

const organizationSchema = new Schema<IOrganizationDocument>({
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
    orgNo: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: null,
        trim: true,
    },
    phone: {
        type: String,
        default: null,
        trim: true,
    },
    countryCode: {
        type: String,
        default: "+91",
        trim: true,
    },
    websiteUrl: {
        type: String,
        default: null,
        trim: true,
    },
    logoUrl: {
        type: String,
        default: null,
    },
    members: [{
        email: {
            type: String,
            required: true,
            trim: true,
        },
        role: {
            type: String,
            enum: ['owner', 'admin', 'viewer', 'editor'],
            required: true,
        },
        addedAt: {
            type: Date,
            default: Date.now,
        },
    }],
    skyhLinkLimit: {
        type: Number,
        default: 10,
    }
}, { timestamps: true, versionKey: false });

const organization = model<IOrganizationDocument>('organization', organizationSchema);

export default organization;