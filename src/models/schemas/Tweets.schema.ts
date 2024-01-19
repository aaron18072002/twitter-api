import { MediaTypes, TweetAudience, TweetType } from './../../constants/enums';
import { ObjectId } from 'mongodb';

interface TweetConstructerType {
    _id?: ObjectId;
    user_id: ObjectId;
    type: TweetType;
    audience: TweetAudience;
    content: string;
    parent_id: null | string; // Nếu là tweet gốc thì là null
    hashtags: ObjectId[];
    mentions: string[];
    medias: MediaTypes[];
    guest_views?: number;
    user_views?: number;
    created_at?: Date;
    updated_at?: Date;
}

export default class Tweet {
    _id: ObjectId;
    user_id: ObjectId;
    type: TweetType;
    audience: TweetAudience;
    content: string;
    parent_id: null | ObjectId; // Nếu là tweet gốc thì là null
    hashtags: ObjectId[];
    mentions: ObjectId[];
    medias: MediaTypes[];
    guest_views: number;
    user_views: number;
    created_at: Date;
    updated_at: Date;
    constructor({
        _id,
        user_id,
        type,
        audience,
        content,
        parent_id,
        hashtags,
        mentions,
        medias,
        guest_views,
        user_views,
        created_at,
        updated_at,
    }: TweetConstructerType) {
        this._id = _id || new ObjectId();
        this.user_id = user_id;
        this.type = type;
        this.audience = audience;
        this.content = content;
        this.parent_id = parent_id ? new ObjectId(parent_id) : null;
        this.hashtags = hashtags;
        this.mentions = mentions.map((mention) => new ObjectId(mention));
        this.medias = medias;
        this.guest_views = guest_views || 0;
        this.user_views = user_views || 0;
        this.created_at = created_at || new Date();
        this.updated_at = updated_at || new Date();
    }
}
