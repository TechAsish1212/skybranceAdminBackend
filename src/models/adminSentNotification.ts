import { Document, model, Schema } from "mongoose";

export interface ISentNotification extends Document {
    title: string;
    message: string;
    payload?: any;
    reference: string | null;
    imageUrl?: string | null;

    createdAt: Date;
    updatedAt: Date;
}

const sentNotificationSchema = new Schema<ISentNotification>({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    payload: {
        type: Object,
        default: null,
    },
    imageUrl: {
        type: String,
        default: null,
    },
    reference: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
});

const sentNotification = model<ISentNotification>("admin_sent_notification", sentNotificationSchema);

export default sentNotification;