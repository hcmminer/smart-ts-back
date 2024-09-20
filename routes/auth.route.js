import express from "express";
import {
    login,
    logout,
    signup,
    refreshToken,
    getProfile,
    googleAuth,
    googleAuthCallback,
    handleGoogleAuthSuccess
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.get("/profile", protectRoute, getProfile);

// Start Google authentication
router.get("/google", googleAuth);

// Google authentication callback
router.get("/google/callback", googleAuthCallback);

// Handle Google auth success (login or registration)
router.get("/google-auth-success", handleGoogleAuthSuccess);

export default router;
