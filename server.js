import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import GoogleStrategy from "passport-google-oauth2";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";

import { connectDB } from "./lib/db.js";
import User from "./models/user.model.js";

const nodeEnv = process.env.NODE_ENV;

dotenv.config({path: `.env.${nodeEnv}`});

const app = express();
const PORT = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173"; // Ensure CLIENT_URL is set correctly

app.use(cors({
	origin: clientUrl,
	methods: "GET,POST,PUT,DELETE",
	credentials: true
}));

app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: true,
	cookie: { secure: process.env.NODE_ENV === "production" } // Ensure cookies are secure in production
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
	clientID: process.env.GOOGLE_CLIENT_ID,
	clientSecret: process.env.GOOGLE_CLIENT_SECRET,
	callbackURL: `${clientUrl}/api/auth/google/callback` // Ensure callback URL matches with frontend
}, async (accessToken, refreshToken, profile, done) => {
	try {
		let user = await User.findOne({ googleId: profile.id });
		if (!user) {
			user = await User.create({
				googleId: profile.id,
				name: profile.displayName,
				email: profile.emails[0].value
			});
		}
		done(null, user);
	} catch (error) {
		done(error, null);
	}
}));

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
	try {
		const user = await User.findById(id);
		done(null, user);
	} catch (error) {
		done(error, null);
	}
});

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/oauth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
	connectDB();
});
