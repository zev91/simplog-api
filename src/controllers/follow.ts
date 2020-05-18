
import { Request, Response, NextFunction } from 'express';
import Follow from '../models/Follow';
import Post from '../models/Post';
import User, { IUserDocument } from '../models/User';
import Activity, { ActiveType } from '../models/Activity';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/Jwt';
import { throwPostNotFound, throwUserNotFound } from '../utils/throwError';

export const changeFollow = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = req.currentUser as IUserDocument;

    let follow = await Follow.findOne({followFrom: user._id, followTo:userId});;

    if(follow){
      await Follow.findByIdAndDelete(follow.id);
      await Activity.findOneAndDelete({user: user._id,followAuthor:userId})
    }else{
      const newFollow= new Follow({
        followFrom: user._id, 
        followTo:userId
      });
      await newFollow.save();
      const newActivity = new Activity({user: user._id, activeType: ActiveType.FOLLOW,followAuthor:userId});
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


export const getFollowedUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  enum followEnum {
    FOLLOW_TO = "FOLLOW_TO",
    FOLLOW_FROM = "FOLLOW_FROM"
  }
  try {
    const { userId } = req.params;
    const { followType, pageNo } = req.query;
    const myCustomLabels = {
      totalDocs: 'total',
      docs: 'datas',
      limit: 'pageSize',
      page: 'currentPage',

      // nextPage: false,
      // prevPage: false,
      totalPages: 'pageCount',
      pagingCounter: false,
      meta: 'page'
    };

    const options = {
      page: +pageNo || 1,
      limit: 15,
      lean:true,
      sort: { createdAt:-1 },
      customLabels: myCustomLabels,
      populate: [
        {
          path: 'followFrom',
          select: '_id username avatar jobTitle'
        },
        {
          path: 'followTo',
          select: '_id username avatar jobTitle'
        }
      ]
    };
    const user = await User.findById(userId);

    if(!user) throwUserNotFound();

    const typeKey = followType === followEnum.FOLLOW_FROM ? 'followTo' : 'followFrom'
    const follows = await Follow.paginate({[typeKey]: userId},options);

    const newFollows = JSON.parse(JSON.stringify(follows));

    newFollows.datas = newFollows.datas.map((data:any) => ({
      ...data,
      user: followType === followEnum.FOLLOW_FROM ? data.followFrom : data.followTo
    }))
    
    res.json({
      success: true,
      data: newFollows
    });

  } catch (error) {
    next(error)
  }
}