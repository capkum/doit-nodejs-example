var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
var expressErrorHandler = require('express-error-handler');
var mysql = require('mysql');
// var mongodb = require('mongodb');

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

// mongodb connect function
// function connectDB() {
//   var databaseUrl = 'mongodb://localhost:27017/shopping';
//   mongodb.connect(databaseUrl, function(err, db) {
//     if (err) {
//       throw err;
//     }
//     console.log('데이터베이스에 연결되었습니다.:' + databaseUrl);
//     database = db;
//   });
// }
// connectDB();

// mysql database connect function
var pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'test',
  debug: false
});

// Add User
var addUser = function(id, name, age, password, callback) {
  console.log('AddUser 호출');

  pool.getConnection(function(err, conn) {
    if (err) {
      conn.release();
      return;
    }

    console.log('데이터베이스에 연결 스레드 아이디' + conn.threadId);

    var data = {
      id: id,
      name: name,
      age: age,
      password: password
    };

    var exec = conn.query('insert into users set ?', data,
      function(err, result) {
        conn.release();
        console.log('싱핼 대상 SQL' + exec.sql);

        if (err) {
          console.log('SQL 실행 시 오류 발생');
          console.dir(err);
          callback(err, null);
          return;
        }

        callback(null, result);
      });

  });
};


app.post('/process/adduser', function(req, res) {
  console.log('/process/adduser  호출됨');

  var paramId = req.param('id');
  var paramName = req.param('name');
  var paramAge = req.param('age');
  var paramPassword = req.param('password');

  if (pool) {
    addUser(paramId, paramName, paramAge, paramPassword,
      function(err, result) {
        if (err) {
          throw err;
        }

        if (result) {
          console.dir(result);
          console.log('inserted' + result.affectedRows + ' rows');
          var insertId = result.insertId;
          console.log('추가한 레코드의 아이디: ' + insertId);

          res.writeHead('200', {
            'Content-Type': 'text/html; charset=utf8'
          });
          res.write('<h2>사용자 추가 성공 </h2>');
          res.end();
        } else {
          res.writeHead('200', {
            'Content-Type': 'text/html; charset=utf8'
          });
          res.write('<h2>사용자 추가 실패 </h2>');
          res.end();
        }

      });
  } else {
    res.writeHead('200', {
      'Content-Type': 'text/html; charset=utf8'
    });
    res.write('<h2>데이터 베이스 연결 시래 </h2>');
    res.end();
  }

});


// check id, password
var authUser = function(id, password, callback) {
  console.log('authUser 호출');

  pool.getConnection(function(err, conn) {
    if (err) {
      conn.release();
      return;
    }

    console.log('데이터 베이스 연결 스레드 ' + conn.threadId);

    var columns = ['id', 'name', 'age'];
    var tablename = 'users';

    var exec = conn.query('select ?? from ?? where id=? and password=?', [
      columns, tablename, id, password
    ], function(err, rows) {
      conn.release();
      console.log('실행 대상 SQL : ' + exec.sql);

      if (rows.length > 0) {
        console.log('아이디 [%s], 비밀번호 [%s]가 일치하는 사용자 찾음.', id, password);
        callback(null, rows);
      } else {
        console.log('일치하는 사용자를 찾지 못함');
        callback(null, null);
      }
    });

  });

};

app.post('/process/login', function(req, res) {
  console.log('/process/login 호출됨');
  var paramId = req.param('id');
  var paramPassword = req.param('password');

  if (pool) {
    authUser(paramId, paramPassword, function(err, rows) {
      if (err) {
        throw err;
      }
      if (rows) {
        console.dir(rows);
        var username = rows[0].name;
        res.writeHead('200', {
          'Content-Type': 'text/html; charset=utf8'
        });
        res.write('<h1>로그인 성공</h1>');
        res.write('<div><p>사용자 아이디:' + paramId + '</p></div>');
        res.write('<div><p>사용자 이름:' + username + '</p></div>');
        res.write("<br><br><a href='/html/login2'>다시 로그인하기</a>");
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

var errorHandler = expressErrorHandler({
  static: {
    '404': './public/html/404.html'
  }
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

module.exports = app;
