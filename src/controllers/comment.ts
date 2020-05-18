import { Request, Response, NextFunction } from 'express';
import Post from '../models/Post';
import { IUserDocument } from '../models/User';
import { checkBody } from '../utils/validator';
import { throwPostNotFound, throwCommentNotFound } from '../utils/throwError';
import Comment, { IComments } from '../models/Comment';
import Activity, { ActiveType } from '../models/Activity';
import HttpException from '../exceptions/HttpException';
import { UNAUTHORIZED, NOT_FOUND } from 'http-status-codes';


export const createComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId:IUserDocument['_id'] | undefined = req.currentUser!._id;
    const { body, parentId, replyId } = req.body;
    const { id } = req.params;
    checkBody(body);

    const post = await Post.findById(id);
    if (!post) throwPostNotFound();

    let commentContents: IComments = {
      fromUser:userId,
      body,
      post,
      isAuthor: ''+post!.author == ''+userId
    };

    if (parentId) {
      const comment = await Comment.findById(parentId);
      if (!comment) throwCommentNotFound();

      commentContents = {
        ...commentContents,
        parentId
      }
    }

    if(replyId){
      commentContents = {
        ...commentContents,
        replyToUser: replyId
      }
    }

    const newComment = new Comment(commentContents);
    await newComment.save();

    const newActivity = new Activity({user: userId, activeType: ActiveType.COMMENT,addComment: newComment._id});
    await newActivity.save();

    res.json({
      success: true,
      data: { message: '评论成功！' }
    });
  } catch (error) {
    next(error)
  }
};

export const getComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if(!post) throwPostNotFound(); 

    let comments = await Comment.find({"parentId": null, "post": post!._id}).sort({createdAt: -1}).populate('fromUser','_id username avatar');

    for(let i = 0; i < comments.length; i++){
      let children =  await Comment.find({"parentId": comments[i].id, "post": post!._id}).sort({createdAt: -1}).populate('fromUser','_id username avatar').populate('replyToUser','_id username avatar');
      comments[i]['children'] = children;
    }
    res.json({
      success: true,
      data: { comments}
    });
  } catch (error) {
    next(error)
  }
};

export const deleteComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { commentId } = req.params;
    const userId:IUserDocument['_id'] | undefined = req.currentUser!._id;
    const comment = await Comment.findById(commentId).populate({path: 'post'});
    if (!comment) throw new HttpException(NOT_FOUND, '评论不存在！');

    const currentUser = userId+'';
    const parentComment = await Comment.findById(comment.parentId);
    const commentFromUser = comment.fromUser+'';
    const commentPostAuthor = comment.post.author+'';

    let unauthorized:boolean = currentUser !== commentFromUser && currentUser !== commentPostAuthor;
    if(parentComment){
        unauthorized = currentUser !== parentComment.fromUser+''
      }

    if (unauthorized) throw new HttpException(UNAUTHORIZED, '操作不允许！'); //文章的作者和当前用户是否为同一个

    const childrenComments = await Comment.find({parentId:commentId});

    if(childrenComments.length){
      for(let i = 0; i < childrenComments.length; i++){
        await Activity.findOneAndDelete({addComment: childrenComments[i]._id});
      }
    }

    await Comment.deleteMany({parentId:commentId});

    await Comment.findByIdAndDelete(commentId);

    await Activity.findOneAndDelete({addComment: commentId});

    res.json({
      success: true,
      data: { message: '删除成功！' }
    });
  } catch (error) {
    next(error);
  }
};