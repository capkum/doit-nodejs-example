var route_loader = {};
var config = require('../config');
var database = require('../database/database');

route_loader.init = function(app) {
  console.log('route_loader.init 호출됨.');
  database.init(app, config);
  return initRoutes(app);
};

function initRoutes(app) {
  var infoLen = config.route_info.length;
  console.log('설정에 정의된 라우팅 모듈의 수 : %d', infoLen);

  app.get('/capkum', function(req, res, next) {
    console.log('첫 번째 미들웨어에서 요청 처리함 ');
    res.writeHead('200', {
      'Content-Type': 'text/html;charset=utf8'
    });
    res.end('<h1> Express서버 응답 결과 </h1>');
  });


  for (var i = 0; i < infoLen; i++) {
    var curItem = config.route_info[i];
    var curModule = require(curItem.file);

    if (curItem.type == 'get') {
      console.log('========get======');
      app.post(curItem.path, curModule[curItem.method]);

    } else if (curItem.type == 'post') {
      console.log('========post======');
      app.post(curItem.path, curModule[curItem.method]);

    }

    console.log('라우팅 모듈 [%s]이(가) 설정됨.', curItem.method);
  }

}

module.exports = route_loader;
