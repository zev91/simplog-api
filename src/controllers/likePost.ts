
import { Request, Response, NextFunction } from 'express';
import Post from '../models/Post';
import LikePost from '../models/LikePost';
import { IUserDocument } from '../models/User';
import { throwPostNotFound } from '../utils/throwError';

export const changeLike = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.currentUser as IUserDocument;
    const post = await Post.findById(id);

    if (!post) throwPostNotFound(); 
    let like = await LikePost.findOne({user: user, post:id});;

    if(like){
      await LikePost.findByIdAndDelete(like.id);
    }else{
      const newLikePost= new LikePost({
        user: user._id,
        post: post,

      });
      await newLikePost.save();
    }

    res.json({
      success: true,
      data: { message: '操作成功!'}
    });
  } catch (error) {
    console.log(error)
    next(error);
  }
}

export const getPostLikers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) throwPostNotFound(); 
    
    let likers = await LikePost.find({post:id}).populate('user','_id username');

    res.json({
      success: true,
      data: { likers: likers.map(liker => liker.user)}
    });
  } catch (error) {
    next(error);
  }
}