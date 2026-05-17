import mongoose, { Document } from 'mongoose';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { NextFunction, Request } from 'express';
import userSession from './userSession';
export interface IUserDocument extends Document {
    name: string;
    dob?: Date | null;
    gender?: 'male' | 'female' | 'other' | null;
    mobileNumber?: string | null;
    email: string;
    password?: string;
    lastPasswordChange?: Date | null;
    role: 'user' | 'admin' | 'owner' | string;
    isEmailVerified?: boolean;

    isBanned: boolean;
    banReason?: string | null;

    authentication: {
        token: string | null;
        expiry: Date | null;
        otp: string | null;
    };

    createdAt: Date;
    updatedAt: Date;

    profilePicture?: string | null;
    skyhLinkLimit?: number;
    isFeedbackSubmitted?: boolean;

    isDeleted?: boolean;
    deletedAt?: Date | null;
    reasonForDeletion?: string | null;

    isGoogleLinked?: boolean;
    isGithubLinked?: boolean;
    isMicrosoftLinked?: boolean;
    isFacebookLinked?: boolean;

    // isMfaEnabled?: boolean;
    // mfaOtp?: string | null;
    // mfaExpiry?: Date | null;

    isNotificationEnabled?: boolean;
    themePreference?: 'light' | 'dark' | 'system';

    countryCode?: string; // e.g. "IN", "US", "GB", etc.
    currency?: string | null; // e.g. "USD", "EUR", "INR", etc.
    timezone?: string | null; // e.g. "America/New_York", "Asia/Kolkata"

    comparePassword(candidatePassword: string): Promise<boolean>;
    generateAuthToken(req: Request): Promise<string>;
}


const userSchema = new mongoose.Schema<IUserDocument>({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 200,
    },
    dob: {
        type: Date,
        default: null,
        validate: {
            validator: function (value: Date) {
                return value < new Date();
            },
            message: 'Date of Birth must be in the past',
        },
    },
    gender: {
        type: String,
        default: null,
        enum: ['male', 'female', 'other'],
    },
    mobileNumber: {
        type: String,
        default: null,
        trim: true,
        minlength: 5,
        maxlength: 20,
        match: /^\+?[0-9\s\-()]+$/,
    },
    countryCode: {
        type: String,
        default: "",
        trim: true,
        maxlength: 3,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 5,
        maxlength: 500,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        maxlength: 1024,
    },
    lastPasswordChange: {
        type: Date,
        default: null,
    },
    role: {
        type: String,
        default: 'user',
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    isBanned: {
        type: Boolean,
        default: false,
    },
    banReason: {
        type: String,
        default: null,
    },
    authentication: {
        token: {
            type: String,
            default: null,
        },
        expiry: {
            type: Date,
            default: null,
        },
        otp: {
            type: String,
            default: null,
        },
    },
    profilePicture: {
        type: String,
        default: null,
    },
    skyhLinkLimit: {
        type: Number,
        default: 50,
    },
    isFeedbackSubmitted: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
    reasonForDeletion: {
        type: String,
        default: null,
    },
    isGoogleLinked: {
        type: Boolean,
        default: true,
    },
    isGithubLinked: {
        type: Boolean,
        default: true,
    },
    isMicrosoftLinked: {
        type: Boolean,
        default: true,
    },
    isFacebookLinked: {
        type: Boolean,
        default: true,
    },
    isNotificationEnabled: {
        type: Boolean,
        default: true,
    },
    themePreference: {
        type: String,
        default: 'system',
        enum: ['light', 'dark', 'system'],
    },
    currency: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
        maxlength: 3,
    },
    timezone: {
        type: String,
        default: "Asia/Kolkata",
        trim: true,
    }
}, {
    timestamps: true,
});

userSchema.pre('save', async function (this: IUserDocument, next) {
    const user = this;
    if (user.isModified('password')) {
        const salt = await bcryptjs.genSalt(10);
        const hashed = await bcryptjs.hash(user.password as string, salt);
        user.password = hashed;
    }
    next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    const doc = this as IUserDocument;
    if (!doc.password) return false;
    return await bcryptjs.compare(candidatePassword, doc.password);
};

userSchema.methods.generateAuthToken = async function (req: Request): Promise<string> {

    const doc = this as IUserDocument;
    const sessionToken = crypto.randomBytes(32).toString('hex');

    const ip: string | null = req.connection.remoteAddress || req.ip || null;
    const userAgent: string | null = req.headers['user-agent'] || null;

    const newSession = new userSession({
        user: doc._id,
        token: sessionToken,
        ip: ip ? ip.split('.').slice(0, -1).join('.') + '.xxx' : 'unknown',
        userAgent,
        lastLogin: new Date(),
        expiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });

    const jwtToken = jwt.sign({
        id: doc._id,
        sessionId: newSession._id,
        token: sessionToken,
        role: doc.role,
        type: "authorization",
        loggedInAt: new Date(),
        authMethod: 'standard-jwt',
        provider: 'skybrance',
        accessLevel: 'user',
        appVersion: '1.0.0',
    }, process.env.JWT_SECRET ?? 'your_jwt_secret', { expiresIn: '90d' });

    await newSession.save();

    return jwtToken;
};

const user = mongoose.model<IUserDocument>('user', userSchema);

export default user;