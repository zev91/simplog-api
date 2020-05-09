const getMainBody = (body:string) => body.replace(/(#*.*#)|(\n)/g, '').replace(/[^a-z0-9\u4e00-\u9fa5]/, '').substring(0, 200);

export {
  getMainBody
}