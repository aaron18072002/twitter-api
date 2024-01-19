import jwt, { SignOptions } from 'jsonwebtoken';
import { TokenPayload } from '~/models/requests/User.requests';

export const signToken = ({
    payload,
    privateKey,
    options = { algorithm: 'RS256' },
}: {
    payload: string | object | Buffer;
    privateKey: string;
    options?: SignOptions;
}) => {
    return new Promise<string>((resolve, reject) => {
        jwt.sign(payload, privateKey, options, (error, token) => {
            if (error) {
                throw reject(error);
            }
            resolve(token as string);
        });
    });
};

export const verifyToken = ({
    token,
    privateKey
}: {
    token: string;
    privateKey: string;
}) => {
    return new Promise<TokenPayload>((resolve, reject) => {
        jwt.verify(token, privateKey, (error, token) => {
            if (error) {
                reject(error);
            }
            resolve(token as TokenPayload);
        });
    });
};
