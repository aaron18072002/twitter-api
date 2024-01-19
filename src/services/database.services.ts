import { Collection, Db, MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';
import User from '~/models/schemas/User.schema';
import RefreshToken from '~/models/schemas/RefreshTokens.schema';
import Follower from '~/models/schemas/Followers.schema';
import Tweet from '~/models/schemas/Tweets.schema';
import Hashtag from '~/models/schemas/Hashtags.schema';
import Bookmark from '~/models/schemas/Bookmarks.schema';
import { envConfig } from '~/constants/config';

dotenv.config();

const uri = `mongodb+srv://${envConfig.DB_USERNAME}:${envConfig.DB_PASSWORD}@twitter.7yoruyn.mongodb.net/?retryWrites=true&w=majority`;

class DatabaseService {
    private client: MongoClient;
    private db: Db;
    constructor() {
        // Create a MongoClient with a MongoClientOptions object to set the Stable API version
        this.client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        });
        this.db = this.client.db(envConfig.DB_NAME);
    }

    async connect() {
        try {
            // Connect the client to the server	(optional starting in v4.7)
            await this.client.connect();
            // Send a ping to confirm a successful connection
            await this.db.command({ ping: 1 });
            console.log('Pinged your deployment. You successfully connected to MongoDB!');
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    get user(): Collection<User> {
        return this.db.collection(envConfig.DB_USERS_COLLECTION as string);
    }

    get refreshToken(): Collection<RefreshToken> {
        return this.db.collection(envConfig.DB_REFRESH_TOKENS_COLLECTION as string);
    }

    get follower(): Collection<Follower> {
        return this.db.collection(envConfig.DB_FOLLOWERS_COLLECTION as string);
    }

    get tweets(): Collection<Tweet> {
        return this.db.collection(envConfig.DB_TWEETS_COLLECTION as string);
    }

    get hashtags(): Collection<Hashtag> {
        return this.db.collection(envConfig.DB_HASHTAGS_COLLECTION as string);
    }

    get bookmarks(): Collection<Bookmark> {
        return this.db.collection(envConfig.DB_BOOKMARKS_COLLECTION as string);
    }
}

const databaseService = new DatabaseService();

export default databaseService;
