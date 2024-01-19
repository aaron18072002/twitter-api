import express from 'express';
import {
    bookmarkTweetController,
    unbookmarkTweetController,
} from '~/controllers/bookmarks.controller';
import { tweetIdValidator } from '~/middlewares/tweets.middleware';
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';

const router = express.Router();

/*
  method: POST
  router: /bookmarks/
  header: { Authorization: <access_token> }
  body: { tweet_id }
*/
router.post(
    '/',
    accessTokenValidator,
    verifiedUserValidator,
    tweetIdValidator,
    wrapRequestHandler(bookmarkTweetController),
);

/*
  method: DELETE
  router: /bookmarks/tweet/:tweet_id
  header: { Authorization: <access_token> }
*/
router.delete(
    '/tweet/:tweet_id',
    accessTokenValidator,
    verifiedUserValidator,
    tweetIdValidator,
    wrapRequestHandler(unbookmarkTweetController),
);

export default router;
