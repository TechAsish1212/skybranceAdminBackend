import { Router } from "express";
import { resendOTP, signin, signup, verifyEmail } from "../controllers/auth.controller";

const authRoutes=Router();

authRoutes.post('/signup',signup);
authRoutes.post('/verify-otp',verifyEmail);
authRoutes.post('/resend-otp',resendOTP);
authRoutes.post('/signin',signin);


export default authRoutes;