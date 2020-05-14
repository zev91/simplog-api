import { Schema, model, Document, PaginateModel} from 'mongoose';
import { IUserDocument } from './User';
import { IPostDocument } from './Post';
import mongoosePaginate from 'mongoose-paginate-v2';

export interface ICollection extends Document{
  user: IUserDocument['_id'];
  post: IPostDocument['_id'];
}

interface ICollectionModel extends PaginateModel<ICollection> {};

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
CollectionSchema.plugin(mongoosePaginate);

const Collection = model<ICollection,ICollectionModel>('Collection', CollectionSchema);

export default Collection;