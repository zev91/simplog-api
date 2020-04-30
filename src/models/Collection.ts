import { Schema, model, Document} from 'mongoose';
import { IUserDocument } from './User';
import { IPostDocument } from './Post';

export interface ICollection extends Document{
  user: IUserDocument['_id'];
  post: IPostDocument['_id'];
}

const CollectionSchema: Schema = new Schema({
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

const Collection = model<ICollection>('Collection', CollectionSchema);

export default Collection;