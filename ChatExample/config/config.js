
module.exports = {
  server_port: 3000,
  db_url: 'mongodb://localhost:27017/shopping',
  db_schemas: [{
    file: '../database/user_schema',
    collection: 'user6',
    schemaName: 'UserSchema',
    modelName: 'UserModel',
  }],
  route_info: [],
  facebook: {
    clientID: '000000000000000000',
    clientSecret: '0000000000000000000',
    callbackURL: '/auth/facebook/callback',
  },
};
