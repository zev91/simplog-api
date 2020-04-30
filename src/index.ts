import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { NOT_FOUND } from 'http-status-codes'
import HttpException from './exceptions/HttpException';

import * as userController from './controllers/User';
import * as postController from './controllers/Post';
import * as commentController from './controllers/Comment';
import * as sendMailController from './controllers/sendMail';
import * as fileController from './controllers/file';
import * as likePostController from './controllers/likePost';
import * as collectionController from './controllers/collection';
import * as folloowController from './controllers/follow';

import errorMiddleeare from './middlewares/error.middleware';
import checkAuthMiddleware from './middlewares/check-auth.middleware';

import uploadCreater from './utils/uploadFileCreater'

import 'dotenv/config';

import morgan from 'morgan';
import helmet from 'helmet';
import nocache from 'nocache';

const app: Express  = express();
const port: any = process.env.PORT || 9999;


app.use(morgan('dev'));
app.use(helmet());
app.use(express.json());
app.use(nocache());

app.get('/',(_req: Request, res: Response) => {
  res.send('hello world');
});

app.post('/api/user/register', userController.postRegister);
app.post('/api/user/login', userController.postLogin);
app.get('/api/userinfo',userController.getUserInfo);

app.get('/api/posts',postController.getPosts);
app.post('/api/createPost',checkAuthMiddleware,postController.createPost);
app.post('/api/publishPost/:id',checkAuthMiddleware,postController.publishPost);

app.route('/api/posts/:id')
.get(postController.getPost)
.put(checkAuthMiddleware, postController.updatePost)
.delete(checkAuthMiddleware, postController.deletePost);

app.get('/api/getEditPost/:id',checkAuthMiddleware,postController.getEditPost);

app.get('/api/posts-self',checkAuthMiddleware,postController.selfPosts);

app.post('/api/likePost/:id',checkAuthMiddleware,likePostController.changeLike);
app.get('/api/getPostLikers/:id',likePostController.getPostLikers);

app.post('/api/collectionPost/:id',checkAuthMiddleware,collectionController.changeCollection);
app.get('/api/hasCollectioned/:id',collectionController.hasCollectioned);

app.post('/api/follow/:userId',checkAuthMiddleware,folloowController.changeFollow);
app.get('/api/hasFollowedAuthor/:postId',folloowController.hasFollowedAuther);
app.get('/api/hasFollowedUser/:userId',folloowController.hasFollowedUser);

app.get('/api/posts/:id/comment',commentController.getComment);
app.post('/api/posts/:id/comment',checkAuthMiddleware,commentController.createComment);
app.post('/api/deleteComment/:commentId',checkAuthMiddleware,commentController.deleteComment);

app.post('/api/email',sendMailController.sendMail);

app.post('/api/upload/:imageType',uploadCreater(),fileController.uploadPic);

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
