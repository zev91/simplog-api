import { Schema, model, Document, PaginateModel } from 'mongoose';
import { IUserDocument } from './User';
import mongoosePaginate from 'mongoose-paginate-v2';

export interface IPostDocument extends Document {
  title: string,
  body: string;
  createAt: string;
  username: string;
  user: IUserDocument['_id']
};

interface IPostModel extends PaginateModel<IPostDocument> {};

const PostSchema: Schema = new Schema({
  title: String,
  body: String,
  username: String,
  createdAt: String,
  updateAt: String,
  user: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  }
}, {
  timestamps: true
});


PostSchema.plugin(mongoosePaginate);
const Post: IPostModel = model<IPostDocument, IPostModel>('Post', PostSchema);

export default Post;