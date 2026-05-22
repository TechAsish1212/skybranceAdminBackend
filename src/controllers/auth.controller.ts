import { Request, Response } from "express";
import otpGenerator from 'otp-generator';
import { User } from "../models";
import { sendEmail } from "../utils/email.service";

// Admin register
export const signup = async (req: Request, res: Response) => {
    try {
        const { name, email, password, mobileNumber, countryCode } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already register.please go for login",
            })
        }

        // gen otp
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: true,
            lowerCaseAlphabets: false,
            digits: true,
            specialChars: false,
        });
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        // send otp to email
        const sendOtp = await sendEmail(email, otp);
        if (!sendOtp) {
            return res.status(400).json({
                success: false,
                message: 'Error coming while sending OTP to email'
            })
        }

        // create user
        const newUser = await User.create({
            name,
            email,
            password,
            mobileNumber,
            countryCode,
            role: 'user',
            isEmailVerified: false,
            authentication: {
                token: null,
                expiry: otpExpiry,
                otp: otp,
            },
        });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully. Please verify your email with the OTP sent.',
            data: {
                userId: newUser._id,
                name:newUser.name,
                email: newUser.email
            }
        });

    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// email verified
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User Not Found",
            })
        }
        // check email verified or not 
        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: "User Email is already verified"
            })
        }

        // verify otp
        if (user.authentication?.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            })
        }

        // otp expiry or not
        if (user.authentication?.expiry && new Date() > user.authentication.expiry) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired.Please request a new OTP"
            })
        }

        user.isEmailVerified = true;
        user.authentication.otp = null;
        user.authentication.expiry = null;

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Email verified successfully. You can now login.'
        });

    } catch (error) {
        console.error('Email verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// login
export const signin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Find user
        const admin = await User.findOne({ email });
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