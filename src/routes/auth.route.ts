import { Router } from "express";
import { signin, signup, verifyEmail } from "../controllers/auth.controller";

const authRoutes=Router();

authRoutes.post('/signup',signup);
authRoutes.post('/verify-otp',verifyEmail);
authRoutes.post('/signin',signin);


export default authRoutes;