import { IUserDocument } from "../models/User";

export interface JwtPayload {
  id: IUserDocument['_id']
}