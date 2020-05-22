import OSS from 'ali-oss';
import config from '../../oss.json'

const bucket = process.env.NODE_ENV === 'development' ? config.DEV_OSS_BUCKET! : config.PROD_OSS_BUCKET!;

export default new OSS({
  region: 'oss-cn-beijing',
  accessKeyId: config.OSS_ACCESS_KEY_ID!,
  accessKeySecret: config.OSS_ACCESS_KEY_SECRET!,
  bucket: bucket
})