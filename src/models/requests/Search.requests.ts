export interface Pagination {
    limit: string;
    page: string;
}

export interface SearchQuery extends Pagination {
    content: string;
}
