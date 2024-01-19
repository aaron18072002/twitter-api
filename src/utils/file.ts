import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import formidable, { File } from 'formidable';
import { UPLOAD_IMAGES_TEMP_DIR, UPLOAD_VIDEOS_DIR, UPLOAD_VIDEOS_TEMP_DIR } from '~/constants/dir';

export const initFolder = () => {
    [UPLOAD_IMAGES_TEMP_DIR, UPLOAD_VIDEOS_TEMP_DIR].forEach((dir) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {
                recursive: true, // cho phép tạo folder nested
            });
        }
    });
};

export const handleUploadImages = (req: Request) => {
    const form = formidable({
        uploadDir: UPLOAD_IMAGES_TEMP_DIR, // chọn folder chứa ảnh từ client gửi lên
        maxFiles: 6,
        keepExtensions: true,
        maxFileSize: 300 * 1024, // 300KB
        maxTotalFileSize: 300 * 1024 * 6,
        filter: function ({ name, originalFilename, mimetype }) {
            const valid = name === 'images' && !!mimetype?.includes('image');
            if (!valid) {
                form.emit('error' as any, new Error('File is invalid') as any);
            }
            return valid;
        },
    });
    return new Promise<File[]>((resolve, reject) => {
        form.parse(req, (err, field, files) => {
            if (err) {
                return reject(err);
            }

            // eslint-disable-next-line no-extra-boolean-cast
            if (!Boolean(files.images)) {
                // images ở đây là req.images
                return reject(new Error('File is empty'));
            }
            resolve(files.images as File[]);
        });
    });
};

export const handleUploadVideo = (req: Request) => {
    const form = formidable({
        uploadDir: UPLOAD_VIDEOS_DIR, // chọn folder chứa ảnh từ client gửi lên
        maxFiles: 6,
        keepExtensions: true,
        maxFileSize: 300 * 1024 * 1024, // 50MB
        maxTotalFileSize: 300 * 1026 * 1024 * 6,
        filter: function ({ name, originalFilename, mimetype }) {
            return true;
            // const valid = name === 'videos' && !!mimetype?.includes('image');
            // if (!valid) {
            //     form.emit('error' as any, new Error('File is invalid') as any);
            // }
            // return valid;
        },
    });
    return new Promise<File>((resolve, reject) => {
        form.parse(req, (err, field, files) => {
            if (err) {
                return reject(err);
            }
            // eslint-disable-next-line no-extra-boolean-cast
            if (!Boolean(files.videos)) {
                // videos ở đây là req.videos
                return reject(new Error('File is empty'));
            }
            // fix trường hợp mà video gửi lên ko có extensions
            // const videos = files.videos as File[];
            // videos.forEach((video) => {
            //     const ext = getExtension(video.originalFilename as string);
            //     fs.renameSync(video.filepath, video.filepath + '.' + ext);
            // });
            resolve((files.videos as File[])[0]);
        });
    });
};

export const getExtension = (originalFileName: string) => {
    const arrname = originalFileName.split('.');
    return arrname[arrname.length - 1];
};
