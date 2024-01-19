import { NextFunction, Request, Response } from 'express';
import path from 'path';
import { UPLOAD_IMAGES_DIR, UPLOAD_VIDEOS_DIR, UPLOAD_VIDEOS_TEMP_DIR } from '~/constants/dir';
import httpStatus from '~/constants/httpStatus';
import { userMessages } from '~/constants/messages';
import { ErrorWithStatus } from '~/models/Errors';
import mediasServies from '~/services/medias.services';

console.log(path.resolve('uploads'));

export const uploadImageController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<Response | void> => {
    const result = await mediasServies.uploadImages(req);

    return res.status(200).json({
        msg: userMessages.UPLOAD_IMAGE_SUCCESS,
        data: result,
    });
};

export const uploadVideoController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<Response | void> => {
    const result = await mediasServies.uploadVideos(req);

    return res.status(200).json({
        msg: userMessages.UPLOAD_VIDEO_SUCCESS,
        data: result,
    });
};

export const serveImageController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<Response | void> => {
    const { name } = req.params;
    // return res.sendFile(path.resolve(UPLOAD_IMAGES_DIR, name));
    return res.sendFile(path.join(UPLOAD_IMAGES_DIR, name + '.jpg'), (err) => {
        if (err) {
            return res.status(404).json({
                msg: err.message,
            });
        }
    });
};

export const serveVideoController = async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.params;

    return res.sendFile(path.join(UPLOAD_VIDEOS_DIR, name), (err) => {
        if (err) {
            return res.status(404).json({
                msg: err.message,
            });
        }
    });
};
