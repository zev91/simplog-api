import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { NOT_FOUND } from 'http-status-codes'
import HttpException from './exceptions/HttpException';

import * as userController from './controllers/user';
import * as postController from './controllers/post';
import * as commentController from './controllers/comment';
import * as sendMailController from './controllers/sendMail';
import * as fileController from './controllers/file';
import * as likePostController from './controllers/likePost';
import * as collectionController from './controllers/collection';
import * as followController from './controllers/follow';
import * as activityController from './controllers/activity';

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
app.put('/api/userinfo',checkAuthMiddleware,userController.updateUserInfo);
app.get('/api/getOtherUserInfo/:userId',userController.getOtherUserInfo);

app.get('/api/posts',postController.getPosts);
app.post('/api/createPost',checkAuthMiddleware,postController.createPost);
app.post('/api/publishPost/:id',checkAuthMiddleware,postController.publishPost);

app.route('/api/posts/:id')
.get(postController.getPost)
.put(checkAuthMiddleware, postController.updatePost)
.delete(checkAuthMiddleware, postController.deletePost);

app.get('/api/getEditPost/:id',checkAuthMiddleware,postController.getEditPost);

app.get('/api/userPosts/:id',postController.userPosts);
app.get('/api/getDraftLists',checkAuthMiddleware,postController.getDraftLists);

app.get('/api/getActivites/:userId',activityController.getActivity);

app.post('/api/likePost/:id',checkAuthMiddleware,likePostController.changeLike);
app.get('/api/getPostLikers/:id',likePostController.getPostLikers);

app.post('/api/collectionPost/:id',checkAuthMiddleware,collectionController.changeCollection);
app.get('/api/hasCollectioned/:id',collectionController.hasCollectioned);
app.get('/api/getUserCollections/:userId',collectionController.getUserCollections);

app.post('/api/follow/:userId',checkAuthMiddleware,followController.changeFollow);
app.get('/api/hasFollowedAuthor/:postId',followController.hasFollowedAuther);
app.get('/api/hasFollowedUser/:userId',followController.hasFollowedUser);
app.get('/api/getFollowedUsers/:userId',followController.getFollowedUsers);

app.get('/api/posts/:id/comment',commentController.getComment);
app.post('/api/posts/:id/comment',checkAuthMiddleware,commentController.createComment);
app.post('/api/deleteComment/:commentId',checkAuthMiddleware,commentController.deleteComment);

app.post('/api/email',sendMailController.sendMail);

app.post('/api/upload/:imageType',checkAuthMiddleware, uploadCreater(),fileController.uploadPic);

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
