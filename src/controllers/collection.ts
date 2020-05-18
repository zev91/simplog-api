
import { Request, Response, NextFunction } from 'express';
import Post from '../models/Post';
import Collection from '../models/Collection';
import User, { IUserDocument } from '../models/User';
import Activity, { ActiveType } from '../models/Activity';
import { throwPostNotFound } from '../utils/throwError';
import { getMainBody } from '../utils/helper';
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
      await Activity.findOneAndDelete({user: user._id,collectionPost:id})
    }else{
      const newCollection= new Collection({
        user: user._id,
        post: post,

      });
      await newCollection.save();
      const newActivity = new Activity({user: user._id, activeType: ActiveType.COLLECTION_POST, collectionPost:id});
      await newActivity.save();
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

export const getUserCollections = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { pageNo } = req.query;
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
      populate: {
        path: 'post',
        select: '_id author headerBg body title postId read tags category createdAt',
        populate: {
          path: 'author',
          select: '_id avatar username company jobTitle selfDescription'
        }
      }
    };

    const collections = await Collection.paginate({ user: userId }, options);
    const newCollections = JSON.parse(JSON.stringify(collections));
    
    newCollections.datas = newCollections.datas.map((data:any) => ({
      ...data,
      post: Object.assign(data.post,{main:getMainBody(data.post.body)})
    }));

    res.json({
      success: true,
      data: newCollections
    });

  } catch (error) {
    next(error)
  }
}