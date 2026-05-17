import mongoose, { Document, Schema } from 'mongoose';

export interface ISessionDocument extends Document {
    user: mongoose.Types.ObjectId;
    token: string;
    ip?: string | null;
    userAgent?: string | null;
    lastLogin: Date;
    expiry: Date;
    fcmToken?: string | null;
}

const sessionSchema = new Schema<ISessionDocument>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    token: {
        type: String,
        required: true,
        unique: true,
    },
    ip: {
        type: String,
        default: null,
    },
    userAgent: {
        type: String,
        default: null,
    },
    lastLogin: {
        type: Date,
        default: Date.now,
    },
    expiry: {
        type: Date,
        required: true,
    },
    fcmToken: {
        type: String,
        default: null,
    },
}, { timestamps: true });

const userSession = mongoose.model<ISessionDocument>('user_session', sessionSchema);

export default userSession;