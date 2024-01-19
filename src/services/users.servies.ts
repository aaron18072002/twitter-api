import User from '~/models/schemas/User.schema';
import databaseService from './database.services';
import { RegisterReqBody, UpdateMeReqBody } from '~/models/requests/User.requests';
import { hashPassword } from '~/utils/crypto';
import { signToken } from '~/utils/jwt';
import { TokenType, UserVerifyStatus } from '~/constants/enums';
import RefreshToken from '~/models/schemas/RefreshTokens.schema';
import { ObjectId } from 'mongodb';
import { config } from 'dotenv';
import { userMessages } from '~/constants/messages';
import Follower from '~/models/schemas/Followers.schema';
import axios from 'axios';
import { ErrorWithStatus } from '~/models/Errors';
import httpStatus from '~/constants/httpStatus';
import { envConfig } from '~/constants/config';
config();

class UsersServies {
    private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
        return signToken({
            payload: {
                user_id,
                token_type: TokenType.AccessToken,
                verify,
            },
            privateKey: envConfig.JWT_SECRET_ACCESS_TOKEN_KEY as string,
            options: {
                expiresIn: envConfig.ACCESS_TOKEN_EXPIRES_IN,
            },
        });
    }

    private signRefreshToken({
        user_id,
        verify,
        exp,
    }: {
        user_id: string;
        verify: UserVerifyStatus;
        exp?: number;
    }) {
        // if (!exp) {
        //     return signToken({
        //         payload: {
        //             user_id,
        //             token_type: TokenType.RefreshToken,
        //             verify,
        //             exp,
        //         },
        //         privateKey: envConfig.JWT_SECRET_REFRESH_TOKEN_KEY as string,
        //     });
        // }
        return signToken({
            payload: {
                user_id,
                token_type: TokenType.RefreshToken,
                verify,
            },
            privateKey: envConfig.JWT_SECRET_REFRESH_TOKEN_KEY as string,
            options: {
                expiresIn: envConfig.REFRESH_TOKEN_EXPIRES_IN,
            },
        });
    }

    private signEmailVerifyToken({
        user_id,
        verify,
    }: {
        user_id: string;
        verify: UserVerifyStatus;
    }) {
        return signToken({
            payload: {
                user_id,
                token_type: TokenType.EmailVerifyToken,
                verify,
            },
            privateKey: envConfig.JWT_SECRET_EMAIL_VERIFY_TOKEN_KEY as string,
            options: {
                expiresIn: envConfig.EMAIL_VERIFY_TOKEN_EXPIRES_IN,
            },
        });
    }

    private signForgotPasswordToken({
        user_id,
        verify,
    }: {
        user_id: string;
        verify: UserVerifyStatus;
    }) {
        return signToken({
            payload: {
                user_id,
                token_type: TokenType.ForgotPasswordToken,
                verify,
            },
            privateKey: envConfig.JWT_SECRET_FORGOT_PASSWORD_TOKEN_KEY as string,
            options: {
                expiresIn: envConfig.FORGOT_PASSWORD_TOKEN_EXPIRES_IN,
            },
        });
    }

    private signAccessAndRefreshToken({
        user_id,
        verify,
    }: {
        user_id: string;
        verify: UserVerifyStatus;
    }) {
        return Promise.all([
            this.signAccessToken({ user_id, verify }),
            this.signRefreshToken({ user_id, verify }),
        ]);
    }

    private async getOauthGoogleToken(code: string) {
        const body = {
            code,
            client_id: envConfig.GOOGLE_CLIENT_ID,
            client_secret: envConfig.GOOGLE_CLIENT_SECRET,
            redirect_uri: envConfig.GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code',
        };

        const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return data as {
            access_token: string;
            id_token: string;
        };
    }

    private async getOauthGoogleUserInfo(access_token: string, id_token: string) {
        const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
            params: {
                access_token,
                alt: 'json',
            },
            headers: {
                Authorization: `Bearer ${id_token}`,
            },
        });
        return data as {
            email: string;
            picture: string;
            name: string;
            verified_email: boolean;
            id: string;
        };
    }

    async register(payload: RegisterReqBody) {
        const user_id = new ObjectId();
        const email_verify_token = await this.signEmailVerifyToken({
            user_id: user_id.toString(),
            verify: UserVerifyStatus.Unverified,
        });
        await databaseService.user.insertOne(
            new User({
                ...payload,
                _id: user_id,
                email_verify_token,
                password: hashPassword(payload.password),
                day_of_birth: new Date(payload.day_of_birth),
            }),
        );
        const [access_token, refresh_token] = await this.signAccessAndRefreshToken(
            // user_id.toString(),
            {
                user_id: user_id.toString(),
                verify: UserVerifyStatus.Unverified,
            },
        );
        await databaseService.refreshToken.insertOne(
            new RefreshToken({ token: refresh_token, user_id }),
        );
        return {
            access_token,
            refresh_token,
        };
    }

    async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
        const [access_token, refresh_token] = await Promise.all([
            this.signAccessToken({ user_id, verify }),
            this.signRefreshToken({ user_id, verify }),
        ]);
        const refreshToken = await databaseService.refreshToken.findOne({
            user_id: new ObjectId(user_id),
        });
        if (refreshToken === null) {
            await databaseService.refreshToken.insertOne(
                new RefreshToken({ token: refresh_token, user_id: new ObjectId(user_id) }),
            );
        }
        await databaseService.refreshToken.updateOne(
            { user_id: new ObjectId(user_id) },
            { $set: { token: refresh_token } },
        );
        return {
            access_token,
            refresh_token,
        };
    }

    async refreshToken({
        user_id,
        verify,
        refresh_token,
        exp,
    }: {
        user_id: string;
        verify: UserVerifyStatus;
        refresh_token: string;
        exp?: number;
    }) {
        const [new_access_token, new_refresh_token] = await Promise.all([
            this.signAccessToken({ user_id, verify }),
            this.signRefreshToken({ user_id, verify, exp }),
        ]);
        await databaseService.refreshToken.updateOne(
            { user_id: new ObjectId(user_id) },
            {
                $set: {
                    token: new_refresh_token,
                },
            },
        );
        return {
            access_token: new_access_token,
            refresh_token: new_refresh_token,
        };
    }

    async oauthGoogle(code: string) {
        const { access_token, id_token } = await this.getOauthGoogleToken(code);
        const userInfo = await this.getOauthGoogleUserInfo(access_token, id_token);
        if (userInfo.verified_email === false) {
            throw new ErrorWithStatus({
                message: userMessages.GMAIL_NOT_VERIRY,
                status: httpStatus.UNAUTHORIZED,
            });
        }
        // Kiem tra email co trong databse ko
        const user = await databaseService.user.findOne({ email: userInfo.email });
        if (user) {
            // Co thi dang nhap
            const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
                user_id: user._id.toString(),
                verify: user.verify,
            });
            const refreshToken = await databaseService.refreshToken.findOne({
                user_id: user._id,
            });
            if (refreshToken === null) {
                await databaseService.refreshToken.insertOne(
                    new RefreshToken({ token: refresh_token, user_id: user._id }),
                );
            } else {
                await databaseService.refreshToken.updateOne(
                    { user_id: user._id },
                    { $set: { token: refresh_token } },
                );
            }
            return {
                access_token,
                refresh_token,
                newUser: false,
                verify: user.verify,
            };
        } else {
            // Khong co thi dang ky
            const password = Math.random().toString(36).substring(2, 15);
            const { access_token, refresh_token } = await this.register({
                email: userInfo.email,
                name: userInfo.name,
                confirm_password: password,
                password: hashPassword(password),
                day_of_birth: new Date().toISOString(),
            });
            return {
                access_token,
                refresh_token,
                newUser: true,
                verify: UserVerifyStatus.Unverified,
            };
        }
    }

    async logout(refresh_token: string) {
        const result = await databaseService.refreshToken.deleteOne({ token: refresh_token });
        return result;
    }

    async verifyEmail(user_id: string) {
        const [token] = await Promise.all([
            await this.signAccessAndRefreshToken({ user_id, verify: UserVerifyStatus.Verified }),
            // Thời điểm tạo giá trị new Date()
            // Thời điểm mongoDB cập nhật giá trị
            await databaseService.user.updateOne(
                { _id: new ObjectId(user_id) },
                {
                    $set: {
                        verify: UserVerifyStatus.Verified,
                        email_verify_token: '',
                        // updated_at: new Date(),
                    },
                    $currentDate: {
                        updated_at: true,
                    },
                },
            ),
        ]);
        const [access_token, refresh_token] = token;
        await databaseService.refreshToken.updateOne(
            { user_id: new ObjectId(user_id) },
            {
                $set: {
                    token: refresh_token,
                },
                $currentDate: {
                    created_at: true,
                },
            },
        );

        return {
            access_token,
            refresh_token,
        };
    }

    async resendVerifyEmail(user_id: string) {
        const email_verify_token = await this.signEmailVerifyToken({
            user_id,
            verify: UserVerifyStatus.Unverified,
        });

        const result = await databaseService.user.updateOne({ _id: new ObjectId(user_id) }, [
            {
                $set: {
                    email_verify_token,
                    updated_at: '$$NOW',
                },
            },
        ]);
        return result;
    }

    async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
        const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify });
        await databaseService.user.updateOne(
            { _id: new ObjectId(user_id) },
            {
                $set: {
                    forgot_password_token,
                },
                $currentDate: {
                    updated_at: true,
                },
            },
        );

        // gửi email kèm link đến người dùng https://twitter.com/forgot-password?token=token
        console.log('forgot_password_token ', forgot_password_token);

        return {
            msg: userMessages.CHECK_EMAIL_TO_RESET_PASSWORD,
            forgot_password_token,
        };
    }

    async resetPassword(user_id: ObjectId, password: string) {
        const result = await databaseService.user.updateOne(
            {
                _id: user_id,
            },
            {
                $set: {
                    password: hashPassword(password),
                    forgot_password_token: '',
                },
                $currentDate: {
                    updated_at: true,
                },
            },
        );

        return {
            msg: userMessages.RESET_PASSWORD_SUCCESS,
            result,
        };
    }

    async getMe(user_id: string) {
        const user = await databaseService.user.findOne(
            { _id: new ObjectId(user_id) },
            {
                projection: {
                    password: 0,
                    email_verify_token: 0,
                    forgot_password_token: 0,
                },
            },
        );
        return user;
    }

    async getProfile(username: string) {
        const user = await databaseService.user.findOne(
            { name: username },
            {
                projection: {
                    password: 0,
                    email_verify_token: 0,
                    forgot_password_token: 0,
                },
            },
        );
        return user;
    }

    async updateMe(user_id: string, payload: UpdateMeReqBody) {
        const _payload = payload.date_of_birth
            ? { ...payload, day_of_birth: new Date(payload.date_of_birth) }
            : payload;
        const result = await databaseService.user.findOneAndUpdate(
            { _id: new ObjectId(user_id) },
            {
                $set: {
                    ..._payload,
                },
                $currentDate: {
                    updated_at: true,
                },
            },
            {
                returnDocument: 'after',
                projection: {
                    password: 0,
                    email_verify_token: 0,
                    forgot_password_token: 0,
                },
            },
        );
        return {
            msg: userMessages.UPDATE_ME_SUCCESS,
            data: result.value,
        };
    }

    async follow(user_id: string, followed_user_id: string) {
        const follower = await databaseService.follower.findOne({
            user_id: new ObjectId(user_id),
            followed_user_id: new ObjectId(followed_user_id),
        });
        // Nếu chưa follow thì follow không thì trả về msg đã follow rồi
        if (follower === null) {
            const result = await databaseService.follower.insertOne(
                new Follower({
                    user_id: new ObjectId(user_id),
                    followed_user_id: new ObjectId(followed_user_id),
                }),
            );
            return {
                msg: userMessages.FOLLOW_USER_SUCCESS,
                data: result,
            };
        }

        return {
            msg: userMessages.FOLLOWED,
        };
    }

    async unfollow(user_id: string, unfollow_user_id: string) {
        const follower = await databaseService.follower.findOne({
            user_id: new ObjectId(user_id),
            followed_user_id: new ObjectId(unfollow_user_id),
        });
        // Nếu chưa follow thì trả về đã hủy follow rồi :v
        if (follower === null) {
            return {
                msg: userMessages.ALREADY_UNFOLLOWED,
            };
        }
        const result = await databaseService.follower.deleteOne({
            user_id: new ObjectId(user_id),
            followed_user_id: new ObjectId(unfollow_user_id),
        });

        return {
            msg: userMessages.UNFOLLOW_USER_SUCCESS,
            data: result,
        };
    }

    async changePassword(user_id: string, password: string) {
        const result = await databaseService.user.findOneAndUpdate(
            { _id: new ObjectId(user_id) },
            {
                $set: {
                    password: hashPassword(password),
                },
                $currentDate: {
                    updated_at: true,
                },
            },
        );
        return {
            msg: userMessages.CHANGE_PASSWORD_SUCCESS,
            data: result,
        };
    }

    async checkEmailExist(email: string) {
        const user = await databaseService.user.findOne({ email });
        return Boolean(user);
    }
}

const usersServies = new UsersServies();

export default usersServies;
