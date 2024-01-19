import { NextFunction, Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';
import { envConfig } from '~/constants/config';
import { UserVerifyStatus } from '~/constants/enums';
import httpStatus from '~/constants/httpStatus';
import { userMessages } from '~/constants/messages';
import {
    ChangePasswordReqBody,
    FollowReqBody,
    ForgotPassswordReqBody,
    LoginReqBody,
    LogoutReqBody,
    RefreshTokenReqBody,
    RegisterReqBody,
    ResetPasswordReqBody,
    TokenPayload,
    UnfollowReqParams,
    UpdateMeReqBody,
    VerifyForgotPassswordReqBody,
} from '~/models/requests/User.requests';
import User from '~/models/schemas/User.schema';
import databaseService from '~/services/database.services';
import usersServies from '~/services/users.servies';

export const loginController = async (
    req: Request<ParamsDictionary, any, LoginReqBody>,
    res: Response,
): Promise<Response> => {
    const user = req.user as User;
    // throw new Error('Cant implement');
    const user_id = user._id.toString();
    const result = await usersServies.login({ user_id, verify: user.verify });
    return res.status(200).json({
        msg: userMessages.LOGIN_SUCCESS,
        data: result,
    });
};

export const oauthGoogleController = async (req: Request, res: Response, next: NextFunction) => {
    const { code } = req.query;
    const result = await usersServies.oauthGoogle(code as string);
    const urlRedirect = `${envConfig.CLIENT_REDIRECT_URL}?access_token=${result.access_token}&refresh_token=${result.refresh_token}&new_user=${result.newUser}&verify=${result.verify}`;
    return res.redirect(urlRedirect);
};

export const registerController = async (
    req: Request<ParamsDictionary, any, RegisterReqBody>,
    res: Response,
): Promise<Response> => {
    const result = await usersServies.register(req.body);
    return res.status(200).json({
        msg: userMessages.REGISTER_SUCCESS,
        data: result,
    });
};

export const logoutController = async (
    req: Request<ParamsDictionary, any, LogoutReqBody>,
    res: Response,
): Promise<Response> => {
    const refresh_token = req.body.refresh_token;
    const result = await usersServies.logout(refresh_token);
    return res.status(200).json({
        msg: userMessages.LOGOUT_SUCCESS,
        result,
    });
};

export const emailVerifyTokenController = async (
    req: Request,
    res: Response,
): Promise<Response> => {
    const { user_id } = req.decoded_email_verify_token as TokenPayload;
    const user = await databaseService.user.findOne({ _id: new ObjectId(user_id) });
    if (!user) {
        return res.status(httpStatus.NOT_FOUND).json({
            msg: userMessages.USER_NOT_FOUND,
        });
    }
    if (user.email_verify_token === '') {
        return res.status(200).json({
            msg: userMessages.EMAIL_ALREADY_VERIFIED_BEFORE,
        });
    }

    const result = await usersServies.verifyEmail(user_id);

    return res.status(200).json({
        msg: userMessages.EMAIL_VERIFY_SUCCEED,
        result,
    });
};

export const resendEmailVerifyTokenController = async (
    req: Request,
    res: Response,
): Promise<Response> => {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const user = await databaseService.user.findOne({ _id: new ObjectId(user_id) });
    if (user === null) {
        return res.status(httpStatus.NOT_FOUND).json({
            msg: userMessages.USER_NOT_FOUND,
        });
    }
    if (user.verify === UserVerifyStatus.Verified) {
        return res.status(200).json({
            msg: userMessages.EMAIL_ALREADY_VERIFIED_BEFORE,
        });
    }

    const result = await usersServies.resendVerifyEmail(user_id);

    return res.status(200).json({
        msg: userMessages.RESEND_EMAIL_VERIFY_SUCCEED,
        result,
    });
};

export const forgotPasswordController = async (
    req: Request<ParamsDictionary, any, ForgotPassswordReqBody>,
    res: Response,
): Promise<Response> => {
    const { _id, verify } = req.user as User;
    const result = await usersServies.forgotPassword({
        user_id: (_id as ObjectId).toString(),
        verify,
    });

    return res.status(200).json({
        result,
    });
};

export const verifyForgotPasswordController = async (
    req: Request<ParamsDictionary, any, VerifyForgotPassswordReqBody>,
    res: Response,
): Promise<Response> => {
    return res.status(200).json({
        msg: userMessages.VERIFY_FORGOT_PASSWORD_SUCCESS,
    });
};

export const resetPasswordController = async (
    req: Request<ParamsDictionary, any, ResetPasswordReqBody>,
    res: Response,
): Promise<Response> => {
    const { _id } = req.user as User;
    const { password } = req.body;

    const result = await usersServies.resetPassword(_id, password);

    return res.status(200).json(result);
};

export const getMeController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<Response> => {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const user = await usersServies.getMe(user_id);

    return res.status(200).json({
        msg: userMessages.GET_ME_SUCCESS,
        data: user,
    });
};

export const getProfileController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<Response> => {
    const { username } = req.params;
    const user = await usersServies.getProfile(username);

    return res.status(200).json({
        msg: userMessages.GET_PROFILE_SUCCESS,
        data: user,
    });
};

export const updateMeController = async (
    req: Request<ParamsDictionary, any, UpdateMeReqBody>,
    res: Response,
    next: NextFunction,
) => {
    const { user_id } = req.decoded_authorization as TokenPayload;
    console.log(req.body);
    const result = await usersServies.updateMe(user_id, req.body);

    return res.status(200).json(result);
};

export const followController = async (
    req: Request<ParamsDictionary, any, FollowReqBody>,
    res: Response,
    next: NextFunction,
): Promise<Response> => {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const { followed_user_id } = req.body;
    const result = await usersServies.follow(user_id, followed_user_id);

    return res.status(200).json(result);
};

export const unfollowController = async (
    // req: Request<UnfollowReqParams>,
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<Response> => {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const { unfollow_user_id } = req.params;
    const reuslt = await usersServies.unfollow(user_id, unfollow_user_id);

    return res.status(200).json(reuslt);
};

export const changePasswordController = async (
    req: Request<ParamsDictionary, any, ChangePasswordReqBody>,
    res: Response,
    next: NextFunction,
): Promise<Response> => {
    const { user_id } = req.decoded_authorization as TokenPayload;
    const { password } = req.body;
    const result = await usersServies.changePassword(user_id, password);

    return res.status(200).json(result);
};

export const refreshTokenController = async (
    req: Request<ParamsDictionary, any, RefreshTokenReqBody>,
    res: Response,
    next: NextFunction,
): Promise<Response> => {
    const { refresh_token } = req.body;
    const { user_id, verify, exp } = req.decoded_refresh_token as TokenPayload;
    const result = await usersServies.refreshToken({ user_id, verify, refresh_token, exp });

    return res.status(200).json({
        msg: userMessages.REFRESH_TOKEN_SUCCESS,
        data: result,
    });
};
