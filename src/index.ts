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
    res.send('Hello word');
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
