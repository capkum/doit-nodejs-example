var mongod = require('mongodb');
var mongoose = require('mongoose');

var database = {};

database.init = function(app, config) {
  console.log('init() 호출');
  connect(app, config);
};

// database connect
function connect(app, config) {
  console.log('connect() 호출됨');
  var databaseUrl = config.db_url ;
  mongoose.Promise = global.Promise;
  mongoose.connect(databaseUrl);
  database = mongoose.connection;
  database.on('error', console.error.bind(console, 'mongoose connection  error'));
  database.on('open', function() {
    console.log('데이터베이스에 연결되었습니다. :' + databaseUrl);
    createSchema(app, config);
  });

  database.on('disconnected', connect);
}

// schema & model
function createSchema(app, config) {
  app.set('database', database);
  var schemaLen = config.db_schemas.length;
  console.log('설정에 정의된 스키마의 수 : %d', schemaLen);

  for (var i = 0; i < schemaLen; i++) {
    var curItem = config.db_schemas[i];

    // schema
    var curSchema = require(curItem.file).createSchema(mongoose);
    console.log('%s  모듈을 불러들인 후 스키마 정의함', curItem.file);

    // model
    var curModel = mongoose.model(curItem.collection, curSchema);
    console.log('%s 컬렉션을 위해 모델 정의함', curItem.collection);

    //databse 객체에 속성 추가
    database[curItem.schemaName] = curSchema;
    database[curItem.modelName] = curModel;
    console.log('스키마 이름 [%s], 모델 이름 [%s]이 databse 객체의 속성으로 추가됨',
      curItem.schemaName, curItem.modelName);
  }
  app.set('database', database);

  console.log('database 객체가 app객체의 속성으로 추가됨');
}

module.exports = database;
