import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { IUserDocument } from '../models/User';
import Post, { PostStatus } from '../models/Post';
import PostImage from '../models/PostImage';
import client from '../utils/fileClient';
import { getImageName } from '../utils/helper';
import { throwPostNotFound } from '../utils/throwError';
import HttpException from '../exceptions/HttpException';
import { UNAUTHORIZED } from 'http-status-codes';

export const uploadPic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.currentUser as IUserDocument;

    let { imageType } = req.params;
    let { postId } =req.body;
    let filePath =  req.file.path;                                                     
    let temp = req.file.originalname.split('.');
    let fileType = temp[temp.length - 1];
    let lastName = '.' + fileType;
    let fileName = Date.now() + lastName;

    let newfilepath = path.dirname(filePath)+'/'+fileName;

    fs.rename(filePath,newfilepath, async err => {
      if(err){
        fs.unlinkSync(newfilepath);
        res.json({
          success: false,
          data: { message: '写入文件失败！'}
        });
      }else{
        const result = await client.put('users/'+user._id+'/'+imageType + '/'+fileName,newfilepath);
        const { url, name } = result;
        fs.unlinkSync(newfilepath);

        if(imageType === 'avatar'){
          const reg = RegExp('users/'+user._id+'/'+imageType);
          if(reg.test(user.avatar)){
            await client.delete(getImageName(user.avatar));
          };
        };
        if(imageType === 'post'){
          const post = await Post.findById(postId);
          if (!post) throwPostNotFound(); 
          if(post!.author+'' !== user._id+'') throw new HttpException(UNAUTHORIZED, '操作不允许！'); 
          const realPost = post!.status === PostStatus.PUBLISHED ? await Post.findOne({postId: post!.postId,status: PostStatus.RE_EDITOR}) : post;
          const lastPostImage = await PostImage.findOne({postId:realPost!._id});

          if(!lastPostImage){
            const newImgList = new PostImage({postId:realPost!._id,imageList:[name]});
            await newImgList.save();
          }else{
            await PostImage.findByIdAndUpdate(lastPostImage._id,{imageList:[...lastPostImage.imageList,name]})
          }
        
        };

        res.json({
          success: true,
          data: { message: '上传成功！', url, name}
        });
      }
    })
  } catch (error) {
    next(error);
  }
};


