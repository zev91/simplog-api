import { Schema, model, Document} from 'mongoose';

export enum CodeType {
  register = 'register'
}
export interface IVerifyCode extends Document{
  value: string, // 验证码值
  email: string,
  operation: CodeType // 操作类型
}

const VerifyCodeSchema: Schema = new Schema({
  value: { type: String, unique: true }, // 验证码值
  email: String,
  operation: { type: String, enum: ['register'] }, // 操作类型
  createdAt: { type: Date, default: Date.now, index: { expires: 60 } }
});

const VerifyCode = model<IVerifyCode>('VerifyCode', VerifyCodeSchema);

export default VerifyCode;