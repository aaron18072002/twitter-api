import { ParamsDictionary } from 'express-serve-static-core';
import { NextFunction, Request, Response } from 'express';
import { SearchQuery } from '~/models/requests/Search.requests';
import searchService from '~/services/search.services';

export const searchController = async (
    req: Request<ParamsDictionary, any, any, SearchQuery>,
    res: Response,
    next: NextFunction,
) => {
    const limit = Number(req.query.limit);
    const page = Number(req.query.page);
    const result = await searchService.search({ limit, page, content: req.query.content });

    return res.status(200).json({
        data: result,
    });
};
