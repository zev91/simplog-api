import { Request, Response, NextFunction } from 'express';
import { UNAUTHORIZED } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';
import Post, { PostStatus, IPostDocument } from '../models/Post';
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
    const posts = await Post.paginate({status: PostStatus.PUBLISHED},options);
    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    next(error)
  }
};

export const selfPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    const user = req.currentUser as IUserDocument;

    const posts = await Post.paginate({user: user.id},options);
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

    res.json({
      success: true,
      data: { post }
    });
  } catch (error) {
    next(error)
  }
};

export const getEditPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) throwPostNotFound(); //验证id格式

    let post = await Post.findById(id);
    if (!post) throwPostNotFound(); 

    const user = req.currentUser as IUserDocument;
    if (post!.username !== user.username) throw new HttpException(UNAUTHORIZED, '操作不允许！'); //文章的作者和当前用户是否为同一个

    if(post!.status === PostStatus.PUBLISHED){
      const rePublishPost = await Post.findOne({postId: post!.postId, status: PostStatus.RE_EDITOR});
      if(!rePublishPost){
        const { 
          postId, 
          headerBg, 
          title, 
          body, 
          category,
          tags, 
          username, 
          user, 
          createdAt
        } = post as IPostDocument;
        
        const newPost = new Post({
          postId, 
          status: PostStatus.RE_EDITOR, 
          headerBg, 
          title, 
          body, 
          category,
          tags, 
          username, 
          user, 
          createdAt
        });
    
        post = await newPost.save();
      }else{
        post = rePublishPost;
      }
    }

    res.json({
      success: true,
      data: { post }
    });
  } catch (error) {
    next(error)
  }
};

export const createPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.currentUser as IUserDocument;
    const {
      headerBg,
      title, 
      body, 
      category,
      tags, 
    } = req.body;
  
    const newPost = new Post({
      postId: uuidv4(),
      status: PostStatus.DRAFT, 
      headerBg, 
      title, 
      body, 
      category,
      tags, 
      username: user.username,
      user: user.id
    });

    const post = await newPost.save();

    res.json({
      success: true,
      data: {
        message: 'create success',
        id: post.id
      }
    });
  } catch (error) {
    next(error)
  }
};

export const updatePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { body, title, headerBg, tags, category } = req.body;
    const post = await Post.findById(id);
    const user = req.currentUser as IUserDocument;
    
    if (!post) throwPostNotFound(); 
    if (post!.username !== user.username) throw new HttpException(UNAUTHORIZED, '操作不允许！'); //文章的作者和当前用户是否为同一个
    if(post!.status === PostStatus.PUBLISHED){
      await Post.findOneAndUpdate({
        postId: post!.postId, 
        status: PostStatus.RE_EDITOR
      },{
        body, title, headerBg: headerBg || '', tags, category
      },{
        new: true 
      });
    }else{
      await Post.findByIdAndUpdate(id, { body, title, headerBg: headerBg || '', tags, category  }, { new: true });
    }

    res.json({
      success: true,
      data: { message: '更新成功！' }
    });
  } catch (error) {
    next(error);
  }
};

export const publishPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { body, title, tags, category } = req.body;
    const { id } = req.params;
    const post = await Post.findById(id);
    const user = req.currentUser as IUserDocument;
    
    if (!post) throwPostNotFound(); 
    if (post!.username !== user.username) throw new HttpException(UNAUTHORIZED, '操作不允许！'); //文章的作者和当前用户是否为同一个

    checkPostContent(body,title, category, tags);
    if(post!.status === 'DRAFT'){
      await Post.findByIdAndUpdate(id, { status: 'PUBLISHED' }, { new: true });
    }else{
      const rePublishPost = await Post.findOne({postId: post!.postId, status: PostStatus.RE_EDITOR});
      const { 
        headerBg, 
        title, 
        body, 
        category,
        tags, 
        updateAt
      } = rePublishPost as IPostDocument;
      await Post.findByIdAndUpdate(id, { headerBg, title, body, category, tags,  updateAt }, { new: true });
      await Post.findOneAndDelete({postId: post!.postId, status: PostStatus.RE_EDITOR});
    }
  
    res.json({
      success: true,
      data: { message: `${post!.status === 'DRAFT' ? '发布' : '更新'}成功！`, postId: id }
    });
  } catch (error) {
    console.log(error)
    next(error);
  }
};

export const deletePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    const user = req.currentUser as IUserDocument;

    if (!post) throwPostNotFound();
    if (post!.username !== user.username) throw new HttpException(UNAUTHORIZED, '操作不允许！'); //文章的作者和当前用户是否为同一个

    await Post.findByIdAndDelete(id);
    res.json({
      success: true,
      data: { message: '删除成功！' }
    });
  } catch (error) {
    next(error);
  }
};
