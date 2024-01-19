import { NextFunction, Request, Response } from 'express';
import { ParamSchema, checkSchema } from 'express-validator';
import { JsonWebTokenError } from 'jsonwebtoken';
import { capitalize } from 'lodash';
import httpStatus from '~/constants/httpStatus';
import { userMessages } from '~/constants/messages';
import { ErrorWithStatus } from '~/models/Errors';
import databaseService from '~/services/database.services';
import usersServies from '~/services/users.servies';
import { hashPassword } from '~/utils/crypto';
import { verifyToken } from '~/utils/jwt';
import { validate } from '~/utils/validation';
import { config } from 'dotenv';
import { TokenPayload } from '~/models/requests/User.requests';
import { ObjectId } from 'mongodb';
import { UserVerifyStatus } from '~/constants/enums';
import { usernameRegex } from '~/constants/regexs';
import { envConfig } from '~/constants/config';
config();

const passwordSchema: ParamSchema = {
    isString: {
        errorMessage: userMessages.PASSWORD_MUST_BE_A_STRING,
    },
    notEmpty: {
        errorMessage: userMessages.PASSWORD_IS_REQUIRED,
    },
    isLength: {
        options: {
            min: 3,
            max: 50,
        },
        errorMessage: userMessages.PASSWORD_LENGTH_MUST_BE_FROM_3_TO_50,
    },
    isStrongPassword: {
        options: {
            minLength: 3,
            minLowercase: 1,
            minNumbers: 1,
            minSymbols: 1,
            minUppercase: 1,
        },
        errorMessage: userMessages.PASSWORd_MUST_BE_STRONG,
    },
    trim: true,
};

const confirmPasswordSchema: ParamSchema = {
    isString: true,
    notEmpty: true,
    isLength: {
        options: {
            min: 3,
            max: 50,
        },
        errorMessage: userMessages.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_3_TO_50,
    },
    isStrongPassword: {
        options: {
            minLength: 3,
            minLowercase: 1,
            minNumbers: 1,
            minSymbols: 1,
            minUppercase: 1,
        },
        errorMessage: userMessages.CONFIRM_PASSWORd_MUST_BE_STRONG,
    },
    custom: {
        options: (value, { req }) => {
            if (value !== req.body.password) {
                throw new Error(userMessages.CONFIRM_PASSWORd_MUST_BE_MATCHED_AT_PASSWORD);
            }
            return true;
        },
    },
    trim: true,
};

const nameSchema: ParamSchema = {
    notEmpty: {
        errorMessage: userMessages.NAME_IS_REQUIRED,
    },
    isString: {
        errorMessage: userMessages.NAME_MUST_BE_A_STRING,
    },
    isLength: {
        options: {
            min: 3,
            max: 255,
        },
        errorMessage: userMessages.NAME_LENGTH_MUST_BE_FROM_3_TO_255,
    },
    trim: true,
};

const dateOfBirthSchema: ParamSchema = {
    isISO8601: {
        options: {
            strict: true,
            strictSeparator: true,
        },
        errorMessage: userMessages.DATE_OF_BIRTH_MUST_BE_ISO8601,
    },
};

const imageUrlSchema: ParamSchema = {
    isString: {
        errorMessage: userMessages.IMAGE_URL_STRING,
    },
    trim: true,
    isLength: {
        options: {
            min: 1,
            max: 400,
        },
        errorMessage: userMessages.IMAGE_URL_LENGTH,
    },
    optional: true,
};

const userIdSchema: ParamSchema = {
    custom: {
        options: async (value: string, { req }) => {
            if (!ObjectId.isValid(value)) {
                throw new ErrorWithStatus({
                    message: userMessages.INVALID_USER_ID,
                    status: httpStatus.NOT_FOUND,
                });
            }
            const user = await databaseService.user.findOne({
                _id: new ObjectId(value),
            });
            if (user === null) {
                throw new ErrorWithStatus({
                    message: userMessages.USER_NOT_FOUND,
                    status: httpStatus.NOT_FOUND,
                });
            }
        },
    },
};

