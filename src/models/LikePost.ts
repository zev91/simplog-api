import { Schema, model, Document} from 'mongoose';
import { IUserDocument } from './User';
import { IPostDocument } from './Post';

export interface ILikePost extends Document{
  user: IUserDocument['_id'];
  post: IPostDocument['_id'];
}

const LikePostSchema: Schema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  }
},{
  timestamps: true
});

const Like = model<ILikePost>('LikePost', LikePostSchema);

export default Like;