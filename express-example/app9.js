var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressErrorHandler = require('express-error-handler');
//
// var index = require('./routes/index');
// var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', index);
// app.use('/users', users);

app.post('/process/login/:name', function(req, res) {
  console.log('첫 번째 미들웨어에서 요청을 처리');

  var paramID = req.body.id;
  var paramPassword = req.body.password;
  var paramName = req.params.name;

  res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
  res.write('<h1> /process/login에서 처리.</h1>');
  res.write('<div><p>Param Name:'+paramName+'</p></div>');
  res.write('<div><p>Param Id:'+paramID+'</p></div>');
  res.write('<div><p>param Password id:'+paramPassword+'</p></div>');
  res.write("<div><br><br><a href='/html/login2.html'>로그인 페이지로 돌아가기</a></div>");
  res.end();
});

var errorHandler = expressErrorHandler({
  static: {
    '404': './public/html/404.html'
  }
});

app.use(expressErrorHandler.httpError(404) );
app.use(errorHandler);

// // catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   var err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });
//
// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};
//
//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

module.exports = app;
