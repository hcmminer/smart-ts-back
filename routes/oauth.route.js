import express from 'express';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const router = express.Router();

async function getUserData(access_token) {

    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);

    //console.log('response',response);
    const data = await response.json();
    console.log('data',data);
    //data {
    //   sub: '111643656602272316225',
    //   name: 'Lam Nguyen',
    //   given_name: 'Lam',
    //   family_name: 'Nguyen',
    //   picture: 'https://lh3.googleusercontent.com/a/ACg8ocIzLekXgXrfdGvAfDYslWgvjBVSLV3WnmwCbWKjDxHU8CG9Fg=s96-c'
    // }
}



/* GET home page. */
router.get('/', async function(req, res, next) {

    const code = req.query.code;

    console.log("code>>>>>>>",code);
    try {
        const redirectURL = "http://127.0.0.1:5000/api/oauth"
        const oAuth2Client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            redirectURL
        );
        const r =  await oAuth2Client.getToken(code);
        // Make sure to set the credentials on the OAuth2 client.
        await oAuth2Client.setCredentials(r.tokens);
        console.info('Tokens acquired.');
        const user = oAuth2Client.credentials;
        console.log('credentials',user);
        //credentials {
        //   access_token: 'ya29.a0AeDClZB-tG1vfoCiDazux2grqPhWLJuz-jw5PnCYb8saBhYpCzwXI2XiNC-DsA_Vzx41sydbXBwN-_gdUjHGtU09EndRINnbjCUMtxnqJ8jJE3pQ4SE0NeRRsveV_ClDh-BXYnkZD1spAK2U3pVqqa2qnBkLRf3n
        // 7qHmvt0daCgYKAd4SARMSFQHGX2MisaSSppoToVAhBTracbR9YQ0175',
        //   refresh_token: '1//0eYaiE4pWIfptCgYIARAAGA4SNwF-L9Ir8mAKKUMrYrikvxl7aCvGMpfjo6jHSdGx4bakSVEH4hqCJf3rNuLO6OFtYupLEts3ofQ',
        //   scope: 'https://www.googleapis.com/auth/userinfo.profile openid',
        //   token_type: 'Bearer',
        //   id_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImM4OGQ4MDlmNGRiOTQzZGY1M2RhN2FjY2ZkNDc3NjRkMDViYTM5MWYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI1MzA2NTk5
        // ODg0MTktZTNtZ2c0dmUzODNtZXUzYmQzamhocWlvYzI4ZnJrNDQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI1MzA2NTk5ODg0MTktZTNtZ2c0dmUzODNtZXUzYmQzamhocWlvYzI4ZnJrNDQuYXBwcy5nb29nbGV1c2VyY29u
        // dGVudC5jb20iLCJzdWIiOiIxMTE2NDM2NTY2MDIyNzIzMTYyMjUiLCJhdF9oYXNoIjoia05Oc3RLZVNIUE9CLVhIeUxOSUpiUSIsIm5hbWUiOiJMYW0gTmd1eWVuIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNv
        // bS9hL0FDZzhvY0l6TGVrWGdYcmZkR3ZBZkRZc2xXZ3ZqQlZTTFYzV25td0NiV0tqRHhIVThDRzlGZz1zOTYtYyIsImdpdmVuX25hbWUiOiJMYW0iLCJmYW1pbHlfbmFtZSI6Ik5ndXllbiIsImlhdCI6MTczMDE3MTc5MiwiZXhwIjoxNzMwMTc1
        // MzkyfQ.6andSbHXjF4kKM40rL-rH6qgnP3Gt4vIcML9HdqX82KVxtWiR6Tw68e0zBbEscPby906V6q_wQ_Srd4xZcY1keOaxVoIm6Q00sl3EusAOq1EtkmX5rxCruUL9Sny2uqg9fLUNkDEVd2sOkJhQSfqFVHwdDv5uMIGVXVYewcWdg_ZKTiyh
        // Dh-cewN0GmUVdIT0BnlTXgt-9AWKi10sWQ5jtaHxYPJPbL2TuVq-dg-3uTy9Y6DALWMbbSBn_BmhjHez-1De6AKrZcSczK1Qw-H8TPhQy2p6dUg-t_OgpON5SVZnDlMG3ZLpg8IPMP_5iYypwQMpNal6LG4THOxSAKnJQ',
        //   expiry_date: 1730175389847
        // }
        await getUserData(oAuth2Client.credentials.access_token);

    } catch (err) {
        console.log('Error logging in with OAuth2 user', err);
    }

    res.redirect(303, 'http://localhost:5173/');
});

router.post('/google/login', async function(req, res, next) {
    res.header("Access-Control-Allow-Origin", 'http://localhost:5173');
    res.header("Access-Control-Allow-Credentials", 'true');
    res.header("Referrer-Policy","no-referrer-when-downgrade");
    const redirectURL = 'http://127.0.0.1:5000/api/oauth';

    const oAuth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectURL
    );

    // Generate the url that will be used for the consent dialog.
    const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/userinfo.profile  openid ',
        prompt: 'consent'
    });

    res.json({url:authorizeUrl})

});

export default router;
