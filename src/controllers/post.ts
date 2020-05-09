import { Request, Response, NextFunction } from 'express';
import { UNAUTHORIZED } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';
import Post, { PostStatus, IPostDocument } from '../models/Post';
import LikePost, { ILikePost } from '../models/LikePost';
import HttpException from '../exceptions/HttpException';
import User, { IUserDocument } from '../models/User';
import { checkPostContent } from '../utils/validator';
import { throwPostNotFound, throwUserNotFound } from '../utils/throwError';
import Comment from '../models/Comment';
import Activity, { ActiveType } from '../models/Activity';
import { getMainBody } from '../utils/helper';

export const getPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
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
      select: '_id category tags read postId title author createdAt headerBg',
      page: +pageNo || 1,
      limit: 15,
      lean:true,
      sort: { createdAt:-1 },
      customLabels: myCustomLabels,
      populate: {
        path: 'author',
        select: '_id username avatar'
      }
    };

    let posts = await Post.paginate({status: PostStatus.PUBLISHED},options);
    let datas = posts.datas as IPostDocument[];

    const fillPosts =  datas.map(async (post:IPostDocument) => {
      const likes = await LikePost.find({post:post._id});
      const comments = await Comment.find({post:post._id});
      return ({
        ...post,
        likes: likes.length,
        comments: comments.length
      })
    });


    const newPosts = await Promise.all(fillPosts);

    res.json({
      success: true,
      data: {...posts,datas: newPosts}
    });
 
    next('sdsd');
  } catch (error) {
    next(error)
  }
};

export const userPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
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
        path: 'author',
        select: '_id username avatar'
      }
    };
    const user = await User.findById(id);

    if(!user) throwUserNotFound();

    const posts = await Post.paginate({author: id},options);

    let datas = posts.datas as IPostDocument[];

    const fillPosts =  datas.map(async (post:IPostDocument) => {
      const likes = await LikePost.find({post:post._id});
      const comments = await Comment.find({post:post._id});
      return ({
        ...post,
        likes: likes.length,
        comments: comments.length,
        main: getMainBody(post.body)
      })
    });


    const newPosts = await Promise.all(fillPosts);
    res.json({
      success: true,
      data: {...posts,datas: newPosts}
    });

  } catch (error) {
    next(error)
  }
};

export const getPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) throwPostNotFound(); //验证id格式

    const post:IPostDocument | null = await Post.findById(id).populate('author','_id username avatar jobTitle selfDescription');
    if (!post) throwPostNotFound(); 
    await Post.findByIdAndUpdate(id,{read:post!.read+1});
    const totalPosts = await Post.find({author: post!.author});
    const totalReads = totalPosts.reduce((cur,nex) => cur+nex!.read,0);

    let totalLikes: ILikePost[] = [];

    const calculateLikes = totalPosts.map(async post => {
      const likes = await LikePost.find({post:post._id});
      totalLikes = [...totalLikes,...likes];
    });
    
    await Promise.all(calculateLikes);
 
    const resPost = JSON.parse(JSON.stringify(post)) ;
    resPost.author = {
      ...resPost.author,
      totalReads,
      totalLikes: totalLikes.length
    };

    res.json({
      success: true,
      data: { post:resPost }
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

    const userId:IUserDocument['_id'] | undefined = req.currentUser!._id;
    if (''+post!.author !== ''+userId) throw new HttpException(UNAUTHORIZED, '操作不允许！'); //文章的作者和当前用户是否为同一个

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
          author:userId, 
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
          author:userId, 
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
      author: user._id
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
    const userId:IUserDocument['_id'] | undefined = req.currentUser!._id;
    
    if (!post) throwPostNotFound(); 

    if (''+post!.author !== ''+userId) throw new HttpException(UNAUTHORIZED, '操作不允许！'); //文章的作者和当前用户是否为同一个
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
    const userId:IUserDocument['_id'] | undefined = req.currentUser!._id;
    
    if (!post) throwPostNotFound(); 
    if (''+post!.author !== ''+userId) throw new HttpException(UNAUTHORIZED, '操作不允许！'); //文章的作者和当前用户是否为同一个

    checkPostContent(body,title, category, tags);
    if(post!.status === 'DRAFT'){
      const newActivity = new Activity({user: userId, activeType: ActiveType.PUBLISH,publish:id});
      await newActivity.save();
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
    const userId:IUserDocument['_id'] | undefined = req.currentUser!._id;

    if (!post) throwPostNotFound();
    if (''+post!.author !== ''+userId) throw new HttpException(UNAUTHORIZED, '操作不允许！'); //文章的作者和当前用户是否为同一个

    await Post.findByIdAndDelete(id);

    await Activity.findOneAndDelete({user: userId,publish:id})
    res.json({
      success: true,
      data: { message: '删除成功！' }
    });
  } catch (error) {
    next(error);
  }
};
