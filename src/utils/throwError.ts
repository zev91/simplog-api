import HttpException from "../exceptions/HttpException";
import { NOT_FOUND } from "http-status-codes";

export const throwPostNotFound = () => {
  throw new HttpException(NOT_FOUND, '请求不存在 !');
}

export const throwCommentNotFound = () => {
  throw new HttpException(NOT_FOUND, '请求不存在 !');
}

export const throwUserNotFound = () => {
  throw new HttpException(NOT_FOUND, '请求不存在 !');
}