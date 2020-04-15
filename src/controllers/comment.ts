import { Request, Response, NextFunction } from 'express';
import Post from '../models/Post';
import { IUserDocument } from '../models/User';
import { checkBody } from '../utils/validator';
import { throwPostNotFound } from '../utils/throwError';
import Comment from '../models/Comment';
import HttpException from '../exceptions/HttpException';
import { UNAUTHORIZED, NOT_FOUND } from 'http-status-codes';


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
      data: { message: '创建成功！'}
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
    if (!comment) throw new HttpException(NOT_FOUND, '评论不存在！');;

    if (comment.username !== user.username) throw new HttpException(UNAUTHORIZED, '操作不允许！'); //文章的作者和当前用户是否为同一个

    await Comment.findByIdAndDelete(commentId);
    res.json({
      success: true,
      data: { message: '删除成功！' }
    });
  } catch (error) {
    next(error);
  }
};