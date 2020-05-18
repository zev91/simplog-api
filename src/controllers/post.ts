import { Request, Response, NextFunction } from 'express';
import { UNAUTHORIZED } from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';

import Post, { PostStatus, IPostDocument } from '../models/Post';
import LikePost, { ILikePost } from '../models/LikePost';
import User, { IUserDocument } from '../models/User';
import PostImage from '../models/PostImage';
import Comment from '../models/Comment';
import Activity, { ActiveType } from '../models/Activity';
import Collection from '../models/Collection';
import HttpException from '../exceptions/HttpException';
import { throwPostNotFound, throwUserNotFound } from '../utils/throwError';
import client from '../utils/fileClient';
import { checkPostContent } from '../utils/validator';
import { getImageName, getMainBody } from '../utils/helper';


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

    const posts = await Post.paginate({author: id, status: PostStatus.PUBLISHED},options);

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
      const lastPostImage = await PostImage.findOne({postId:post!._id});

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
        if(lastPostImage){  // 确定已发布文章插入过图片
          const newPostImage = new PostImage({postId: post._id,imageList:[...lastPostImage!.imageList]});
          newPostImage.save();
        }
      }else{
        post = rePublishPost;
      }
    }

    res.json({
      success: true,
      data: { post }
    });
  } catch (error) {
    console.log(error)
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

    const deleteImg = (_error:any, data:IPostDocument|null) => {

      if(data!.headerBg && !headerBg){
        client.delete(getImageName(data!.headerBg));
      };
    }
    
    if (!post) throwPostNotFound(); 

    if (''+post!.author !== ''+userId) throw new HttpException(UNAUTHORIZED, '操作不允许！'); //文章的作者和当前用户是否为同一个
    if(post!.status === PostStatus.PUBLISHED){
      const query = {
        postId: post!.postId, 
        status: PostStatus.RE_EDITOR
      };
      await Post.findOneAndUpdate(query,{
        body, title, headerBg: headerBg || '', tags, category
      },{
        new: false
      },deleteImg);

      const draftPost = await Post.findOne(query);
      const postImage = await PostImage.findOne({postId: draftPost!._id});

      if(postImage){
        const shouldDeleteImages = postImage!.imageList.filter(list => (body+post!.body).search(list) === -1);
        await PostImage.findByIdAndUpdate(postImage!._id,{imageList: postImage!.imageList.filter(list => body.search(list) > -1)});

        if(shouldDeleteImages.length){
          await client.deleteMulti(shouldDeleteImages);
        }
      };
      
    }else{
      await Post.findByIdAndUpdate(id, 
        { body, title, headerBg: headerBg || '', tags, category }, 
        { new: false },
        deleteImg
      );
      const postImage = await PostImage.findOne({postId: id});
      if(postImage){

        const shouldDeleteImages = postImage!.imageList.filter(list => body.search(list) === -1);
        await PostImage.findByIdAndUpdate(postImage!._id,{imageList: postImage!.imageList.filter(list => body.search(list) > -1)});

        if(shouldDeleteImages.length){
          await client.deleteMulti(shouldDeleteImages);
        }
      };
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

      const draftImage = await PostImage.findOne({postId:rePublishPost!._id});
      const publishImage = await PostImage.findOne({postId:id});

      if(draftImage){
        await PostImage.findOneAndUpdate({postId:id},{imageList: [...draftImage.imageList]});
        await PostImage.findOneAndDelete({postId:rePublishPost!._id});
      }

      if(publishImage){
        const shouldDeleteImages = publishImage.imageList.filter(list => body.search(list) === -1);
        if(shouldDeleteImages.length) {
          await client.deleteMulti(shouldDeleteImages);
        }
      }
      
    }
  
    res.json({
      success: true,
      data: { message: `${post!.status === 'DRAFT' ? '发布' : '更新'}成功！`, postId: id }
    });
  } catch (error) {

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

    await Post.findByIdAndDelete(id); //删除文章
    await Activity.findOneAndDelete({user: userId,publish:id});
    await Activity.findOneAndDelete({user: userId,likePost:id});
    await Activity.findOneAndDelete({user: userId,collectionPost:id});

    await Collection.deleteMany({post: id});
    await LikePost.deleteMany({post: id});

    const refComments = await Comment.find({post: id});
    const commentIds = refComments.map(item => item._id);

    for(let i = 0; i < commentIds.length; i++){
      await Activity.findOneAndDelete({addComment: commentIds[i]});
    }

    await Comment.deleteMany({post: id});

    /* 删除文章所用的存于阿里云的图片 start */

    if(post!.headerBg){
      client.delete(getImageName(post!.headerBg));
    }

    const postImage = await PostImage.findOne({postId: post!._id});

    if(postImage){
      await PostImage.findByIdAndDelete(postImage._id);
      if(postImage.imageList.length){
        await client.deleteMulti(postImage.imageList);
      }
    }
    

    const draftPost = await Post.findOne({postId: post!.postId,status:PostStatus.RE_EDITOR});

    if(draftPost){
      await Post.findByIdAndDelete(draftPost._id); 
      const draftPostImage = await PostImage.findOne({postId: draftPost!._id});

      if(draftPost!.headerBg){
        client.delete(getImageName(draftPost!.headerBg));
      }

      if(draftPostImage){
        await PostImage.findByIdAndDelete(draftPostImage._id);
        if(draftPostImage.imageList.length){
          await client.deleteMulti(draftPostImage.imageList);
        }
      }
    }
    /* 删除文章所用的存于阿里云的图片 end */

    res.json({
      success: true,
      data: { message: '删除成功！' }
    });
  } catch (error) {
    next(error);
  }
};

export const getDraftLists = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.currentUser as IUserDocument;
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
      customLabels: myCustomLabels
    };

    const posts = await Post.paginate({author: user._id,status:PostStatus.DRAFT},options);
    res.json({
      success: true,
      data: posts
    });

  } catch (error) {
    next(error)
  }
};
