import { Request, Response, NextFunction } from 'express';
import { UNPROCESSABLE_ENTITY } from 'http-status-codes'
import { validateRegisterInput, validateLoginInput, LoginInputError } from '../utils/validator';
import HttpException from '../exceptions/HttpException';
import User, { IUserDocument } from '../models/User';
import VerifyCode from '../models/VerifyCode';
import bcrypt from 'bcryptjs';

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

    console.log('savedVerifyCode===>>>',savedVerifyCode)

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