import { Router } from "express";
import { resendOTP, signin, signout, signup, verifyEmail } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth";

const authRoutes=Router();

authRoutes.post('/signup',signup);
authRoutes.post('/verify-otp',verifyEmail);
authRoutes.post('/resend-otp',resendOTP);
authRoutes.post('/signin',signin);
authRoutes.post('/signout',signout);


export default authRoutes;