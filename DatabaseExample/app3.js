var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
var expressErrorHandler = require('express-error-handler');
var mongodb = require('mongodb');
var mongoose = require('mongoose');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

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

// mongodb connection
var database;
var UserSchema;
var UserModel;

function connectDB() {
  var databaseUrl = 'mongodb://localhost:27017/shopping';

  mongoose.connect(databaseUrl);
  database = mongoose.connection;
  database.on('error', console.error.bind(console, 'mongoose connection  error'));
  database.on('open', function() {
    console.log('데이터베이스에 연결되었습니다. :' + databaseUrl);

    UserSchema = mongoose.Schema({
      id: String,
      name: String,
      password: String
    });
    console.log('UserSchema 정의함');

    UserModel = mongoose.model('users', UserSchema);
    console.log('users정의함');
  });

  database.on('disconnected', connectDB);
}

connectDB();


// check id, password
var authUser = function(database, id, password, callback) {
  console.log('authUser 호출');

  UserModel.find({
    'id': id,
    'password': password
  }, function(err, results) {
    if (err) {
      callbakc(err, null);
      return;
    }
    console.log('아이디 [%s], 비밀번호 [%s]가 일치하는 사용자 찾음.', id, password);
    console.dir(results);

    if (results.lenght > 0) {
      console.log('일치하는 사용자를 찾음');
      callback(null, results);

    } else {
      console.log('일치하는 사용자를 찾지 못함');
      callback(null, null);
    }

  });
};

// login
app.post('/process/login', function(req, res) {
  console.log('/process/login 호출됨');
  var paramId = req.param('id');
  var paramPassword = req.param('password');

  if (database) {
    authUser(database, paramId, paramPassword, function(err, docs) {
      if (err) {
        throw err;
      }

      if (docs) {
        console.dir(docs);

        res.writeHead('200', {
          'Content-Type': 'text/html; charset=utf8'
        });
        res.write('<h1>로그인 성공</h1>');
        res.write('<div><p>사용자 아이디 : ' + paramId + ' </p></div>');
        res.write('<div><p>사용자 이름 : ' + docs[0].name + ' </p></div>');
        res.write('<br><br><a href="/html/login.html">다시 로그인하기</a>');
        res.end();
      } else {
        res.writeHead('200', {
          'Content-Type': 'text/html; charset=utf8'
        });
        res.write('<h1>로그인 실패</h1>');
        res.write('<div><p>사용자 아이디와 비밀번호를 확인하십시오 </p></div>');
        res.write('<br><br><a href="/html/login.html">다시 로그인하기</a>');
        res.end();
      }
    });
  } else {
    res.writeHead('200', {
      'Content-Type': 'text/html; charset=utf8'
    });
    res.write('<h2>데이터베이스 연결 실패</h2>');
    res.write('<div><p>데이터베이스에 연결 하지 못했습니다.</p></div>');
    res.end();
  }
});

// add user in mongodb
var addUser = function(database, id, password, name, cb) {
  console.log('addUser 호출');

  var user = new UserModel({
    'id': id,
    'password': password,
    'name': name,
  });

  user.save(function(err){
    if (err) {
      cb(err, null);
      return;
    }

    console.log('사용자 데이터 추가');
    cb(null, user);
  });

  // var users = database.collection('users');
  // users.insert([{
  //   "id": id,
  //   "password": password,
  //   "name": name
  // }], function(err, result) {
  //   if (err) {
  //     cb(err, null);
  //     return;
  //   }
  //
  //   console.log('사용자 데이터 추가');
  //   cb(null, result);
  // });
};

// add user protocol
app.post('/process/adduser', function(req, res) {
  console.log('/process/adduser');

  var paramId = req.param('id');
  var paramPassword = req.param('password');
  var paramName = req.param('name');

  if (database) {
    addUser(database, paramId, paramPassword, paramName, function(err,
      result) {
      if (err) {
        throw err;
      }

      if (result) {
        console.dir(result);

        res.writeHead('200', {
          'Content-Type': 'text/html; charset=utf8'
        });
        res.write('<h2> 사용자 추가 성공</h2>');
        res.write('<br><br><a href="/html/adduser.html">유저 추가</a>');
        res.end();
      } else {
        res.writeHead('200', {
          'Content-Type': 'text/html; charset=utf8'
        });
        res.write('<h2> 사용자 추가 실패</h2>');
        res.end();
      }
    });
  } else {
    res.writeHead('200', {
      'Content-Type': 'text/html; charset=utf8'
    });
    res.write('<h2> 데이터베이스 연결 실패</h2>');
    res.write('<br><br><a href="/html/adduser.html">유저 추가</a>');
    res.end();
  }
});


var errorHandler = expressErrorHandler({
  static: {
    '404': './public/html/404.html'
  }
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

module.exports = app;
