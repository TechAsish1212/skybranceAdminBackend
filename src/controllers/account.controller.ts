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