import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { changePassword, getProfile, updateProfile } from "../controllers/account.controller";

const accountRoutes = Router();

accountRoutes.get('/', authenticate, getProfile);
accountRoutes.patch('/update-profile', authenticate, updateProfile);
accountRoutes.post('/change-password',authenticate,changePassword);

export default accountRoutes;