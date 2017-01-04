
var path = '../commonModule/user_dao2';

module.exports = {
  server_port: 3000,
  db_url: 'mongodb://localhost:27017/shopping',
  db_schemas: [{
    file: '../database/user_schema2',
    collection: 'user2',
    schemaName: 'UserSchema',
    modelName: 'UserModel',
  }],
  route_info: [{
    file: path,
    path: '/process/login',
    method: 'login',
    type: 'post'
  }, {
    file: path,
    path: '/process/adduser',
    method: 'addUser',
    type: 'post'
  }, {
    file: path,
    path: '/process/listuser',
    method: 'userList',
    type: 'post'
  }],
};
