import { Request, Response, NextFunction } from 'express';
import multer from 'multer';


export default async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let upload = multer({ dest: './tmp/' });
  upload.single('file').bind(null,req,res,next);
  next();
}