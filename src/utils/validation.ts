import express, { NextFunction, Request, Response } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema';
import httpStatus from '~/constants/httpStatus';
import { EntityError, ErrorWithStatus } from '~/models/Errors';

// can be reused by many routes

// sequential processing, stops running validations chain if the previous one fails.
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        await validation.run(req);
        const errors = validationResult(req);
        const errorsObject = errors.mapped();
        // Tạo 1 custom error để xử lý lỗi do validation
        const entityError = new EntityError({ errors: {} });
        for (const key in errorsObject) {
            const { msg } = errorsObject[key];
            // Trả về lỗi không phải do validation
            if (msg instanceof ErrorWithStatus && msg.status !== httpStatus.UNPROCESSABLE_ENTITY) {
                return next(msg);
            }
            entityError.errors[key] = errorsObject[key];
        }

        // Nếu không có lỗi thì next qua controller
        if (errors.isEmpty()) {
            return next();
        }

        // res.status(422).json({ errors: errors.mapped() });
        next(entityError);
    };
};
