import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import {generateTokens, setCookies} from "../lib/auth.utils.js";

const clientUrl = process.env.CLIENT_URL;

// dang ky thong thuong
export const signup = async (req, res) => {
	const { email, password, name } = req.body;
	try {
		// Kiểm tra xem người dùng đã tồn tại trong DB chưa
		const userExists = await User.findOne({ email });

		if (userExists) {
			// Kiểm tra xem user đã đăng nhập bằng Google chưa
			if (userExists.googleId) {
				return res.status(400).json({ message: "This email is already registered with Google. Please use a different email." });
			}
			return res.status(400).json({ message: "User already exists" });
		}

		// Nếu chưa tồn tại, tạo người dùng mới
		const user = await User.create({ name, email, password });

		// Authenticate
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


// login thông thuong
export const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });

		if (user) {
			// Kiểm tra xem người dùng đã đăng nhập bằng Google chưa
			if (user.googleId) {
				return res.status(400).json({ message: "This email is registered with Google. Please use Google login." });
			}

			// Kiểm tra mật khẩu
			if (await user.comparePassword(password)) {
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
	if (req.isAuthenticated()) {
		res.json(req.user); // Trả về thông tin người dùng nếu đã xác thực
	} else {
		res.status(401).json({ message: "Unauthorized" }); // Trả về lỗi nếu chưa xác thực
	}
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