import { Schema, model, Document, PaginateModel} from 'mongoose';
import { IUserDocument } from './User';
import { IPostDocument } from './Post';
import Comment, { ICommentsDocument } from './Comment';
import mongoosePaginate from 'mongoose-paginate-v2';

export enum ActiveType {
  COLLECTION_POST = 'COLLECTION',
  COMMENT = 'COMMENT',
  FOLLOW = 'FOLLOW',
  LIKE_POST = 'LIKE_POST',
  PUBLISH = 'PUBLISH',
}

export interface IActivityDocument extends Document{
  user: IUserDocument['_id'];
  activeType: ActiveType,
  collectionPost?: IPostDocument['_id'];
  addComment?: ICommentsDocument['_id'];
  followAuthor?: IUserDocument['_id'];
  likePost?: IPostDocument['_id'];
  publish?: IPostDocument['_id'];
}

interface IActivityModel extends PaginateModel<IActivityDocument> {};

const ActivitySchema: Schema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  activeType: {
    type: String,
    enum: ['PUBLISH','COMMENT','LIKE_POST','COLLECTION','FOLLOW']
  },
  collectionPost: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  addComment: {
    type: Schema.Types.ObjectId,
    ref: Comment
  },
  followAuthor: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  likePost: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  },
  publish: {
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }
},{
  timestamps: true
});

ActivitySchema.plugin(mongoosePaginate);
const Activity = model<IActivityDocument,IActivityModel>('Activity', ActivitySchema);

export default Activity;