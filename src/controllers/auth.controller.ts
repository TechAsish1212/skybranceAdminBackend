import { Request, Response } from "express";
import otpGenerator from 'otp-generator';
import { User } from "../models";
import { sendEmail, sendPasswordResetEmail } from "../utils/email.service";
import userSession from "../models/userSession";
import jwt from 'jsonwebtoken'
import crypto from 'crypto';

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
                name: newUser.name,
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

// resend verification otp
export const resendOTP = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            })
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: "user email is verified"
            })
        }
        const newOtp = otpGenerator.generate(6, {
            digits: true,
            upperCaseAlphabets: true,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        user.authentication = {
            ...user.authentication,
            otp: newOtp,
            expiry: otpExpiry
        }
        await user.save();

        // send otp to email
        const sendOtp = await sendEmail(email, newOtp);
        if (!sendOtp) {
            return res.status(400).json({
                success: false,
                message: 'Error coming while sending OTP to email'
            })
        }

        return res.status(200).json({
            success: true,
            message: 'New verification OTP sent to your email'
        });

    } catch (error) {
        console.error('Resend OTP error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// login
export const signin = async (req: Request, res: Response) => {
    try {
        const { email, password, rememberMe = true } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email before logging in',
                requiresVerification: true
            });
        }

        // Check if user is banned
        if (user.isBanned) {
            return res.status(403).json({
                success: false,
                message: `Account is banned. Reason: ${user.banReason || 'No reason provided'}`
            });
        }

        // Check if account is deleted
        if (user.isDeleted) {
            return res.status(403).json({
                success: false,
                message: 'Account has been deleted'
            });
        }

        // Verify password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Set session duration based on rememberMe
        const sessionDuration = rememberMe ? 30 : 1;
        const sessionExpiry = new Date();
        sessionExpiry.setDate(sessionExpiry.getDate() + sessionDuration);

        // Generate session token
        const sessionToken = crypto.randomBytes(32).toString('hex');

        const ip: string | null = req.connection.remoteAddress || req.ip || null;
        const userAgent: string | null = req.headers['user-agent'] || null;

        // Create session
        const newSession = new userSession({
            user: user._id,
            token: sessionToken,
            ip: ip ? ip.split('.').slice(0, -1).join('.') + '.xxx' : 'unknown',
            userAgent,
            lastLogin: new Date(),
            expiry: sessionExpiry,
        });

        await newSession.save();

        // Generate JWT token
        const jwtToken = jwt.sign({
            id: user._id,
            sessionId: newSession._id,
            token: sessionToken,
            role: user.role,
            type: "authorization",
            loggedInAt: new Date(),
            authMethod: 'standard-jwt',
            provider: 'skybrance',
            accessLevel: 'user',
            appVersion: '1.0.0',
        }, process.env.JWT_SECRET ?? 'your_jwt_secret', {
            expiresIn: `${sessionDuration}d`
        });

        // Set HTTP-only cookie 
        res.cookie('auth_token', jwtToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: sessionDuration * 24 * 60 * 60 * 1000,
            path: '/',
        });


        // Return user data 
        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            profilePicture: user.profilePicture,
            themePreference: user.themePreference,
            rememberMe: rememberMe,
            sessionExpiry: sessionExpiry,
        };

        // return token in response 
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: userData,
                token: jwtToken,
                expiresIn: `${sessionDuration}d`,
                sessionExpiry: sessionExpiry
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// logout
export const signout = async (req: Request, res: Response) => {
    try {
        const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer', "");
        if (token) {
            try {
                const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'jwthfdhdf');
                if (decoded && decoded.sessionId) {
                    await userSession.findByIdAndDelete(decoded.sessionId);
                }
            } catch (error) {

            }
        }

        res.clearCookie('auth_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        });

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.clearCookie('auth_token');
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    }
}

// forgot password
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email must be Required",
            })
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            })
        }

        // gen reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExipry = new Date(Date.now() + 10 * 60 * 1000);

        user.authentication = {
            ...user.authentication,
            token: resetToken,
            expiry: resetTokenExipry,
        }

        await user.save();
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}&email=${email}`;

        // sent email
        const emailSent = await sendPasswordResetEmail(email, resetLink);
        if (!emailSent) {
            return res.status(500).json({
                success: false,
                message: "Failed to send reset email. Please try again."
            })
        }

        return res.status(200).json({
            success: true,
            message: "Password reset link sent to your email"
        });


    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
}

// reset Password
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, email, newPassword, confirmPassword } = req.body;
        
        if (!token || !email || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields (token, email, newPassword, confirmPassword) are required"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long"
            });
        }

        const user = await User.findOne({
            email,
            'authentication.token': token
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        if (user.authentication?.expiry && new Date() > user.authentication.expiry) {
            return res.status(400).json({
                success: false,
                message: 'Reset token has expired. Please request a new one.'
            });
        }

        user.password = newPassword;
        user.lastPasswordChange = new Date();
        
        user.authentication.token = null;
        user.authentication.expiry = null;

        await userSession.deleteMany({ user: user._id });
        await user.save();

        res.clearCookie('auth_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        });

        return res.status(200).json({
            success: true,
            message: 'Password reset successful. Please login with your new password.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.'
        });
    }
};