export const loginValidator = validate(
    checkSchema(
        {
            email: {
                notEmpty: {
                    errorMessage: userMessages.EMAIL_IS_REQUIRED,
                },
                isEmail: {
                    errorMessage: userMessages.EMAIL_IS_INVALID,
                },
                trim: true,
                custom: {
                    options: async (value, { req }) => {
                        const user = await databaseService.user.findOne({
                            email: value,
                            password: hashPassword(req.body.password),
                        });
                        if (user === null) {
                            throw new Error(userMessages.EMAIL_OR_PASSWORD_INCORRECT);
                        }
                        req.user = user;
                        return true;
                    },
                },
            },
            password: passwordSchema,
        },
        ['body'],
    ),
);

export const registerValidator = validate(
    checkSchema(
        {
            name: nameSchema,
            email: {
                notEmpty: {
                    errorMessage: userMessages.EMAIL_IS_REQUIRED,
                },
                isEmail: {
                    errorMessage: userMessages.EMAIL_IS_INVALID,
                },
                trim: true,
                custom: {
                    options: async (value) => {
                        const isExistEmail = await usersServies.checkEmailExist(value);
                        if (isExistEmail) {
                            // throw new ErrorWithStatus({
                            //     message: 'Email already exist',
                            //     status: httpStatus.UNAUTHORIZED,
                            // });
                            throw new Error(userMessages.EMAIL_ALREADY_EXISTS);
                        }
                        return true;
                    },
                },
            },
            password: passwordSchema,
            confirm_password: confirmPasswordSchema,
            day_of_birth: dateOfBirthSchema,
        },
        ['body'],
    ),
);

export const accessTokenValidator = validate(
    checkSchema(
        {
            Authorization: {
                trim: true,
                custom: {
                    options: async (value: string, { req }) => {
                        // if (!value) {
                        //     throw new ErrorWithStatus({
                        //         message: { userMessages}.ACCESS_TOKEN_IS_REQUIRED,
                        //         status: httpStatus.UNAUTHORIZED,
                        //     });
                        // }
                        const access_token = (value || '').split(' ')[1];
                        if (!access_token) {
                            throw new ErrorWithStatus({
                                message: userMessages.ACCESS_TOKEN_IS_REQUIRED,
                                status: httpStatus.UNAUTHORIZED,
                            });
                        }
                        try {
                            const decoded_authorization = await verifyToken({
                                token: access_token,
                                privateKey: envConfig.JWT_SECRET_ACCESS_TOKEN_KEY as string,
                            });
                            (req as Request).decoded_authorization = decoded_authorization;
                        } catch (error) {
                            throw new ErrorWithStatus({
                                message: capitalize((error as JsonWebTokenError).message),
                                status: httpStatus.UNAUTHORIZED,
                            });
                        }
                        return true;
                    },
                },
            },
        },
        ['headers'],
    ),
);

export const refreshTokenValidator = validate(
    checkSchema(
        {
            refresh_token: {
                trim: true,
                custom: {
                    options: async (value: string, { req }) => {
                        try {
                            if (!value) {
                                throw new ErrorWithStatus({
                                    message: userMessages.REFRESH_TOKEN_IS_REQUIRED,
                                    status: httpStatus.UNAUTHORIZED,
                                });
                            }
                            const [decoded_refresh_token, refresh_token] = await Promise.all([
                                verifyToken({
                                    token: value,
                                    privateKey: envConfig.JWT_SECRET_REFRESH_TOKEN_KEY as string,
                                }),
                                databaseService.refreshToken.findOne({ token: value }),
                            ]);
                            if (refresh_token === null) {
                                throw new ErrorWithStatus({
                                    message: userMessages.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                                    status: httpStatus.UNAUTHORIZED,
                                });
                            }
                            (req as Request).decoded_refresh_token = decoded_refresh_token;
                        } catch (error) {
                            if (error instanceof JsonWebTokenError) {
                                throw new ErrorWithStatus({
                                    message: capitalize((error as JsonWebTokenError).message),
                                    status: httpStatus.UNAUTHORIZED,
                                });
                            }
                            throw error;
                        }
                    },
                },
            },
        },
        ['body'],
    ),
);

