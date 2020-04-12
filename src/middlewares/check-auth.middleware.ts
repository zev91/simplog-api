import { Request, Response, NextFunction } from 'express';
import HttpException from '../exceptions/HttpException';
import { UNAUTHORIZED } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { JwtPayload } from '../types/Jwt';

const checkAuthMiddleware = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const token = req.headers['authorization'];

  if (token) {
    try {
      const jwtData = jwt.verify(token, process.env.JWT_SECRET_KEY!) as JwtPayload;
      const user = await User.findById(jwtData.id)
      if (user) {
        req.currentUser = user;
        return next();
      } else {
        return next(new HttpException(UNAUTHORIZED, 'no such user'))
      }
    } catch (error) {
      return next(new HttpException(UNAUTHORIZED, 'Invalid/Expried token'))
    }

  }
  return next(new HttpException(UNAUTHORIZED, 'Authorization token must be provied'))
}

export default checkAuthMiddleware;