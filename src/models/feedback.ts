import mongoose, { Document } from "mongoose";

interface IFeedback extends Document {
    user: mongoose.Schema.Types.ObjectId;
    rating: number;
    review: string;
    createdAt: Date;
    updatedAt: Date;
}

const feedbackSchema = new mongoose.Schema<IFeedback>(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
        rating: { type: Number, min: 1, max: 5 },
        review: { type: String, default: "" },
    },
    { timestamps: true }
);

const feedback = mongoose.model<IFeedback>("feedback", feedbackSchema);

export default feedback;