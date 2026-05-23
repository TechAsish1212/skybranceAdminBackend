import { Request, Response } from "express";
import { User } from "../models";
import userSession from "../models/userSession";

// get profile
export const getProfile = async (req: Request, res: Response) => {
    try {
        const userFromMiddleware = (req as any).user;

        console.log('User from middleware:', userFromMiddleware);

        let userId = userFromMiddleware?.id;


        if (userId && typeof userId === 'object' && userId.toString) {
            userId = userId.toString();
        }

        console.log('Processed User ID:', userId);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User ID not found in token'
            });
        }

        const user = await User.findById(userId)
            .select('-password -authentication.token -authentication.otp -authentication.resetToken')
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const activeSessions = await userSession.countDocuments({
            user: userId,
            expiry: { $gt: new Date() }
        });

        return res.status(200).json({
            success: true,
            data: {
                user,
                activeSessions,
                memberSince: user.createdAt,
                lastActive: user.updatedAt
            }
        });

    } catch (error) {
        console.error('Get profile error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// update profile
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { name, dob, gender, mobileNumber, countryCode, currency, timezone, themePreference, isNotificationEnabled } = req.body;

        const updateProfile: any = {};
        if (name !== undefined) {
            if (name.length < 1 || name.length > 200) {
                return res.status(400).json({
                    success: false,
                    message: "Name must be between 1 and 200 characters"
                })
            }
            updateProfile.name = name;
        }

        if (dob !== undefined) {
            const dobDate = new Date(dob);
            if (dobDate >= new Date()) {
                return res.status(400).json({
                    success: false,
                    message: "Date of birth must be in the past"
                })
            }
            updateProfile.dob = dobDate;
        }

        if (gender !== undefined) {
            if (!['male', 'female', 'other'].includes(gender)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid gender value"
                })
            }
            updateProfile.gender = gender;
        }

        if (mobileNumber !== undefined) {
            const mobileRegex = /^\+?[0-9\s\-()]{5,20}$/;
            if (!mobileRegex.test(mobileNumber)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid mobile number format"
                })
            }
            updateProfile.mobileNumber = mobileNumber;
        }

        if (countryCode !== undefined) {
            updateProfile.countryCode = countryCode.toUpperCase().slice(0, 3);
        }

        if (currency !== undefined) {
            updateProfile.currency = currency.toUpperCase().slice(0, 3);
        }

        if (timezone !== undefined) {
            updateProfile.timezone = timezone;
        }

        if (themePreference !== undefined) {
            if (!['light', 'dark', 'system'].includes(themePreference)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid theme preference'
                });
            }
            updateProfile.themePreference = themePreference;
        }

        if (isNotificationEnabled !== undefined) {
            updateProfile.isNotificationEnabled = isNotificationEnabled;
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateProfile },
            { new: true, runValidators: true }
        ).select('-password -authentication');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });


    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}