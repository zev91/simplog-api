const getMainBody = (body:string) => body.replace(/(#*.*#)|(\n)/g, '').replace(/[^a-z0-9\u4e00-\u9fa5]/, '').substring(0, 200);

const getImageName = (url:string) => url ? url.replace('https://simplog.oss-cn-beijing.aliyuncs.com/','') : 'demo';

export {
  getMainBody,
  getImageName
}