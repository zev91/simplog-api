import { Schema, model, Document, PaginateModel } from 'mongoose';
import { IUserDocument } from './User';
import mongoosePaginate from 'mongoose-paginate-v2';


export enum PostStatus {
  DRAFT = 'DRAFT',
  RE_EDITOR = 'RE_EDITOR',
  PUBLISHED = 'PUBLISHED'
}

export interface IPostDocument extends Document {
  postId: string;
  status: PostStatus;
  headerBg: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
  author: IUserDocument['_id'],
  read: number,
  comments?: number,
  likes?: number,
  createdAt?: Date,
  updateAt?: Date
};

interface IPostModel extends PaginateModel<IPostDocument> {};

const PostSchema: Schema = new Schema({
  postId: String,
  status: { type: String, enum: ['DRAFT','RE_EDITOR','PUBLISHED'] }, 
  headerBg: String,
  title: String,
  body: String,
  category: {
    type: String,
    default: ''
  },
  tags: {
    type: [String],
    default: []
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  read: {
    type: Number,
    default: 0
  },
  createdAt: Date,
  updateAt: Date,
}, {
  timestamps: true
});


PostSchema.plugin(mongoosePaginate);
const Post: IPostModel = model<IPostDocument, IPostModel>('Post', PostSchema);

export default Post;