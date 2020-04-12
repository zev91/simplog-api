import { Request, Response, NextFunction } from 'express';
import { INTERNAL_SERVER_ERROR } from 'http-status-codes'
import HttpException from '../exceptions/HttpException';

const errorMiddleeare = (error: HttpException, _request: Request, response: Response, next:NextFunction) => {
  const status = error.status || INTERNAL_SERVER_ERROR;
  const message = error.message || 'Something went wrong!';

  response.status(status).json({
    success: false,
    message: message,
    error: error.errors
  });
  next();
};

export default errorMiddleeare;