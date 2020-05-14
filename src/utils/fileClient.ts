import OSS from 'ali-oss';
import config from '../../oss.json'

export default new OSS({
  region: 'oss-cn-beijing',
  accessKeyId: config.OSS_ACCESS_KEY_ID!,
  accessKeySecret: config.OSS_ACCESS_KEY_SECRET!,
  bucket: config.OSS_BUCKET!
})