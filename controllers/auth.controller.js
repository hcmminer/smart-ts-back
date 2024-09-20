import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import {generateTokens, setCookies} from "../lib/auth.utils.js";
import passport from "passport";

const clientUrl = process.env.CLIENT_URL;

export const signup = async (req, res) => {
	const { email, password, name } = req.body;
	try {
		const userExists = await User.findOne({ email });

		if (userExists) {
			return res.status(400).json({ message: "User already exists" });
		}
		const user = await User.create({ name, email, password });

		// authenticate
		const { accessToken, refreshToken } = generateTokens(user._id);
		setCookies(res, accessToken, refreshToken);

		res.status(201).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			role: user.role,
		});
	} catch (error) {
		console.log("Error in signup controller", error.message);
		res.status(500).json({ message: error.message });
	}
};

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });

		if (user && (await user.comparePassword(password))) {
			const { accessToken, refreshToken } = generateTokens(user._id);
			setCookies(res, accessToken, refreshToken);

			res.json({
				_id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
			});
		} else {
			res.status(400).json({ message: "Invalid email or password" });
		}
	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ message: error.message });
	}
};

// this will refresh the access token
export const refreshToken = async (req, res) => {
	try {
		const refreshToken = req.cookies.refreshToken;

		if (!refreshToken) {
			return res.status(401).json({ message: "No refresh token provided" });
		}

		const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
		const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 15 * 60 * 1000,
		});

		res.json({ message: "Token refreshed successfully" });
	} catch (error) {
		console.log("Error in refreshToken controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProfile = async (req, res) => {
	try {
		res.json(req.user);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Handle Google Auth Success (Login or Registration)
export const handleGoogleAuthSuccess = async (req, res) => {
	try {
		const user = req.user;

		if (!user) {
			return res.status(400).json({ message: "User not found" });
		}

		let existingUser = await User.findOne({ email: user.email });

		if (!existingUser) {
			existingUser = new User({
				name: user.name,
				email: user.email,
				image: user.image,
			});
			await existingUser.save();
		}

		const { accessToken, refreshToken } = generateTokens(existingUser._id);
		setCookies(res, accessToken, refreshToken);

		res.status(200).json({
			_id: existingUser._id,
			name: existingUser.name,
			email: existingUser.email,
			role: existingUser.role,
			image: existingUser.image,
		});
	} catch (error) {
		console.error("Error in handleGoogleAuthSuccess controller:", error.message);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Start Google Auth process
export const googleAuth = (req, res, next) => {
	passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
};

// Google Auth Callback
export const googleAuthCallback = async (req, res) => {
	passport.authenticate("google", async (err, user) => {
		if (err) {
			return res.redirect(`${clientUrl}/login`); // Redirect if error
		}

		if (!user) {
			return res.redirect(`${clientUrl}/login`); // Redirect if no user
		}

		const { accessToken, refreshToken } = generateTokens(user._id);
		setCookies(res, accessToken, refreshToken);

		res.redirect(`${clientUrl}`); // Redirect after login
	})(req, res);
};

// Logout API
export const logout = (req, res) => {
	try {
		// Xóa accessToken
		res.clearCookie("accessToken", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			path: "/", // Ensure the same path as when it was set
		});

		// Xóa refreshToken
		res.clearCookie("refreshToken", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			path: "/", // Ensure the same path as when it was set
		});

		res.status(200).json({ message: "Logged out successfully" });
	} catch (error) {
		console.error("Error during logout:", error.message);
		res.status(500).json({ message: "Internal server error" });
	}
};