import { Router } from "express";
import authRoutes from "./auth.route";
import accountRoutes from "./account.route";

const routes=Router();

routes.use('/auth',authRoutes);
routes.use('/account',accountRoutes);

export default routes;