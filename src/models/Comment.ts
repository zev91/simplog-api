import { Schema, model, Document, PaginateModel} from 'mongoose';
import { IUserDocument } from './User';
import { IPostDocument } from './Post';
import mongoosePaginate from 'mongoose-paginate-v2';

export interface ICommentsDocument extends Document{
  username: string;
  body: string;
  user: IUserDocument['_id']
  post: IPostDocument['_id']
}

interface ICommentsModel extends PaginateModel<ICommentsDocument> {};

const CommentsSchema: Schema = new Schema({
  username: String,
  body: String,
  user: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'posts',
    required: true
  },

},{
  timestamps: true
});

CommentsSchema.plugin(mongoosePaginate);

const Comments:ICommentsModel = model<ICommentsDocument,ICommentsModel>('Comments', CommentsSchema);

export default Comments;