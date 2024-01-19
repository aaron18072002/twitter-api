export enum UserVerifyStatus {
    Unverified,
    Verified,
    Banned,
}

export enum TokenType {
    AccessToken,
    RefreshToken,
    ForgotPasswordToken,
    EmailVerifyToken,
}

export enum MediaTypes {
    Image,
    Video,
}

export enum TweetType {
    Tweet,
    Retweet,
    Comment,
    QuoteTweet,
}

export enum TweetAudience {
    Everyone,
    TwitterCircle,
}
