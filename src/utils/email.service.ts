import nodemailer from "nodemailer";

// Function for email verification (uses OTP)
export const sendEmail = async (email: string, otp: string) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            return false;
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        await transporter.verify();

        const htmlContent = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Verify Your Email</h1>
                </div>
                <div style="padding: 30px; background-color: #ffffff;">
                    <p style="font-size: 16px; color: #333;">Hello,</p>
                    <p style="font-size: 16px; color: #333;">Thank you for registering with <strong>SkyBrance</strong>!</p>
                    <p style="font-size: 16px; color: #333;">Please use the following OTP to verify your email address:</p>
                    <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                        <div style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #667eea;">
                            ${otp}
                        </div>
                    </div>
                    <p style="font-size: 14px; color: #666;">⏰ This OTP is valid for <strong>10 minutes</strong>.</p>
                    <p style="font-size: 14px; color: #666;">🔒 If you didn't request this, please ignore this email.</p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                    <p style="font-size: 12px; color: #999; text-align: center;">This is an automated message, please do not reply.</p>
                </div>
            </div>
        `;

        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.SMTP_USER,
            to: email,
            subject: 'Verify Your Email - SkyBrance',
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        return true;

    } catch (error) {
        return false;
    }
};

// Function for sending password reset LINK email (NO OTP)
export const sendPasswordResetEmail = async (email: string, resetLink: string) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            return false;
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        await transporter.verify();

        const htmlContent = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Password Reset Request</h1>
                </div>
                <div style="padding: 30px; background-color: #ffffff;">
                    <p style="font-size: 16px; color: #333;">Hello,</p>
                    <p style="font-size: 16px; color: #333;">We received a request to reset your password for your <strong>Aptitude Platform</strong> account.</p>
                    <p style="font-size: 16px; color: #333;">Click the button below to reset your password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                            Reset Password
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #666;">⏰ This link is valid for <strong>10 minutes</strong>.</p>
                    <p style="font-size: 14px; color: #666;">🔒 If you didn't request this, please ignore this email.</p>
                    <p style="font-size: 12px; color: #999; margin-top: 20px;">If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="font-size: 12px; color: #999; word-break: break-all;">${resetLink}</p>
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                    <p style="font-size: 12px; color: #999; text-align: center;">This is an automated message, please do not reply.</p>
                </div>
            </div>
        `;

        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.SMTP_USER,
            to: email,
            subject: 'Reset Your Password - SkyBrance',
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        return true;

    } catch (error) {
        return false;
    }
};