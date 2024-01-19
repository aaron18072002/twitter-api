import { ParamsDictionary } from 'express-serve-static-core';
import { NextFunction, Request, Response } from 'express';
import { BookmarkTweetReqBody } from '~/models/requests/Bookmark.reques';
import { TokenPayload } from '~/models/requests/User.requests';
import bookmarkServie from '~/services/bookmarks.services';
import { bookmarkMessages } from '~/constants/messages';

export const bookmarkTweetController = async (
    req: Request<ParamsDictionary, any, BookmarkTweetReqBody>,
    res: Response,
    next: NextFunction,
) => {
    const { tweet_id } = req.body;
    const { user_id } = req.decoded_authorization as TokenPayload;
    const result = await bookmarkServie.bookmarkTweet(user_id, tweet_id);
    return res.status(200).json({
        msg: bookmarkMessages.BOOKMARK_SUCCESSFULLY,
        data: result,
    });
};

export const unbookmarkTweetController = async (
    req: Request<ParamsDictionary, any, BookmarkTweetReqBody>,
    res: Response,
    next: NextFunction,
) => {
    const { tweet_id } = req.params;
    const { user_id } = req.decoded_authorization as TokenPayload;
    await bookmarkServie.unbookmarkTweet(user_id, tweet_id);
    return res.status(200).json({
        msg: bookmarkMessages.UNBOOKMARK_SUCCESSFULLY,
    });
};
