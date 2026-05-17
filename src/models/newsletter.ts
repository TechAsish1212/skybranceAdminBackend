import mongoose, { Document } from "mongoose";

export interface INewsletterDocument extends Document {
    email: string;
}

const newsletterSchema = new mongoose.Schema<INewsletterDocument>({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
}, { timestamps: true, versionKey: false });

const newsletter = mongoose.model<INewsletterDocument>('newsletter', newsletterSchema);

export default newsletter;