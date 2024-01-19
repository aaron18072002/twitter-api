import express from 'express';
import { searchController } from '~/controllers/search.controller';

const router = express.Router();

/* 
  Method: get
  Path: /search
  Query: { content: string, limit: string, page: string }
*/
router.get('/', searchController);

export default router;
