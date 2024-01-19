import express from 'express';
import { uploadImageController, uploadVideoController } from '~/controllers/medias.controller';
import { accessTokenValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';

const router = express.Router();

router.post('/upload-image', accessTokenValidator, wrapRequestHandler(uploadImageController));

router.post('/upload-video', accessTokenValidator, wrapRequestHandler(uploadVideoController));

export default router;
