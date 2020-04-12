import isEmpty from 'validator/lib/isEmpty';
import isEmail from 'validator/lib/isEmail';
import equals from 'validator/lib/equals';
import { IUserDocument } from '../models/User';
import HttpException from '../exceptions/HttpException';
import { UNPROCESSABLE_ENTITY } from 'http-status-codes';

export interface LoginInputError extends Partial<IUserDocument> {
  general?: string;
};

interface RegisterInoputError extends Partial<IUserDocument>{
  confirmPassword?: string;
}

export const validateLoginInput = (username:string, password:string) => {
  let errors: LoginInputError = {};
  if(isEmpty(username.trim())){
    errors.username = 'Username must not be empty';
  }

  if(isEmpty(password.trim())){
    errors.password = 'Password must not be empty';
  }

  return {
    errors, valid: Object.keys(errors).length < 1
  }
}
export const validateRegisterInput = (username:string, password:string, confirmPassword:string, email:string) => {
  let errors: RegisterInoputError = {};

  if(isEmpty(username.trim())){
    errors.username = 'Username must not be empty';
  }

  if(isEmpty(password.trim())){
    errors.password = 'Password must not be empty';
  }

  if(isEmpty(confirmPassword.trim())){
    errors.confirmPassword = 'ConfirmPassword must not be empty';
  }

  if(!equals(password.trim(),confirmPassword)){
    errors.confirmPassword = 'Password must match';
  }

  if(isEmpty(email.trim())){
    errors.email = 'Email must not be empty';
  }

  if(!isEmail(email)){
    errors.email = 'Email must be a valid email address';
  } 

  return {
    errors, valid: Object.keys(errors).length < 1
  }
}

export const checkBody = (body:string) => {
  if (isEmpty(body.trim())) {
    throw new HttpException(UNPROCESSABLE_ENTITY, `Body must be not empty`, {
      body: `Body must be not empty`
    });
  };
}

export const checkPostContent = (body:string, title:string) => {
  let errorBody:string[] = [];
  if(isEmpty(body.trim())){
    errorBody.push('Body')
  };

  if(isEmpty(title.trim())){
    errorBody.push('Title')
  };

  if (errorBody.length) {
    throw new HttpException(UNPROCESSABLE_ENTITY, `${errorBody.join('|')} must be not empty`, {
      body: `${errorBody.join('|')} must be not empty`
    });
  };
}