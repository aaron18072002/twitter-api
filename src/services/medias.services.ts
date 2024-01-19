import { Request } from 'express';
import sharp from 'sharp';
import { UPLOAD_IMAGES_DIR } from '~/constants/dir';
import { handleUploadImages, handleUploadVideo } from '~/utils/file';
import fs from 'fs';
import { envConfig, isProduction } from '~/constants/config';
import { config } from 'dotenv';
import { MediaTypes } from '~/constants/enums';
import { Media } from '~/models/Others';
config();

class MediasServies {
    async uploadImages(req: Request) {
        const files = await handleUploadImages(req);
        const result: Media[] = await Promise.all(
            files.map(async (file) => {
                const info = await sharp(file.filepath)
                    .jpeg()
                    .toFile(`${UPLOAD_IMAGES_DIR}\\${file.newFilename.split('.')[0]}.jpg`);
                fs.unlinkSync(file.filepath);
                const router = isProduction
                    ? `${envConfig.HOST}/static/image/${file.newFilename.split('.')[0]}`
                    : `localhost:8000/static/image/${file.newFilename.split('.')[0]}`;
                return {
                    url: router,
                    type: MediaTypes.Image,
                };
            }),
        );
        return result;
    }

    async uploadVideos(req: Request) {
        const file = await handleUploadVideo(req);
        const router = isProduction
            ? `${envConfig.HOST}/static/video/${file.newFilename}`
            : `localhost:8000/static/video/${file.newFilename}`;
        return {
            url: router,
            type: MediaTypes.Video,
        };
    }
}

const mediasServies = new MediasServies();

export default mediasServies;
