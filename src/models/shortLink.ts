import mongoose, { Document, Schema, ObjectId } from "mongoose";
import bcryptjs from "bcryptjs";

export interface IShortLink extends Document {
    originalUrl: string;
    shortCode: string;
    user?: ObjectId;
    isOrganization: boolean;
    organization?: ObjectId;

    expiryDate?: Date | null;
    isExpired: boolean;

    expiryTitle?: string | null;
    expiryMessage?: string | null;
    expiryUrl?: string | null;

    transferHolderEmail?: string | null;

    collaborators: {
        email: string;
        role: 'viewer' | 'editor';
        addedAt?: Date;
    }[];

    createdAt: Date;
    updatedAt: Date;

    isPasswordProtected?: boolean;
    hashedPassword?: string;

    title: string | null;
    description: string | null;
    imageUrl?: string | null;

    createdFrom?: string | null;

    clicks: number;

    comparePassword(password: string): Promise<boolean>;
}

const shortLinkSchema = new Schema<IShortLink>({
    originalUrl: {
        type: String,
        required: true,
        trim: true,
    },
    shortCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "user",
        default: null,
    },
    isOrganization: {
        type: Boolean,
        default: false,
    },
    organization: {
        type: Schema.Types.ObjectId,
        ref: "organization",
        default: null,
    },
    expiryDate: {
        type: Date,
        default: null,
    },
    isExpired: {
        type: Boolean,
        default: false,
    },
    transferHolderEmail: {
        type: String,
        default: null,
        trim: true,
    },
    collaborators: [{
        email: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['viewer', 'editor'],
            default: 'viewer',
        },
        addedAt: {
            type: Date,
            default: Date.now,
        },
    }],
    isPasswordProtected: {
        type: Boolean,
        default: false,
    },
    hashedPassword: {
        type: String,
        default: null,
    },
    title: {
        type: String,
        default: null,
        trim: true,
        maxlength: 100,
    },
    description: {
        type: String,
        default: null,
        trim: true,
        maxlength: 500,
    },
    imageUrl: {
        type: String,
        default: null,
        trim: true,
    },
    createdFrom: {
        type: String,
        default: null,
        trim: true,
    },
    expiryTitle: {
        type: String,
        default: "Link Expired",
        trim: true,
        maxlength: 100,
    },
    expiryMessage: {
        type: String,
        default: "Sorry, this link has expired.",
        trim: true,
        maxlength: 500,
    },
    expiryUrl: {
        type: String,
        default: null,
        trim: true,
    },
    clicks: {
        type: Number,
        default: 0,
    }
}, {
    timestamps: true,
    versionKey: false,
});

shortLinkSchema.index({ originalUrl: 1 });

shortLinkSchema.pre<IShortLink>('save', async function (next) {
    if (this.isModified('hashedPassword') && this.hashedPassword) {
        const salt = await bcryptjs.genSalt(10);
        this.hashedPassword = await bcryptjs.hash(this.hashedPassword, salt);
    }
    next();
});

shortLinkSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    if (!this.hashedPassword) {
        return false;
    }
    return await bcryptjs.compare(password, this.hashedPassword);
}

const shortLink = mongoose.model<IShortLink>('short_link', shortLinkSchema);

export default shortLink;