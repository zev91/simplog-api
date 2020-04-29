import { Schema, model, Document, PaginateModel} from 'mongoose';
import { IUserDocument } from './User';
import { IPostDocument } from './Post';
import mongoosePaginate from 'mongoose-paginate-v2';

export interface IComments {
  body: string;
  parentId?: ICommentsDocument['_id'];
  children?: ICommentsDocument[];
  likeCount?: number;
  isAuthor?:boolean;
  fromUser: IUserDocument['_id'];
  replyToUser?: IUserDocument['_id'];
  post: IPostDocument['_id'];
}

export interface ICommentsDocument extends Document{
  body: string;
  parentId?: ICommentsDocument['_id'];
  children?: ICommentsDocument[];
  likeCount?: number;
  isAuthor?: boolean;
  fromUser: IUserDocument['_id'];
  replyToUser?: IUserDocument['_id'];
  post: IPostDocument['_id'];
}

interface ICommentsModel extends PaginateModel<ICommentsDocument> {};

const CommentsSchema: Schema = new Schema({
  body: String,
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'comments',
  },
  children: {
    type: Array,
    default: []
  },
  likeCount: {
    type: Number,
    default: 0
  },
  isAuthor: {
    type: Boolean,
    default: false
  },

  fromUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  replyToUser: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  }
},{timestamps: true});

CommentsSchema.plugin(mongoosePaginate);

const Comments:ICommentsModel = model<ICommentsDocument,ICommentsModel>('Comments', CommentsSchema);

export default Comments;