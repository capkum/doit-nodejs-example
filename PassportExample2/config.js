
module.exports = {
  server_port: 3000,
  db_url: 'mongodb://localhost:27017/shopping',
  db_schemas: [{
    file: '../database/user_schema',
    collection: 'user5',
    schemaName: 'UserSchema',
    modelName: 'UserModel',
  }],
  route_info: [],
};
