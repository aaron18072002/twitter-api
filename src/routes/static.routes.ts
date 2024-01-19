import express from 'express';
import { serveImageController, serveVideoController } from '~/controllers/medias.controller';
import { wrapRequestHandler } from '~/utils/handlers';

const router = express.Router();

router.get('/image/:name', wrapRequestHandler(serveImageController));

router.get('/video/:name', wrapRequestHandler(serveVideoController));

export default router;
