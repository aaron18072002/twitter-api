import { MediaTypes, TweetAudience, TweetType } from '~/constants/enums';

export interface TweetReqBody {
    type: TweetType;
    audience: TweetAudience;
    content: string;
    parent_id: null | string;
    hashtags: string[];
    mentions: string[];
    medias: MediaTypes[];
}
