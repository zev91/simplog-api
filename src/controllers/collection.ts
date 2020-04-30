
import { Request, Response, NextFunction } from 'express';
import Post from '../models/Post';
import Collection from '../models/Collection';
import User, { IUserDocument } from '../models/User';
import { throwPostNotFound } from '../utils/throwError';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/Jwt';

export const changeCollection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.currentUser as IUserDocument;
    const post = await Post.findById(id);

    if (!post) throwPostNotFound(); 
    let collection = await Collection.findOne({user: user, post:id});;

    if(collection){
      await Collection.findByIdAndDelete(collection.id);
    }else{
      const newCollection= new Collection({
        user: user._id,
        post: post,

      });
      await newCollection.save();
    }

    res.json({
      success: true,
      data: { message: '操作成功!'}
    });
  } catch (error) {
    next(error);
  }
}

export const hasCollectioned = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) throwPostNotFound(); 

    let user:IUserDocument | null = null;
    const token = req.headers['authorization'];
    if (token && token !== 'undefined') {
      await jwt.verify(token, process.env.JWT_SECRET_KEY!, async (_err,data) => {
        const jwtData = data as JwtPayload
        if(data){
          user = await User.findById(jwtData.id)
        }
      }) 
    }

    if(user){
      let collection = await Collection.findOne({post:id, user: user!._id});
      res.json({
        success: true,
        data: { hasCollectioned: !!collection}
      });
    }else{
      res.json({
        success: true,
        data: { hasCollectioned: false}
      });
    }
  } catch (error) {
    next(error);
  }
}