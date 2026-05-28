import { Router, type Router as ExpressRouter } from "express";
import { login, register } from "./auth.controller.js";

/**
 * Express router for authentication endpoints.
 */
export const authRouter: ExpressRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
