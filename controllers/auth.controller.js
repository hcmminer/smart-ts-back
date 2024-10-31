import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { generateTokens } from "../lib/auth.utils.js";

// Đăng ký thông thường
export const signup = async (req, res) => {
	const { email, password, name } = req.body;
	try {
		const userExists = await User.findOne({ email });

		if (userExists) {
			if (userExists.googleId) {
				return res.status(400).json({ message: "This email is already registered with Google. Please use a different email." });
			}
			return res.status(400).json({ message: "User already exists" });
		}

		const user = await User.create({ name, email, password });
		const { accessToken, refreshToken } = generateTokens(user);

		// Đặt các token trong header
		res.setHeader("Authorization", `Bearer ${accessToken}`);
		res.setHeader("x-refresh-token", refreshToken);

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

// Đăng nhập thông thường
export const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });

		if (user) {
			if (user.googleId) {
				return res.status(400).json({ message: "This email is registered with Google. Please use Google login." });
			}

			if (await user.comparePassword(password)) {
				const { accessToken, refreshToken } = generateTokens(user);

				// Đặt các token trong header
				res.setHeader("Authorization", `Bearer ${accessToken}`);
				res.setHeader("x-refresh-token", refreshToken);

				res.json({
					_id: user._id,
					name: user.name,
					email: user.email,
					role: user.role,
				});
			} else {
				res.status(400).json({ message: "Invalid email or password" });
			}
		} else {
			res.status(400).json({ message: "Invalid email or password" });
		}
	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ message: error.message });
	}
};

// Làm mới token
export const refreshToken = async (req, res) => {
	try {
		const { refreshToken } = req.headers;

		if (!refreshToken) {
			return res.status(401).json({ message: "No refresh token provided" });
		}

		const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
		const newAccessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

		// Đặt access token mới trong header
		res.setHeader("Authorization", `Bearer ${newAccessToken}`);

		res.json({ message: "Token refreshed successfully" });
	} catch (error) {
		console.log("Error in refreshToken controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProfile = async (req, res) => {
	if (req.user) { // Kiểm tra nếu đã có thông tin người dùng từ middleware
		res.json(req.user); // Trả về thông tin người dùng nếu đã xác thực
	} else {
		res.status(401).json({ message: "Unauthorized" }); // Trả về lỗi nếu chưa xác thực
	}
};

// Đăng xuất
export const logout = (req, res) => {
	try {
		res.status(200).json({ message: "Logged out successfully" });
	} catch (error) {
		console.error("Error during logout:", error.message);
		res.status(500).json({ message: "Internal server error" });
	}
};
