import { Request, Response, NextFunction } from 'express';
// import { NOT_FOUND, UNAUTHORIZED } from 'http-status-codes'
import Post from '../models/Post';
// import HttpException from '../exceptions/HttpException';
import { IUserDocument } from '../models/User';
import { checkBody } from '../utils/validator';
import { throwPostNotFound } from '../utils/throwError';
import Comment from '../models/Comment';
import HttpException from '../exceptions/HttpException';
import { UNAUTHORIZED, NOT_FOUND } from 'http-status-codes';
// import Comments from '../models/Comment';


export const createComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.currentUser as IUserDocument;
    const { body } = req.body;
    const { id } = req.params;
    checkBody(body);

    const post = await Post.findById(id);
    if(!post) throwPostNotFound(); 

    const newComment= new Comment({
      username: user.username,
      user,
      body,
      post,
    });
    await newComment.save();

    res.json({
      success: true,
      data: { message: 'created successfully'}
    });
  } catch (error) {
    next(error)
  }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, commentId } = req.params;
    const post = await Post.findById(id);
    const user = req.currentUser as IUserDocument;
    const comment = await Comment.findById(commentId);

    if (!post) throwPostNotFound();
    if (!comment) throw new HttpException(NOT_FOUND, 'Comment not found');;

    if (comment.username !== user.username) throw new HttpException(UNAUTHORIZED, 'Action not allowed'); //文章的作者和当前用户是否为同一个

    await Comment.findByIdAndDelete(commentId);
    res.json({
      success: true,
      data: { message: 'Delete successfully' }
    });
  } catch (error) {
    next(error);
  }
};