import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { getProfile, updateProfile } from "../controllers/account.controller";

const accountRoutes = Router();

accountRoutes.get('/', authenticate, getProfile);
accountRoutes.patch('/update-profile', authenticate, updateProfile);

export default accountRoutes;