import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import logger from "morgan"
import authRoutes from "./routes/auth.route.js";
import oauthRoutes from "./routes/oauth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";

import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";

// Load environment variables
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const app = express();
const PORT = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.options('*',function(req,res,next){
	res.header("Access-Control-Allow-Origin", 'http://localhost:5173');
	res.header("Access-Control-Allow-Credentials", "true");
	res.header("Access-Control-Allow-Headers", ['X-Requested-With','content-type','credentials']);
	res.header('Access-Control-Allow-Methods', 'GET,POST');
	res.status(200);
	next()
})

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// CORS configuration


// Define routes
app.use("/api/auth", authRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);

// Start server and connect to database
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
	connectDB();
});
