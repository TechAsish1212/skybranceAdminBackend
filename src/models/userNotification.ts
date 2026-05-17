import { model, Schema, Types, Document } from 'mongoose';

export interface IUserNotificationDocument extends Document {
    userId: Types.ObjectId;

    title: string;
    message: string;

    description?: string | null;

    type: string;

    imageUrl?: string | null;
    payload: {
        actionLabel?: string | null;
        actionUrl?: string | null;
        redirect: string | null; // login, dashboard, profile, etc. or external URL
        [key: string]: any; // Additional data related to the notification
    };

    createdAt: Date;
    updatedAt: Date;

    read: boolean;
    readAt?: Date | null;

    expiresAt?: Date | null;
}

const userNotificationSchema = new Schema<IUserNotificationDocument>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: null,
        trim: true,
    },
    type: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        default: null,
    },
    payload: {
        type: Schema.Types.Mixed,
        default: {},
    },
    read: {
        type: Boolean,
        default: false,
    },
    readAt: {
        type: Date,
        default: null,
    },
    expiresAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

userNotificationSchema.index({ userId: 1, createdAt: -1 });
userNotificationSchema.index({ userId: 1, read: 1 });
userNotificationSchema.index({ expiresAt: 1 });

const userNotification = model<IUserNotificationDocument>('user_notification', userNotificationSchema);

export default userNotification;