import { ParamsDictionary } from 'express-serve-static-core';
import { JwtPayload } from 'jsonwebtoken';
import { UserVerifyStatus } from '~/constants/enums';

export interface UpdateMeReqBody {
    name?: string;
    date_of_birth?: string;
    bio?: string;
    location?: string;
    website?: string;
    username?: string;
    avatar?: string;
    cover_photo?: string;
}

export interface FollowReqBody {
    followed_user_id: string;
}

export interface RegisterReqBody {
    name: string;
    email: string;
    password: string;
    confirm_password: string;
    day_of_birth: string;
}

export interface LoginReqBody {
    email: string;
    password: string;
}

export interface LogoutReqBody {
    refresh_token: string;
}

export interface RefreshTokenReqBody {
    refresh_token: string;
}

export interface ForgotPassswordReqBody {
    email: string;
}

export interface UnfollowReqParams extends ParamsDictionary {
    unfollow_user_id: string;
}

export interface ChangePasswordReqBody {
    old_password: string;
    password: string;
    confirm_password: string;
}

export interface VerifyForgotPassswordReqBody {
    forgot_password_token: string;
}

export interface ResetPasswordReqBody {
    forgot_password_token: string;
    password: string;
    confirm_password: string;
}

export interface TokenPayload extends JwtPayload {
    user_id: string;
    token: string;
    verify: UserVerifyStatus;
    exp: number;
}
