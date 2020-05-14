import { Schema, model, Document } from 'mongoose';
import { IPostDocument } from './Post';

export interface IPostImageDocument extends Document {
  postId: IPostDocument['_id'],
  imageList: string[]
}

const PostImageSchema: Schema = new Schema({
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  imageList: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

const PostImage = model<IPostImageDocument>('PostImage', PostImageSchema);

export default PostImage;