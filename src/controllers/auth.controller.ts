import { Request, Response } from "express";
import { user } from "../models";

// Admin register
export const signup = async (req: Request, res: Response) => {
    try {
        const { name, email, password, mobileNumber, role, countryCode } = req.body;
        if (!['admin', 'owner'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role.Must be admin or owner",
            });
        }

        const existUser = await user.findOne({ email });
        if (existUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email",
            });
        }

        const admin = await user.create({
            name,
            email,
            password,
            mobileNumber,
            countryCode,
            role,
            isEmailVerified: true,
            isBanned: false,
            isDeleted: false,
        });

        // token
        const token = await admin.generateAuthToken(req);

        return res.status(201).json({
            success: true,
            message: `${role} account created successfully`,
            token: token,
            admin: {
                name: admin.name,
                email: admin.email,
                role: admin.role,
                createdAt: admin.createdAt,
            }
        });


    } catch (error: any) {
        console.error('Admin signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating admin account',
            error: error.message,
        });
    }
}


// login
export const signin=async(req:Request,res:Response)=>{
    try {
            const { email, password } = req.body;

            // Find user
            const admin = await user.findOne({ email });
            if (!admin) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid credentials',
                });
                return;
            }

            // Check if user is admin or owner
            if (!['admin', 'owner'].includes(admin.role)) {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin privileges required.',
                });
                return;
            }

            // Check if admin is banned
            if (admin.isBanned) {
                res.status(403).json({
                    success: false,
                    message: `Account is banned. Reason: ${admin.banReason || 'Contact support'}`,
                });
                return;
            }

            // Check if account is deleted
            if (admin.isDeleted) {
                res.status(403).json({
                    success: false,
                    message: 'Account has been deleted',
                });
                return;
            }

            // Verify password
            const isPasswordValid = await admin.comparePassword(password);
            if (!isPasswordValid) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid credentials',
                });
                return;
            }

            // Generate auth token
            const token = await admin.generateAuthToken(req);

            // Log admin login
            console.log(`Admin login: ${admin.email} (${admin.role}) from IP: ${req.ip}`);

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    admin: {
                        id: admin._id,
                        name: admin.name,
                        email: admin.email,
                        role: admin.role,
                        profilePicture: admin.profilePicture,
                        lastLogin: new Date(),
                    },
                },
            });
        } catch (error: any) {
            console.error('Admin login error:', error);
            res.status(500).json({
                success: false,
                message: 'Error during login',
                error: error.message,
            });
        }
}