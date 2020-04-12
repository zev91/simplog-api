import { Schema, model, Document} from 'mongoose';
import { IUserDocument } from './User';
import { IPostDocument } from './Post';

export interface ILike extends Document{
  username: string;
  user: IUserDocument['_id']
  postTitle: string;
  post: IPostDocument['_id']
}

const LikeSchema: Schema = new Schema({
  username: String,
  user: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  postTitle: String, 
  post: {
    type: Schema.Types.ObjectId,
    ref: 'posts',
    required: true
  },

},{
  timestamps: true
});

const Like = model<ILike>('Like', LikeSchema);

export default Like;