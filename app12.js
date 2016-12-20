var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressErrorHandler = require('express-error-handler');
var expressSession = require('express-session');

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
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressSession({
  secret: 'my key',
  resave: true,
  saveUninitialized: true
}));

// app.use('/', index);
// app.use('/users', users);

// session check
app.get('/process/product', function(req, res) {
  console.log('/process/product 호출됨');
  if (req.session.user) {
    res.redirect('/html/product.html');
  } else {
    res.redirect('/html/login2.html');
  }
});

// login
app.post('/process/login', function(req, res) {
  console.log('/process/login 호출');
  var paramId = req.param('id');
  var paramPassword = req.param('password');

  if (req.session.user) {
    console.log('이미 로그인되어 상품 페이지로 이동됩니다.');
    res.redirect('/html/product.html');
  } else {
    req.session.user = {
      id: paramId,
      name: '소녀시대',
      authorized: true
    };

    res.writeHead('200', {
      'Content-Type': 'text/html;charset=utf8'
    });
    res.write('<h1>로그인 성공</h1>');
    res.write('<div><p>Param id: ' + paramId + '</p></div>');
    res.write('<div><p>Param password: ' + paramPassword + '</p></div>');
    res.write("<br><br> <a href='/process/product'>상품 페이지로 이동하기</a>");
    res.end();
  }
});

app.get('/process/logout', function(req, res) {
  console.log('/process/logout 호출됨');

  if (req.session.user) {
    console.log('로그아웃합니다.');
    req.session.destroy(function(err){
      if (err) { throw err;}
      console.log('세션을 삭제하고 로그아웃되었습니다');
      res.redirect('/html/login2.html');
    });
  } else {
    console.log('아직 로그인되어 있지 않습니다.');
    res.redirect('/html/login2.html');
  }
});


var errorHandler = expressErrorHandler({
  static: {
    '404': './public/html/404.html'
  }
});

app.use(expressErrorHandler.httpError(404));
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
