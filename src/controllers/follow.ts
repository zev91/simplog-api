
import { Request, Response, NextFunction } from 'express';
import Follow from '../models/Follow';
import Post from '../models/Post';
import User, { IUserDocument } from '../models/User';
import Activity, { ActiveType } from '../models/Activity';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/Jwt';
import { throwPostNotFound } from '../utils/throwError';

export const changeFollow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = req.currentUser as IUserDocument;

    let follow = await Follow.findOne({followFrom: user._id, followTo:userId});;

    if(follow){
      await Follow.findByIdAndDelete(follow.id);
      await Activity.findOneAndDelete({user: userId,followAuthor:userId})
    }else{
      const newFollow= new Follow({
        followFrom: user._id, 
        followTo:userId
      });
      await newFollow.save();
      const newActivity = new Activity({user: userId, activeType: ActiveType.FOLLOW,followAuthor:userId});
      await newActivity.save();
    }

    res.json({
      success: true,
      data: { message: follow?'取消关注成功！':'关注成功!'}
    });
  } catch (error) {
    next(error);
  }
}

export const hasFollowedAuther = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);
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
      let follow = await Follow.findOne({followFrom: user!._id, followTo:post!.author});

      console.log()
      res.json({
        success: true,
        data: { hasFollowed: !!follow}
      });
    }else{
      res.json({
        success: true,
        data: { hasFollowed: false}
      });
    }
  } catch (error) {
    next(error);
  }
}

export const hasFollowedUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
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
      let follow = await Follow.findOne({followFrom: user!._id, followTo:userId});;
      res.json({
        success: true,
        data: { hasFollowed: !!follow}
      });
    }else{
      res.json({
        success: true,
        data: { hasFollowed: false}
      });
    }
  } catch (error) {
    next(error);
  }
}