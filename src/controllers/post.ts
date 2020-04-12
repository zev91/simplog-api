import { Request, Response, NextFunction } from 'express';
import { UNAUTHORIZED } from 'http-status-codes'
import Post from '../models/Post';
import Like from '../models/Like';
import Comment from '../models/Comment';
import HttpException from '../exceptions/HttpException';
import { IUserDocument } from '../models/User';
import { checkPostContent } from '../utils/validator';
import { throwPostNotFound } from '../utils/throwError';

export const getPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pageNO } = req.query;
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
      page: +pageNO,
      limit: 10,
      customLabels: myCustomLabels
    };
    const posts = await Post.paginate({},options);
    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    next(error)
  }
};

export const getPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) throwPostNotFound(); //验证id格式

    const post = await Post.findById(id);
    if (!post) throwPostNotFound(); 

    const comment =  await Comment.find({
      post: id
    });

    res.json({
      success: true,
      data: { post, comments: comment }
    });
  } catch (error) {
    next(error)
  }
};

export const createPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.currentUser as IUserDocument;
    const { body, title } = req.body;
    checkPostContent(body,title);

    const newPost = new Post({
      title,
      body,
      username: user.username,
      user: user.id
    });

    const post = await newPost.save();

    res.json({
      success: true,
      data: {
        message: 'create success',
        post
      }
    });
  } catch (error) {
    next(error)
  }
};

export const updatePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { body, title } = req.body;
    const post = await Post.findById(id);
    const user = req.currentUser as IUserDocument;

    if (!post) throwPostNotFound(); 
    if (post!.username !== user.username) throw new HttpException(UNAUTHORIZED, 'Action not allowed'); //文章的作者和当前用户是否为同一个

    checkPostContent(body,title);
    const resPost = await Post.findByIdAndUpdate(id, { body, title }, { new: true });
    res.json({
      success: true,
      data: { message: 'Updated successfully', post: resPost }
    });
  } catch (error) {
    next(error);
  }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    const user = req.currentUser as IUserDocument;

    if (!post) throwPostNotFound();
    if (post!.username !== user.username) throw new HttpException(UNAUTHORIZED, 'Action not allowed'); //文章的作者和当前用户是否为同一个

    await Post.findByIdAndDelete(id);
    res.json({
      success: true,
      data: { message: 'Delete successfully' }
    });
  } catch (error) {
    next(error);
  }
};

export const likePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    const user = req.currentUser as IUserDocument;

    if (!post) throwPostNotFound(); 

    const like =  await Like.findOne({
      user: user,
      post: id
    });

    if(like){
      await Like.findByIdAndDelete(like.id);
    }else{
      const newLike= new Like({
        username: user.username,
        user,
        postTitle: post!.title,
        post,
      });
      await newLike.save();
    }

    const likes = await Like.find({
      post: id
    });

    res.json({
      success: true,
      data: { post, likes, liked: !like}
    });
  } catch (error) {
    next(error);
  }
}