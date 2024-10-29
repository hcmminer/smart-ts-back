import express from 'express';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import {generateTokens, setCookies} from "../lib/auth.utils.js";
import User from "../models/user.model.js"; // Giả sử bạn có model User ở đây
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const router = express.Router();

async function getUserData(access_token) {
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);
    const data = await response.json();
    return data; // Trả về data để sử dụng
}

/* GET home page. */
router.get('/', async function(req, res, next) {
    const code = req.query.code;

    console.log("code>>>>>>>", code);
    try {
        const redirectURL = "http://127.0.0.1:5000/api/oauth"
        const oAuth2Client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            redirectURL
        );
        const r = await oAuth2Client.getToken(code);
        await oAuth2Client.setCredentials(r.tokens);
        console.info('Tokens acquired.');

        const user = oAuth2Client.credentials;
        console.log('credentials', user);

        // Lấy thông tin người dùng từ Google
        const userData = await getUserData(user.access_token);
        const { email, name } = userData;

        // Kiểm tra xem người dùng đã tồn tại trong DB chưa
        let existingUser = await User.findOne({ email });
        if (!existingUser) {
            // Nếu chưa tồn tại, tạo người dùng mới
            existingUser = await User.create({ email, name }); // Không lưu password
        }

        // Có thể tạo JWT hoặc thực hiện các thao tác khác với existingUser ở đây
        const { accessToken, refreshToken } = generateTokens(user._id);
        setCookies(res, accessToken, refreshToken);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });

    } catch (err) {
        console.log('Error logging in with OAuth2 user', err);
    }

    res.redirect(303, 'http://localhost:5173/');
});

// Route để lấy URL đăng nhập Google
router.post('/google/login', async function(req, res, next) {
    res.header("Access-Control-Allow-Origin", 'http://localhost:5173');
    res.header("Access-Control-Allow-Credentials", 'true');
    res.header("Referrer-Policy", "no-referrer-when-downgrade");
    const redirectURL = 'http://127.0.0.1:5000/api/oauth';

    const oAuth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectURL
    );

    const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/userinfo.profile openid',
        prompt: 'consent'
    });

    res.json({ url: authorizeUrl });
});

export default router;
