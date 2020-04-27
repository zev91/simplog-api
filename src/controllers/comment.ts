import { Request, Response, NextFunction } from 'express';
import Post from '../models/Post';
import { IUserDocument } from '../models/User';

import { checkBody } from '../utils/validator';
import { throwPostNotFound, throwCommentNotFound } from '../utils/throwError';
import Comment, { IComments } from '../models/Comment';
import HttpException from '../exceptions/HttpException';
import { UNAUTHORIZED, NOT_FOUND } from 'http-status-codes';


export const createComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.currentUser as IUserDocument;
    const { body, parentId } = req.body;
    const { id } = req.params;
    checkBody(body);

    const post = await Post.findById(id);
    if (!post) throwPostNotFound();

    // console.log('post!.user.id====>>>>',post!.user);
    // console.log('user====>>>>',user.id );

    //     console.log(post!.user == user.id )
    // console.log('typeof post!.user===>>>>',typeof post!.user )
    // console.log('typeof user===>>>',typeof user )

    let commentContents: IComments = {
      username: user.username,
      user,
      body,
      post,
      isAuthor: post!.user == user.id
    };

    if (parentId) {
      const comment = await Comment.findById(parentId);
      if (!comment) throwCommentNotFound();

      commentContents = {
        ...commentContents,
        parentId
      }
    }

    const newComment = new Comment(commentContents);
    await newComment.save();


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

    let comments = await Comment.find({"parentId": null, "post": post!._id});

    for(let i = 0; i < comments.length; i++){
      let children =  await Comment.find({"parentId": comments[i].id, "post": post!._id});
      comments[i]['children'] = children;
    }


    // const comments = await Comment.aggregate([
    //   {
    //     $match: {
    //       "parentId": null,
    //       "post": post!._id
    //     }
    //   },
    //   {
    //     $lookup: {
    //       from: "comments",
    //       let: {
    //         id_item: "$id"
    //       },
    //       pipeline: [
    //         {
    //           $match: {
    //             parentId: {$exists: true}
    //           }
    //         },
    //         {
    //           $sort: {
    //             createdAt: -1
    //           }
    //         }
    //       ],
    //       as: "children"
    //     }
    //   },
    //   {
    //     $sort: {
    //       createdAt: -1
    //     }
    //   }
    // ]);

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