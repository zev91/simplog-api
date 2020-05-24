import { Request, Response, NextFunction } from 'express';
import { UNPROCESSABLE_ENTITY, INTERNAL_SERVER_ERROR } from 'http-status-codes'
import HttpException from '../exceptions/HttpException';
import { checkEmail } from '../utils/validator';
import User  from '../models/User';
import VerifyCode, { CodeType } from '../models/VerifyCode';

import nodemailer from 'nodemailer';
import smtpTransport from 'nodemailer-smtp-transport';


export const sendMail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    checkEmail(email);

    const user = await User.findOne({ email });

    if (user) {
      throw new HttpException(UNPROCESSABLE_ENTITY, '此邮箱已被注册');
    };

    const code = Math.random().toString(36).slice(-6);
    const htmlcon = `尊敬的用户，您好： 您正在 simplog.com 上注册新用户，本次请求的邮件验证码为：${code} 本验证码30分钟内有效，请及时输入。如非本人操作，请忽略该邮件。（这是一封自动发送的邮件，请不要直接回复）`;

    let transport = nodemailer.createTransport(smtpTransport({
      host: 'smtp.qq.com', // qq邮箱主机
      secure: true, // 使用 SSL
      port: 465, // SMTP 端口
      auth: {
        user: process.env.MAIL_USER, // 账号   你自定义的域名邮箱账号
        pass: process.env.MAIL_PASS // 密码   你自己开启SMPT获取的密码
      }
    }));

    var mailOptions = {
      from: 'simplog@qq.com', // 发件地址
      to: email, // 收件列表
      subject: 'simplog账号注册', // 标题
      html: htmlcon // html 内容
    }

    transport.sendMail(mailOptions, async function (error, _response) {
      if (error) {
        const SendErrorInfo = JSON.parse(JSON.stringify(error));
        const { response, responseCode } = SendErrorInfo;

        res.status(INTERNAL_SERVER_ERROR);
        if(responseCode === 550){
          res.json({
            success: false,
            message: '此邮箱不存在，请检查后重试' 
          });
        }else{
          res.json({
            success: false,
            message: response
          });
        }
      } else {
        const newVerifyCode = new VerifyCode({
          value: code,
          email,
          operation: CodeType.register
        });

      await newVerifyCode.save();
        res.json({
          success: true,
          message: '发送成功'
        });
      }
      transport.close(); // 如果没用，关闭连接池
    });
  } catch (error) {
    next(error)
  }
};
