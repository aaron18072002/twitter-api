import express from 'express';
import { createTweetController, getTweetController } from '~/controllers/tweets.controller';
import {
    audienceValidator,
    createTweetValidator,
    tweetIdValidator,
} from '~/middlewares/tweets.middleware';
import {
    accessTokenValidator,
    isUserLoggedInValidator,
    verifiedUserValidator,
} from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';

const router = express.Router();

/*
  Desc: Create tweet
  Method: post
  route: /tweets/
  body : { TweetReqBody }
  header: { Authorization: bearer <access_token> }
 */
router.post(
    '/',
    accessTokenValidator,
    verifiedUserValidator,
    createTweetValidator,
    wrapRequestHandler(createTweetController),
);

/*
  Desc: Get tweet detail
  Method: GET
  route: /tweets/:tweet_id
  header: { Authorization?: bearer <access_token> }
 */
router.get(
    '/:tweet_id',
    tweetIdValidator,
    isUserLoggedInValidator(accessTokenValidator),
    isUserLoggedInValidator(verifiedUserValidator),
    audienceValidator,
    wrapRequestHandler(getTweetController),
);

export default router;
