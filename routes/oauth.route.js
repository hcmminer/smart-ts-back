import express from 'express';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import { generateTokens, setCookies } from "../lib/auth.utils.js";
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
        const redirectURL = "http://127.0.0.1:5000/api/oauth";
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
        const { email, name, sub: googleId } = userData; // Lấy googleId từ sub

        // Kiểm tra xem người dùng đã tồn tại trong DB chưa
        let existingUser = await User.findOne({ email });
        if (!existingUser) {
            // Nếu chưa tồn tại, tạo người dùng mới mà không cần password
            existingUser = await User.create({ email, name, googleId }); // Không lưu password
        }

        // Tạo JWT hoặc thực hiện các thao tác khác với existingUser ở đây
        const { accessToken, refreshToken } = generateTokens(existingUser._id); // Đảm bảo sử dụng existingUser._id
        setCookies(res, accessToken, refreshToken);

        // Gửi phản hồi JSON
        return res.json({
            _id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role, // Có thể cần xác định role của người dùng
        });

    } catch (err) {
        console.log('Error logging in with OAuth2 user', err);
        return res.status(500).json({ message: 'Internal server error' }); // Gửi thông báo lỗi nếu có
    }

    // Chỉ gọi res.redirect nếu bạn không gửi JSON
    // res.redirect(303, 'http://localhost:5173/');
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
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
            'openid'
        ],
        prompt: 'consent'
    });

    res.json({ url: authorizeUrl });
});

export default router;
