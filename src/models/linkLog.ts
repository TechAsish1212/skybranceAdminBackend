import mongoose, { Document, Schema, ObjectId } from "mongoose";

export interface ILinkLogDocument extends Document {
    shortLink: ObjectId;
    device: string;
    os: string;
    location: string;
    userAgent: string;
    referrer: string;
    language?: string;
    ipAddress?: string;

    createdAt: Date;
    updatedAt: Date;
}

const linkLogSchema = new Schema<ILinkLogDocument>({
    shortLink: {
        type: Schema.Types.ObjectId,
        ref: "short_link",
        required: true,
    },
    device: {
        type: String,
        toLowerCase: true,
        trim: true,
        default: 'unknown',
    },
    os: {
        type: String,
        toLowerCase: true,
        trim: true,
        default: 'unknown',
    },
    location: {
        type: String,
        toLowerCase: true,
        trim: true,
        default: 'unknown',
    },
    userAgent: {
        type: String,
        trim: true,
        default: 'unknown',
    },
    referrer: {
        type: String,
        trim: true,
        default: 'direct',
    },
    language: {
        type: String,
        trim: true,
    },
    ipAddress: {
        type: String,
        trim: true,
    }
}, {
    timestamps: true,
    versionKey: false,
});

linkLogSchema.index({ shortLink: 1, createdAt: -1 });

const linkLog = mongoose.model<ILinkLogDocument>('link_log', linkLogSchema);

export default linkLog;