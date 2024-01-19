import { NextFunction, Request, Response } from 'express';
import { omit } from 'lodash';
import httpStatus from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';

export const defaultErrorHandler = (
    error: any,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    if (error instanceof ErrorWithStatus) {
        return res
            .status(error.status || httpStatus.INTERNAL_SERVER_ERROR)
            .json(omit(error, ['status']));
    }
    // Định nghĩa lại error có property enumerable = false khiến json trả về thành {}
    Object.getOwnPropertyNames(error).forEach((key) => {
        Object.defineProperty(error, key, {
            enumerable: true,
        });
    });
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        msg: error.message,
        errorInfo: error,
    });
};
