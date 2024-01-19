import { NextFunction, Request, Response } from 'express';
import { tweetMessages } from '~/constants/messages';
import { TweetReqBody } from '~/models/requests/Tweet.requests';
import { TokenPayload } from '~/models/requests/User.requests';
import Tweet from '~/models/schemas/Tweets.schema';
import tweetsService from '~/services/tweets.services';

export const createTweetController = async (req: Request, res: Response, next: NextFunction) => {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const result = await tweetsService.createTweet(user_id, req.body as TweetReqBody);
    return res.status(200).json({
        msg: tweetMessages.CREATE_TWEET_SUCCESS,
        data: result,
    });
};

export const getTweetController = async (req: Request, res: Response, next: NextFunction) => {
    const views = await tweetsService.increaseViewsOnTweet(
        (req.tweet as Tweet)._id,
        req.decoded_authorization?.user_id,
    );
    const tweet = {
        ...req.tweet,
        guest_views: views.guest_views,
        user_views: views.user_views,
    };
    return res.status(200).json({
        msg: 'Get tweet successfully',
        data: tweet,
    });
};
