import { Schema, model, Document, PaginateModel} from 'mongoose';
import { IUserDocument } from './User';
import mongoosePaginate from 'mongoose-paginate-v2';

export interface IFollow extends Document{
  followFrom: IUserDocument['_id'];
  followTo: IUserDocument['_id'];
}

interface IFollowModel extends PaginateModel<IFollow> {};

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

FollowSchema.plugin(mongoosePaginate);

const Collection = model<IFollow,IFollowModel>('Follow', FollowSchema);

export default Collection;