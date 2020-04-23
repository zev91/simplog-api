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
    errors.username = '用户名不能为空！';
  }

  if(isEmpty(password.trim())){
    errors.password = '密码不能为空！';
  }

  return {
    errors, valid: Object.keys(errors).length < 1
  }
}
export const validateRegisterInput = (username:string, password:string, confirmPassword:string, email:string) => {
  let errors: RegisterInoputError = {};

  // console.log({username,password,})
  if(isEmpty(username.trim())){
    errors.username = '用户名不能为空！';
  }

  if(isEmpty(password.trim())){
    errors.password = '密码不能为空！';
  }

  if(isEmpty(confirmPassword.trim())){
    errors.confirmPassword = '确认密码不能为空！';
  }

  if(!equals(password.trim(),confirmPassword)){
    errors.confirmPassword = '两次密码不匹配';
  }

  if(isEmpty(email.trim())){
    errors.email = '邮箱不能为空！';
  }

  if(!isEmail(email)){
    errors.email = '邮箱格式不正确！';
  } 

  return {
    errors, valid: Object.keys(errors).length < 1
  }
}

export const checkBody = (body:string) => {
  if (isEmpty(body.trim())) {
    throw new HttpException(UNPROCESSABLE_ENTITY, `内容不能为空`, {
      body: `内容不能为空`
    });
  };
}

export const checkEmail= (email:string) => {
  if (isEmpty(email.trim())) {
    throw new HttpException(UNPROCESSABLE_ENTITY, `邮箱不能为空！`, {
      body: `邮箱不能为空！`
    });
  };

  if (!isEmail(email)) {
    throw new HttpException(UNPROCESSABLE_ENTITY, `邮箱格式不正确`, {
      body: `邮箱格式不正确！`
    });
  };
}

export const checkPostContent = (body:string, title:string, category:string, tags:string[],) => {
  let errorBody:string[] = [];
  if(isEmpty(body.trim())){
    errorBody.push('内容')
  };

  if(isEmpty(title.trim())){
    errorBody.push('标题')
  };
  if(isEmpty(category.trim())){
    errorBody.push('类别')
  };
  if(!tags.length){
    errorBody.push('标签')
  };

  if (errorBody.length) {
    throw new HttpException(UNPROCESSABLE_ENTITY, `${errorBody.join('|')} 不能为空`, {
      body: `${errorBody.join('|')} 不能为空`
    });
  };
}