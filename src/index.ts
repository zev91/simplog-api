import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { NOT_FOUND } from 'http-status-codes'
import HttpException from './exceptions/HttpException';

import * as userController from './controllers/User';
import * as postController from './controllers/Post';
import * as commentController from './controllers/Comment';
import * as sendMailController from './controllers/sendMail';
import * as fileController from './controllers/file';

import errorMiddleeare from './middlewares/error.middleware';
import checkAuthMiddleware from './middlewares/check-auth.middleware';
// import uploadMiddleware from './middlewares/upload-midleware';

import uploadCreater from './utils/uploadFileCreater'

import 'dotenv/config';

import morgan from 'morgan';
import helmet from 'helmet';

const app: Express  = express();
const port: any = process.env.PORT || 9999;





app.use(morgan('dev'));
app.use(helmet());
app.use(express.json());

app.get('/',(_req: Request, res: Response) => {
  res.send('hello world');
});

app.post('/api/user/register', userController.postRegister);
app.post('/api/user/login', userController.postLogin);
app.get('/api/userinfo',userController.getUserInfo);

app.get('/api/posts',postController.getPosts);
app.post('/api/createPost',checkAuthMiddleware,postController.createPost)

app.route('/api/posts/:id')
.get(postController.getPost)
.put(checkAuthMiddleware, postController.updatePost)
.delete(checkAuthMiddleware, postController.deletePost);

app.get('/api/getEditPost/:id',checkAuthMiddleware,postController.getEditPost);

app.get('/api/posts-self',checkAuthMiddleware,postController.selfPosts);

app.post('/api/posts/:id/like',checkAuthMiddleware,postController.likePost);

app.post('/api/posts/:id/comment',checkAuthMiddleware,commentController.createComment);
app.delete('/api/posts/:id/comment/:commentId',checkAuthMiddleware,commentController.deleteComment);

app.post('/api/email',sendMailController.sendMail);

app.post('/api/upload',uploadCreater(),fileController.uploadPic);

app.use((_req: Request, _res: Response, next:NextFunction) => {
  const error: HttpException = new HttpException(NOT_FOUND, 'Router Not Found');
  next(error);
});

app.use(errorMiddleeare);

const main = () => {
  mongoose.set('useFindAndModify',false);
  mongoose.set('useCreateIndex', true) ;
  mongoose.connect('mongodb://localhost/test',{
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  app.listen(port,()=> {
    console.log(`Running on http://localhost:${port}`);
  });
};

main();