export const emailVerifyTokenValidator = validate(
    checkSchema(
        {
            email_verify_token: {
                trim: true,
                custom: {
                    options: async (value, { req }) => {
                        if (!value) {
                            throw new ErrorWithStatus({
                                message: userMessages.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                                status: httpStatus.UNAUTHORIZED,
                            });
                        }
                        try {
                            const decoded_email_verify_token = await verifyToken({
                                token: value,
                                privateKey: envConfig.JWT_SECRET_EMAIL_VERIFY_TOKEN_KEY as string,
                            });
                            (req as Request).decoded_email_verify_token =
                                decoded_email_verify_token;
                        } catch (error) {
                            if (error instanceof JsonWebTokenError) {
                                throw new ErrorWithStatus({
                                    message: capitalize((error as JsonWebTokenError).message),
                                    status: httpStatus.UNAUTHORIZED,
                                });
                            }
                            throw error;
                        }
                    },
                },
            },
        },
        ['body'],
    ),
);

export const forgotPassswordValidator = validate(
    checkSchema(
        {
            email: {
                isEmail: {
                    errorMessage: userMessages.EMAIL_IS_INVALID,
                },
                trim: true,
                custom: {
                    options: async (value, { req }) => {
                        if (!value) {
                            throw new Error(userMessages.EMAIL_IS_REQUIRED);
                        }
                        const user = await databaseService.user.findOne({ email: value });
                        if (user === null) {
                            throw new Error(userMessages.USER_NOT_FOUND);
                        }
                        (req as Request).user = user;
                    },
                },
            },
        },
        ['body'],
    ),
);

export const verifyForgotPassswordValidator = validate(
    checkSchema(
        {
            forgot_password_token: {
                trim: true,
                custom: {
                    options: async (value) => {
                        if (!value) {
                            throw new ErrorWithStatus({
                                message: userMessages.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
                                status: httpStatus.UNAUTHORIZED,
                            });
                        }
                        try {
                            const decoded_forgot_password_token = (await verifyToken({
                                token: value,
                                privateKey: process.env
                                    .JWT_SECRET_FORGOT_PASSWORD_TOKEN_KEY as string,
                            })) as TokenPayload;
                            const { user_id } = decoded_forgot_password_token;
                            const user = await databaseService.user.findOne({
                                _id: new ObjectId(user_id),
                            });
                            if (user === null) {
                                throw new ErrorWithStatus({
                                    message: userMessages.USER_NOT_FOUND,
                                    status: httpStatus.UNAUTHORIZED,
                                });
                            }
                            if (user.forgot_password_token !== value) {
                                throw new ErrorWithStatus({
                                    message: userMessages.FORGOT_PASSWORD_TOKEN_IS_INVALID,
                                    status: httpStatus.UNAUTHORIZED,
                                });
                            }
                        } catch (error) {
                            if (error instanceof JsonWebTokenError) {
                                throw new ErrorWithStatus({
                                    message: userMessages.FORGOT_PASSWORD_TOKEN_IS_INVALID,
                                    status: httpStatus.UNAUTHORIZED,
                                });
                            }
                            throw error;
                        }
                    },
                },
            },
        },
        ['body'],
    ),
);

export const resetPasswordValidator = validate(
    checkSchema(
        {
            password: passwordSchema,
            confirm_password: confirmPasswordSchema,
            forgot_passowrd_token: {
                trim: true,
                custom: {
                    options: async (value, { req }) => {
                        if (!value) {
                            throw Error(userMessages.FORGOT_PASSWORD_TOKEN_IS_REQUIRED);
                        }
                        const decoded_forgot_password_token = (await verifyToken({
                            token: value,
                            privateKey: envConfig.JWT_SECRET_FORGOT_PASSWORD_TOKEN_KEY as string,
                        })) as TokenPayload;
                        const user = await databaseService.user.findOne({
                            _id: new ObjectId(decoded_forgot_password_token.user_id),
                        });
                        if (user === null) {
                            throw new Error(userMessages.USER_NOT_FOUND);
                        }
                        (req as Request).user = user;
                    },
                },
            },
        },
        ['body'],
    ),
);

