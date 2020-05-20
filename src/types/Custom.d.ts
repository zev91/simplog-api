import { IUserDocument } from "../models/User";

declare global {
  namespace Express {
    export interface Request {
      currentUser?: IUserDocument;
    }
  }

  namespace mongoose {  

    export interface PaginateResult<T> {
        docs: T[];
        totalDocs: number;
        limit: number;
        page?: number;
        totalPages: number;
        nextPage?: number | null;
        prevPage?: number | null;
        pagingCounter: number;
        hasPrevPage: boolean;
        hasNextPage: boolean;
        meta?: any;
        [customLabel: string]: T[] | number | boolean | null | undefined;
    }
}
}