import { config } from 'dotenv';
import argv from 'minimist';

const options = argv(process.argv.slice(2));
console.log(options);

export const isProduction = Boolean(options.production);

config({
    path: isProduction ? '.env.production' : '.env',
});

export const envConfig = {
    PORT: process.env.PORT || 8000,
    HOST: process.env.HOST as string,
    DB_NAME: process.env.DB_NAME as string,
    DB_USERNAME: process.env.DB_USERNAME as string,
    DB_PASSWORD: process.env.DB_PASSWORD as string,
    DB_USERS_COLLECTION: process.env.DB_USERS_COLLECTION as string,
    DB_REFRESH_TOKENS_COLLECTION: process.env.DB_REFRESH_TOKENS_COLLECTION as string,
    DB_FOLLOWERS_COLLECTION: process.env.DB_FOLLOWERS_COLLECTION as string,
    DB_TWEETS_COLLECTION: process.env.DB_TWEETS_COLLECTION as string,
    DB_HASHTAGS_COLLECTION: process.env.DB_HASHTAGS_COLLECTION as string,
    DB_BOOKMARKS_COLLECTION: process.env.DB_BOOKMARKS_COLLECTION as string,

    HASH_PASSWORD_SECRET_KEY: process.env.HASH_PASSWORD_SECRET_KEY as string,

    JWT_SECRET_ACCESS_TOKEN_KEY: process.env.JWT_SECRET_ACCESS_TOKEN_KEY as string,
    JWT_SECRET_REFRESH_TOKEN_KEY: process.env.JWT_SECRET_REFRESH_TOKEN_KEY as string,
    JWT_SECRET_EMAIL_VERIFY_TOKEN_KEY: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN_KEY as string,
    JWT_SECRET_FORGOT_PASSWORD_TOKEN_KEY: process.env
        .JWT_SECRET_FORGOT_PASSWORD_TOKEN_KEY as string,

    ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN as string,
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN as string,
    EMAIL_VERIFY_TOKEN_EXPIRES_IN: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN as string,
    FORGOT_PASSWORD_TOKEN_EXPIRES_IN: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN as string,

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI as string,
    CLIENT_REDIRECT_URL: process.env.CLIENT_REDIRECT_URL as string,
    CLIENT_URL: process.env.CLIENT_URL,
};