export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
    const { verify } = req.decoded_authorization as TokenPayload;
    if (verify === UserVerifyStatus.Unverified) {
        throw new ErrorWithStatus({
            message: userMessages.USER_NOT_VERIFIED,
            status: httpStatus.FORBIDDEN,
        });
    }
    next();
};

export const updateMeValidator = validate(
    checkSchema(
        {
            name: {
                ...nameSchema,
                optional: true,
                notEmpty: false,
            },
            date_of_birth: {
                ...dateOfBirthSchema,
                optional: true,
            },
            bio: {
                isString: {
                    errorMessage: userMessages.BIO_MUST_BE_STRING,
                },
                trim: true,
                isLength: {
                    options: {
                        min: 1,
                        max: 200,
                    },
                    errorMessage: userMessages.BIO_LENGTH_MUST_BE_FROM_1_TO_200,
                },
                optional: true,
            },
            location: {
                isString: {
                    errorMessage: userMessages.LOCATION_MUST_BE_STRING,
                },
                trim: true,
                isLength: {
                    options: {
                        min: 1,
                        max: 100,
                    },
                    errorMessage: userMessages.LOCATION_LENGTH_MUST_BE_FROM_1_TO_100,
                },
                optional: true,
            },
            website: {
                isString: {
                    errorMessage: userMessages.WEBSITE_MUST_BE_STRING,
                },
                trim: true,
                isLength: {
                    options: {
                        min: 1,
                        max: 100,
                    },
                    errorMessage: userMessages.WEBSITE_LENGTH_MUST_BE_FROM_1_TO_100,
                },
                optional: true,
            },
            username: {
                isString: {
                    errorMessage: userMessages.USERNAME_MUST_BE_STRING,
                },
                trim: true,
                custom: {
                    options: async (value, { req }) => {
                        if (!usernameRegex.test(value)) {
                            throw new Error(userMessages.USERNAME_IS_INVALID);
                        }
                        const user = await databaseService.user.findOne({ username: value });
                        if (user) {
                            throw new Error(userMessages.USERNAME_ALREADY_USED);
                        }
                    },
                },
                optional: true,
            },
            avatar: imageUrlSchema,
            cover_photo: imageUrlSchema,
        },
        ['body'],
    ),
);

export const followedUserIdValidator = validate(
    checkSchema(
        {
            followed_user_id: userIdSchema,
        },
        ['body'],
    ),
);

export const unfollowedUserIdValidator = validate(
    checkSchema(
        {
            unfollow_user_id: userIdSchema,
        },
        ['params'],
    ),
);

export const changePasswordValidator = validate(
    checkSchema(
        {
            old_password: {
                ...passwordSchema,
                custom: {
                    options: async (value, { req }) => {
                        const { user_id } = (req as Request).decoded_authorization as TokenPayload;
                        const user = await databaseService.user.findOne({
                            _id: new ObjectId(user_id),
                        });
                        if (user === null) {
                            throw new ErrorWithStatus({
                                message: userMessages.USER_NOT_FOUND,
                                status: httpStatus.UNAUTHORIZED,
                            });
                        }
                        const isMatched = hashPassword(value) === user.password;
                        if (!isMatched) {
                            throw new ErrorWithStatus({
                                message: userMessages.OLD_PASSWORD_NOT_MATCH,
                                status: httpStatus.UNAUTHORIZED,
                            });
                        }
                    },
                },
            },
            password: passwordSchema,
            confirm_password: confirmPasswordSchema,
        },
        ['body'],
    ),
);

export const isUserLoggedInValidator = (
    middleware: (req: Request, res: Response, next: NextFunction) => void,
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.headers.authorization) {
            return middleware(req, res, next);
        }
        next();
    };
};
