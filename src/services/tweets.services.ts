import { TweetReqBody } from '~/models/requests/Tweet.requests';
import databaseService from './database.services';
import Tweet from '~/models/schemas/Tweets.schema';
import { ObjectId, WithId } from 'mongodb';
import Hashtag from '~/models/schemas/Hashtags.schema';

class TweetsService {
    async checkAndCreateHashtags(hashtags: string[]) {
        const hashtagsDocument = await Promise.all(
            hashtags.map(async (hashtag) => {
                return await databaseService.hashtags.findOneAndUpdate(
                    { name: hashtag },
                    {
                        $setOnInsert: new Hashtag({
                            name: hashtag,
                        }),
                    },
                    {
                        upsert: true,
                        returnDocument: 'after',
                    },
                );
            }),
        );
        return hashtagsDocument.map((hashtag) => (hashtag.value as WithId<Hashtag>)._id);
    }

    async createTweet(user_id: string, body: TweetReqBody) {
        const hashtags = await this.checkAndCreateHashtags(body.hashtags);
        await databaseService.tweets.insertOne(
            new Tweet({
                audience: body.audience,
                content: body.content,
                type: body.type,
                parent_id: body.parent_id,
                hashtags: hashtags,
                mentions: body.mentions,
                user_id: new ObjectId(user_id),
                medias: body.medias,
            }),
        );
        const result = await databaseService.tweets.findOne({ user_id: new ObjectId(user_id) });
        return result;
    }

    async increaseViewsOnTweet(tweet_id: ObjectId, user_id?: string) {
        const inc = user_id ? { user_views: 1 } : { guest_views: 1 };
        const result = await databaseService.tweets.findOneAndUpdate(
            {
                _id: tweet_id,
            },
            {
                $inc: inc,
            },
            {
                returnDocument: 'after',
                projection: {
                    guest_views: 1,
                    user_views: 1,
                },
            },
        );
        return result.value as WithId<{
            guest_views: number;
            user_views: number;
        }>;
    }
}

const tweetsService = new TweetsService();
export default tweetsService;
