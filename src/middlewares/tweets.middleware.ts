import { NextFunction, Request, Response } from 'express';
import { check, checkSchema } from 'express-validator';
import { isEmpty } from 'lodash';
import { ObjectId, WithId } from 'mongodb';
import { MediaTypes, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enums';
import httpStatus from '~/constants/httpStatus';
import { tweetMessages, userMessages } from '~/constants/messages';
import { ErrorWithStatus } from '~/models/Errors';
import Tweet from '~/models/schemas/Tweets.schema';
import databaseService from '~/services/database.services';
import { wrapRequestHandler } from '~/utils/handlers';
import { validate } from '~/utils/validation';

export const createTweetValidator = validate(
    checkSchema(
        {
            type: {
                isIn: {
                    options: [
                        Object.values(TweetType).filter((value) => typeof value === 'number'),
                    ], // [0,1,2,3]
                    errorMessage: tweetMessages.TYPE_IS_INVALID,
                },
            },
            audience: {
                isIn: {
                    options: [
                        Object.values(TweetAudience).filter((value) => typeof value === 'number'),
                    ], // [0.1]
                    errorMessage: tweetMessages.AUDIENCE_IS_INVALID,
                },
            },
            parent_id: {
                custom: {
                    options: (value, { req }) => {
                        const type = req.body.type;
                        // Nếu `type` là retweet, comment, quotetweet thì 'parent_id' phải là 'tweet_id' của tweet cha
                        if (
                            [TweetType.Comment, TweetType.QuoteTweet, TweetType.Retweet].includes(
                                type,
                            ) &&
                            !ObjectId.isValid(value)
                        ) {
                            throw new Error(tweetMessages.PARENT_ID_MUST_BE_VALID);
                        }
                        // Nếu `type` là tweet thì `parent_id` phải là null
                        if (type === TweetType.Tweet && value !== null) {
                            throw new Error(tweetMessages.PARENT_ID_MUST_BE_NULL);
                        }
                        return true;
                    },
                },
            },
            content: {
                isString: true,
                custom: {
                    options: (value, { req }) => {
                        const type = req.body.type;
                        const hashtags = req.body.hashtags as string[];
                        const mentions = req.body.mentions as string[];
                        // type là retweet thì content = """
                        if (type === TweetType.Retweet && value !== '') {
                            throw new Error(tweetMessages.CONTENT_MUST_BE_EMPTY);
                        }
                        // type là comment,quotetweet,tweet và không có hastags hay mentions thì content không được rỗng
                        if (
                            type === TweetType.Retweet &&
                            isEmpty(hashtags) &&
                            isEmpty(mentions) &&
                            value === ''
                        ) {
                            throw new Error(tweetMessages.CONTENT_MUST_BE_NON_EMPTY_STRING);
                        }
                        return true;
                    },
                },
            },
            hashtags: {
                isArray: true,
                custom: {
                    options: (value) => {
                        if (!value.every((item: any) => typeof item === 'string')) {
                            throw new Error(tweetMessages.HASHTAGS_MUST_BE_A_STRING_ARRAY);
                        }
                        return true;
                    },
                },
            },
            mentions: {
                isArray: true,
                custom: {
                    options: (value) => {
                        if (value.some((item: any) => !ObjectId.isValid(item))) {
                            throw new Error(tweetMessages.MENTIONS_MUST_BE_A_USER_ID_ARR);
                        }
                        return true;
                    },
                },
            },
            medias: {
                isArray: true,
                custom: {
                    options: (value) => {
                        if (
                            value.some(
                                (item: any) =>
                                    typeof item.url !== 'string' ||
                                    ![MediaTypes.Image, MediaTypes.Video].includes(item.type),
                            )
                        ) {
                            throw new Error(tweetMessages.MEDIAS_MUST_BE_A_MEDIA_ARRAY);
                        }
                        return true;
                    },
                },
            },
        },
        ['body'],
    ),
);

export const tweetIdValidator = validate(
    checkSchema(
        {
            tweet_id: {
                custom: {
                    options: async (value, { req }) => {
                        if (!ObjectId.isValid(value)) {
                            throw new ErrorWithStatus({
                                message: tweetMessages.INVALID_TWEET_ID,
                                status: httpStatus.BAD_REQUEST,
                            });
                        }
                        const tweet = (
                            await databaseService.tweets
                                .aggregate<Tweet>([
                                    {
                                        $match: {
                                            _id: new ObjectId('65a15a87865d070e40653cdc'),
                                        },
                                    },
                                    {
                                        $lookup: {
                                            from: 'hashtags',
                                            localField: 'hashtags',
                                            foreignField: '_id',
                                            as: 'hashtags',
                                        },
                                    },
                                    {
                                        $lookup: {
                                            from: 'users',
                                            localField: 'mentions',
                                            foreignField: '_id',
                                            as: 'mentions',
                                        },
                                    },
                                    {
                                        $addFields: {
                                            mentions: {
                                                $map: {
                                                    input: '$mentions',
                                                    as: 'mention',
                                                    in: {
                                                        _id: '$$mention._id',
                                                        name: '$$mention.name',
                                                        username: '$$mention.username',
                                                        email: '$$mention.email',
                                                    },
                                                },
                                            },
                                        },
                                    },
                                    {
                                        $lookup: {
                                            from: 'bookmarks',
                                            localField: '_id',
                                            foreignField: 'tweet_id',
                                            as: 'bookmarks',
                                        },
                                    },
                                    {
                                        $lookup: {
                                            from: 'tweets',
                                            localField: '_id',
                                            foreignField: 'parent_id',
                                            as: 'tweet_children',
                                        },
                                    },
                                    {
                                        $addFields: {
                                            bookmarks: {
                                                $size: '$bookmarks',
                                            },
                                            retweet_count: {
                                                $size: {
                                                    $filter: {
                                                        input: '$tweet_children',
                                                        as: 'item',
                                                        cond: {
                                                            $eq: ['$$item.type', 2],
                                                        },
                                                    },
                                                },
                                            },
                                            quote_count: {
                                                $size: {
                                                    $filter: {
                                                        input: '$tweet_children',
                                                        as: 'item',
                                                        cond: {
                                                            $eq: ['$$item.type', 3],
                                                        },
                                                    },
                                                },
                                            },
                                            views: {
                                                $add: ['$user_views', '$guest_views'],
                                            },
                                        },
                                    },
                                    {
                                        $project: {
                                            tweet_children: 0,
                                        },
                                    },
                                ])
                                .toArray()
                        )[0];
                        // const tweet = await databaseService.tweets.findOne({
                        //     _id: new ObjectId(value),
                        // });
                        (req as Request).tweet = tweet;
                        if (tweet === null) {
                            throw new ErrorWithStatus({
                                message: tweetMessages.TWEET_NOT_FOUND,
                                status: httpStatus.NOT_FOUND,
                            });
                        }
                    },
                },
            },
        },
        ['body', 'params'],
    ),
);

export const audienceValidator = wrapRequestHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const tweet = req.tweet;
        if (tweet?.audience === TweetAudience.TwitterCircle) {
            // Nếu người xem chưa đăng nhập
            if (!req.decoded_authorization) {
                throw new ErrorWithStatus({
                    message: userMessages.ACCESS_TOKEN_IS_REQUIRED,
                    status: httpStatus.UNAUTHORIZED,
                });
            }
            const { user_id } = req.decoded_authorization;
            // Kiểm tra xem tác giả có bị ban hay xóa không
            const author = await databaseService.user.findOne({ _id: new ObjectId(tweet.user_id) });
            if (author === null || author.verify === UserVerifyStatus.Banned) {
                throw new ErrorWithStatus({
                    message: userMessages.USER_NOT_FOUND,
                    status: httpStatus.NOT_FOUND,
                });
            }
            // Kiểm tra xem người xem có nằm trong list twitter_circle
            // của tác giả không và người xem có phải là tác giả hay không
            const isInTwitterCircle = author.twitter_circle.some((value) => value.equals(user_id));
            if (!isInTwitterCircle && !author._id.equals(user_id)) {
                throw new ErrorWithStatus({
                    message: tweetMessages.TWEET_IS_NOT_PUBLIC_FOR_YOU,
                    status: httpStatus.FORBIDDEN,
                });
            }
        }
        next();
    },
);
