import { Schema, model, Document} from 'mongoose';
import { IUserDocument } from './User';

export interface IFollow extends Document{
  followFrom: IUserDocument['_id'];
  followTo: IUserDocument['_id'];
}

const FollowSchema: Schema = new Schema({
  followFrom: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  followTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
},{
  timestamps: true
});

const Collection = model<IFollow>('Follow', FollowSchema);

export default Collection;