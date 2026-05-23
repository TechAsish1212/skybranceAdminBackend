import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { getProfile } from "../controllers/account.controller";

const accountRoutes=Router();

accountRoutes.get('/',authenticate,getProfile);

export default accountRoutes;