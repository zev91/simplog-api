import { Schema, model, Model, Document, HookNextFunction, DocumentQuery } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/Jwt';

enum Role {
  basic = 'basic',
  admin = 'admin'
}
export interface IUserDocument extends Document {
  username: string,
  email: string,
  password: string,
  createAt: string,
  updateAt: string,
  _doc: IUserDocument,
  role: Role,
  generateToken: () => string
}

interface IUserModel extends Model<IUserDocument> {
  admin: () => DocumentQuery<IUserDocument | null, IUserDocument, {}>
}

const userSchema: Schema = new Schema({
  username: String,
  email: String,
  role: {
    type: String,
    enum: ['basic', 'admin'],
    default: 'basic'
  },
  uuid: {
    type: String,
    default: uuidv4()

  },
  password: String,
  createAt: String,
  updateAt: String,
},{
  timestamps: true
});

userSchema.methods.generateToken = function(): string {
  const payload: JwtPayload = { id: this.id };
  return jwt.sign(payload, process.env.JWT_SECRET_KEY!, { 
    expiresIn: '1h' 
  });
}
userSchema.static('admin', ():DocumentQuery<IUserDocument | null, IUserDocument, {}> => {
  return User.findOne({username: 'zevei'})
})

userSchema.pre<IUserDocument>('save', async function save(this:IUserDocument, next: HookNextFunction) {
  if (!this.isModified('password')) return next();

  try {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
})

const User: IUserModel = model<IUserDocument,IUserModel>('User', userSchema);

export default User;