import express from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import cors, { CorsOptions } from 'cors';
import { rateLimit } from 'express-rate-limit';
import usersRouter from './routes/users.routes';
import mediasRouter from './routes/medias.routes';
import staticRouter from './routes/static.routes';
import tweetsRouter from './routes/tweets.routes';
import bookmarksRouter from './routes/bookmarks.routes';
import searchRouter from './routes/search.routes';
import databaseService from './services/database.services';
databaseService.connect();
import dotenv from 'dotenv';
dotenv.config();

import { defaultErrorHandler } from './middlewares/error.middleware';
import { initFolder } from './utils/file';
import { envConfig, isProduction } from './constants/config';

const app = express();

app.use(helmet());
const corsOptions: CorsOptions = {
    origin: isProduction ? envConfig.CLIENT_URL : '*',
};
app.use(cors(corsOptions));
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    // store: ... , // Use an external store for consistency across multiple server instances.
});
app.use(limiter);

const port = envConfig.PORT || 8000;

// Init folder uploads nếu chưa tạo
initFolder();

app.get('/', (req, res) => {
    res.send(`
    -- Chức năng users
    // path: /users/login
    // method: post
    // body: { email, password }

    // path: /users/oauth/google
    // method: get
    // body: { code: string }

    // path: /users/register
    // method: post
    // body: { name, email, password, confirm_password, day_of_birth: ISO8601 }

    // path: /users/logout
    // method: post
    // body: { refresh_token }
    // header.Authorization: Bearer <access_token>

    // path: /users/verify-email
    // method: post
    // body: { email_verify_token }

    // path: /users/resend-verify-email
    // method: post
    // header.Authorization: Bearer <access_token>
    // body: { }

    // path: /users/forgot-password
    // method: post
    // description: Submit email to reset password, sent email to user
    // body: { email }

    // path: /users/verify-forgot-password
    // method: post
    // description: Verify link in email to reset password
    // body: { forgot-password-token }

    // path: /users/reset-password
    // method: post
    // description: Reset password with info form body
    // body: { forgot-password-token, password, confirm_password }

    // path: /users/me
    // method: get
    // description: Get my profile
    // header: { Authorization: Bearer <access_token> }

    // path: /users/:username
    // method: get
    // description: Get user profile
    // params: { username: string }

    // path: /users/me
    // method: patch
    // description: Update my profile
    // header: { Authorization: Bearer <access_token> }
    // body: { UserSchema }

    // path: /users/follow
    // method: post
    // description: Follow user
    // header: { Authorization: Bearer <access_token> }
    // body: { follow_user_id: string }

    // path: /users/:user_id
    // method: delete
    // description: Unfollow user
    // header: { Authorization: Bearer <access_token> }

    // path: /change-password
    // method: put
    // description: Change password
    // header: { Authorization: Bearer <access_token> }
    // body: { old_password, password, confirm_password }

    // path: /refresh-token
    // method: post
    // description: Post refresh token to get new access_token and refresh_token
    // body: { refresh_token }
    `);
});

app.use(bodyParser.json());

app.use('/users', usersRouter);
app.use('/medias', mediasRouter);
app.use('/static', staticRouter);
app.use('/tweets', tweetsRouter);
app.use('/bookmarks', bookmarksRouter);
app.use('/search', searchRouter);

// app.use('/static', express.static(UPLOAD_IMAGES_DIR));

app.use(defaultErrorHandler);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
