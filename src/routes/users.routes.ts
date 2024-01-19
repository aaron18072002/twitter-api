import express, { Response } from 'express';
import {
    changePasswordController,
    emailVerifyTokenController,
    followController,
    forgotPasswordController,
    getMeController,
    getProfileController,
    loginController,
    logoutController,
    oauthGoogleController,
    refreshTokenController,
    registerController,
    resendEmailVerifyTokenController,
    resetPasswordController,
    unfollowController,
    updateMeController,
    verifyForgotPasswordController,
} from '~/controllers/users.controllers';
import { filterMiddleware } from '~/middlewares/common.middleware';
import {
    accessTokenValidator,
    changePasswordValidator,
    emailVerifyTokenValidator,
    followedUserIdValidator,
    forgotPassswordValidator,
    loginValidator,
    refreshTokenValidator,
    registerValidator,
    resetPasswordValidator,
    unfollowedUserIdValidator,
    updateMeValidator,
    verifiedUserValidator,
    verifyForgotPassswordValidator,
} from '~/middlewares/users.middlewares';
import { UpdateMeReqBody } from '~/models/requests/User.requests';
import { wrapRequestHandler } from '~/utils/handlers';

const router = express.Router();

// path: /users/login
// method: post
// body: { email, password }
router.post('/login', loginValidator, wrapRequestHandler(loginController));

// path: /users/oauth/google
// method: get
// body: { code: string }
router.get('/oauth/google', wrapRequestHandler(oauthGoogleController));

// path: /users/register
// method: post
// body: { name, email, password, confirm_password, day_of_birth: ISO8601 }
router.post('/register', registerValidator, wrapRequestHandler(registerController));

// path: /users/logout
// method: post
// body: { refresh_token }
// header.Authorization: Bearer <access_token>
router.post(
    '/logout',
    accessTokenValidator,
    refreshTokenValidator,
    wrapRequestHandler(logoutController),
);

// path: /users/verify-email
// method: post
// body: { email_verify_token }
router.post(
    '/verify-email',
    emailVerifyTokenValidator,
    wrapRequestHandler(emailVerifyTokenController),
);

// path: /users/resend-verify-email
// method: post
// header.Authorization: Bearer <access_token>
// body: { }
router.post(
    '/resend-verify-email',
    accessTokenValidator,
    wrapRequestHandler(resendEmailVerifyTokenController),
);

// path: /users/forgot-password
// method: post
// description: Submit email to reset password, sent email to user
// body: { email }
router.post(
    '/forgot-password',
    forgotPassswordValidator,
    wrapRequestHandler(forgotPasswordController),
);

// path: /users/verify-forgot-password
// method: post
// description: Verify link in email to reset password
// body: { forgot-password-token }
router.post(
    '/verify-forgot-password',
    verifyForgotPassswordValidator,
    wrapRequestHandler(verifyForgotPasswordController),
);

// path: /users/reset-password
// method: post
// description: Reset password with info form body
// body: { forgot-password-token, password, confirm_password }
router.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController));

// path: /users/me
// method: get
// description: Get my profile
// header: { Authorization: Bearer <access_token> }
router.get('/me', accessTokenValidator, wrapRequestHandler(getMeController));

// path: /users/:username
// method: get
// description: Get user profile
// params: { username: string }
router.get('/:username', wrapRequestHandler(getProfileController));

// path: /users/me
// method: patch
// description: Update my profile
// header: { Authorization: Bearer <access_token> }
// body: { UserSchema }
router.patch(
    '/me',
    accessTokenValidator,
    verifiedUserValidator,
    filterMiddleware<UpdateMeReqBody>([
        'name',
        'date_of_birth',
        'bio',
        'location',
        'website',
        'username',
        'avatar',
        'cover_photo',
    ]),
    updateMeValidator,
    wrapRequestHandler(updateMeController),
);

// path: /users/follow
// method: post
// description: Follow user
// header: { Authorization: Bearer <access_token> }
// body: { follow_user_id: string }
router.post(
    '/follow',
    accessTokenValidator,
    verifiedUserValidator,
    followedUserIdValidator,
    wrapRequestHandler(followController),
);

// path: /users/:user_id
// method: delete
// description: Unfollow user
// header: { Authorization: Bearer <access_token> }
router.delete(
    '/follow/:unfollow_user_id',
    accessTokenValidator,
    verifiedUserValidator,
    unfollowedUserIdValidator,
    wrapRequestHandler(unfollowController),
);

// path: /change-password
// method: put
// description: Change password
// header: { Authorization: Bearer <access_token> }
// body: { old_password, password, confirm_password }
router.put(
    '/change-password',
    accessTokenValidator,
    verifiedUserValidator,
    changePasswordValidator,
    wrapRequestHandler(changePasswordController),
);

// path: /refresh-token
// method: post
// description: Post refresh token to get new access_token and refresh_token
// body: { refresh_token }
router.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(refreshTokenController));

export default router;
