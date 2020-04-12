import { Request } from 'express';
import { IUserDocument } from '../models/User'

export interface RequestWithUser extends Request {
  currentUser?: IUserDocument;
} 