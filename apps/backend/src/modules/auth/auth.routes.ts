import { Router } from "express";
import * as AuthController from "./auth.controller.js";
import { authenticateJWT } from "./auth.middleware.js";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);

router.post("/2fa/setup", authenticateJWT, AuthController.setupTwoFactor);
router.post("/2fa/enable", authenticateJWT, AuthController.enableTwoFactor);

export default router;
