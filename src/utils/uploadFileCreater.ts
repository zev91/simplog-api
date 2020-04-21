import multer from 'multer';

import path from 'path';
import fs from 'fs';


export default () => {
  let storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        var _path = path.join(__dirname, '../../uploadFile');
        if(!fs.existsSync(_path)){
            fs.mkdirSync(_path);
        }
        cb(null, _path);    // 保存的路径，备注：需要自己创建
    },
    filename: function (_req, file, cb) {
        // 将保存文件名设置为 字段名 + 时间戳，比如 logo-1478521468943
        cb(null, file.originalname);  
    }
  });
  let upload = multer({
    storage: storage
  });
  
  return upload.single('images')
}
