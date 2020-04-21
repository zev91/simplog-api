import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
// import CO from 'co';
import OSS from 'ali-oss';

// import Post from '../models/Post';
// import { IUserDocument } from '../models/User';
// import { checkBody } from '../utils/validator';
// import { throwPostNotFound } from '../utils/throwError';
// import Comment from '../models/Comment';
// import HttpException from '../exceptions/HttpException';
// import { UNAUTHORIZED, NOT_FOUND } from 'http-status-codes';


let client = new OSS({
  region: 'oss-cn-beijing',
  //云账号AccessKey有所有API访问权限，建议遵循阿里云安全最佳实践，部署在服务端使用RAM子账号或STS，部署在客户端使用STS。
  accessKeyId: 'LTAI9jgyI9dOpvMR',
  accessKeySecret: 'KzoUiohQDhSH8iwnEMvge8mi26TR1A',
  bucket: 'simplog'
});

export const uploadPic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
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
        const result = await client.put('images/'+fileName,newfilepath);
        const { url, name } = result;
        fs.unlinkSync(newfilepath);
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

