import { Request, Response, NextFunction } from 'express';
import { UNPROCESSABLE_ENTITY } from 'http-status-codes'
import { validateRegisterInput, validateLoginInput, LoginInputError } from '../utils/validator';
import HttpException from '../exceptions/HttpException';
import User, { IUserDocument } from '../models/User';
import VerifyCode from '../models/VerifyCode';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/Jwt';
import LikePost, { ILikePost } from '../models/LikePost';
import Follow from '../models/Follow';
import Post from '../models/Post';

const throwLoginValidateError = (errors: LoginInputError) => {
  throw new HttpException(UNPROCESSABLE_ENTITY, 'User login input error', errors);
}

export const postLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;
    const { errors, valid } = validateLoginInput(username, password);

    if (!valid) {
      return throwLoginValidateError(errors);
    }

    const user = await User.findOne({ username });

    if (!user) {
      errors.general = '用户不存在！';
      return throwLoginValidateError(errors);
    };

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      errors.general = '密码错误！';
      return throwLoginValidateError(errors);
    }

    const token: string = user.generateToken();
    res.status(200).json({
      success: true,
      data: {
        token
      }
    })
  } catch (error) {
    next(error)
  }
}

export const postRegister = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password, confirmPassword, email } = req.body;
    const { errors, valid } = validateRegisterInput(username, password, confirmPassword, email);

    if (!valid) {
      throw new HttpException(UNPROCESSABLE_ENTITY, '注册出错！', errors);
    }

    const user = await User.findOne({ username });

    if (user) {
      throw new HttpException(UNPROCESSABLE_ENTITY, "用户名已存在！", {
        username: '用户名已存在！'
      })
    };

    const savedVerifyCode = await VerifyCode.findOne({ email });

    if (!savedVerifyCode) {
      throw new HttpException(UNPROCESSABLE_ENTITY, '验证码已过期，请重新获取！');;
    };

    const newUser: IUserDocument = new User({
      username, email, password
    });

    const resUser = await newUser.save();
    const token: string = resUser.generateToken();

    res.status(200).json({
      success: true,
      data: {
        token
      }
    })
  } catch (error) {
    next(error)
  }
}


export const getUserInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let user;
    const token = req.headers['authorization'];
    if (token && token !== 'undefined') {
      await jwt.verify(token, process.env.JWT_SECRET_KEY!, async (_err,data) => {
        const jwtData = data as JwtPayload
        if(data){
          user = await User.findById(jwtData.id,['avatar','jobTitle','company','selfDescription','_id','username','email'])
        }
      }) 
    }

    res.status(200).json({
      success: true,
      data: {
        user: user || {}
      }
    })
  } catch (error) {
    next(error)
  }
}

export const updateUserInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.currentUser as IUserDocument;
    const params = req.body;

    if(params.username){
      const existsUsername = await User.findOne({id:{$ne: user._id},username:params.username});

      if(existsUsername){
        res.json({
          success: false,
          data: {
            message: '该用户名已存在'
          }
        });
        return;
      }
    }

    await User.findByIdAndUpdate(user._id,{...params});
    res.json({
      success: true,
      data: {
        message: '更新成功'
      }
    });
  }catch(error){
    next(error)
  }
}

export const getOtherUserInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const totalPosts = await Post.find({author: userId});
    const totalFollowTo = await Follow.find({followTo: userId});
    const totalFollowFrom= await Follow.find({followFrom: userId});
    const totalReads = totalPosts.reduce((cur,nex) => cur+nex!.read,0);

    let user = await User.findById(userId,['avatar','jobTitle','company','selfDescription','_id','username','createdAt']);
    let totalLikes: ILikePost[] = [];

    const calculateLikes = totalPosts.map(async post => {
      const likes = await LikePost.find({post:post._id});
      totalLikes = [...totalLikes,...likes];
    });
    
    await Promise.all(calculateLikes);

    res.status(200).json({
      success: true,
      data: {
        user: {...user!._doc,totalReads,totalLikes:totalLikes.length,totalFollowTo,totalFollowFrom} 
      }
    })
  } catch (error) {
    next(error)
  }
}