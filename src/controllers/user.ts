import { Request, Response, NextFunction } from 'express';
import { UNPROCESSABLE_ENTITY } from 'http-status-codes'
import { validateRegisterInput, validateLoginInput, LoginInputError } from '../utils/validator';
import HttpException from '../exceptions/HttpException';
import User, { IUserDocument } from '../models/User';
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
      errors.general = 'User not found';
      return throwLoginValidateError(errors);
    };

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      errors.general = 'Passward is wrong';
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
      throw new HttpException(UNPROCESSABLE_ENTITY, 'User register input error', errors);
    }

    const user = await User.findOne({ username });

    if (user) {
      throw new HttpException(UNPROCESSABLE_ENTITY, "Username is token", {
        username: 'The username is token'
      })
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