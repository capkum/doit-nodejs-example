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
var crypto = require('crypto');

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
    createUserSchema();
  });

  database.on('disconnected', connectDB);
}

connectDB();

function createUserSchema() {
  UserSchema = mongoose.Schema({
    id: {
      type: String,
      required: true,
      unique: true,
      'default': ' '
    },
    hashed_password: {
      type: String,
      required: true,
      'default': ' '
    },
    salt: {
      type: String,
      required: true
    },
    name: {
      type: String,
      index: 'hashed',
      'default': ' '
    },
    age: {
      type: Number,
      'default': -1
    },
    created_at: {
      type: Date,
      index: {
        unique: false
      },
      'default': Date.now
    },
    updated_at: {
      type: Date,
      index: {
        unique: false
      },
      'default': Date.now
    },
  });

  UserSchema
    .virtual('password')
    .set(function(password) {
      this._password = password;
      this.salt = this.makeSalt();
      this.hashed_password = this.encryptPassword(password);
      console.log('virtual password 호출됨 : ' + this.hashed_password);
    })
    .get(function() {
      return this._password;
    });

  UserSchema.method('encryptPassword', function(plainText, inSalt) {
    if (inSalt) {
      return crypto.createHmac('sha1', inSalt).update(plainText).digest(
        'hex');
    } else {
      return crypto.createHmac('sha1', this.salt).update(plainText).digest('hex');
    }
  });

  UserSchema.method('makeSalt', function() {
    return Math.round((new Date().valueOf() * Math.random())) + '';
  });

  UserSchema.method('authenticate', function(plainText, inSalt, hashed_password) {
    if (inSalt) {
      console.log('authenticate 호출됨 %s -> %s : %s', plainText,
        this.encryptPassword(plainText, inSalt), hashed_password);
      return this.encryptPassword(plainText, inSalt) == hashed_password;
    } else {
      console.log('authenticate 호출됨 %s -> %s : %s', plainText,
        this.encryptPassword(plainText, inSalt), hashed_password);
      return this.encryptPassword(plainText) == hashed_password;
    }
  });

  UserSchema.path('id').validate(function(id) {
    return id.length;
  }, 'id 컬럼이 없습니다.');

  UserSchema.path('name').validate(function(name) {
    return name.length;
  }, 'name 컬럼이 없습니다.');


  UserSchema.static('findById', function(id, callback) {
    return this.find({
      'id': id
    }, callback);
  });

  UserSchema.static('findAll', function(callback) {
    return this.find({}, callback);
  });

  console.log('UserSchema 정의함');

  UserModel = mongoose.model('users2', UserSchema);
  console.log('users model 정의함');

}



// check id, password
var authUser = function(database, id, password, callback) {
  console.log('authUser 호출');

  UserModel.findById(id, function(err, results) {
    if (err) {
      callback(err, null);
      return;
    }
    console.log('아이디[%s]로 사용자 검색 결과 ', id);
    console.dir(results);

    if (results.length > 0) {
      console.log('아이디  일치하는 사용자 찾음.');
      var user = new UserModel({
        id: id
      });
      var authenticated = user.authenticate(password, results[0]._doc.salt,
        results[0]._doc.hashed_password);

      if (authenticated) {
        console.log('비밀번호 일치함');
        callback(null, results);
      } else {
        console.log('비밀번호 일치하지 않음');
        callback(null, null);
      }


    } else {
      console.log('아이디와 일치하는 사용자를 찾지 못함');
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

  user.save(function(err) {
    if (err) {
      cb(err, null);
      return;
    }

    console.log('사용자 데이터 추가');
    cb(null, user);
  });
};

// add user protocol
app.post('/process/adduser', function(req, res) {
  console.log('/process/adduser');

  var paramId = req.param('id');
  var paramPassword = req.param('password');
  var paramName = req.param('name');

  if (database) {
    addUser(database, paramId, paramPassword, paramName,
      function(err, result) {
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

// 사용자 리스트 조회
app.post('/process/listuser', function(req, res) {
  console.log('/process/listuser 호출됨');
  if (database) {
    UserModel.findAll(function(err, results) {
      if (err) {
        callback(err, null);
        return;
      }
      if (results) {
        console.dir(results);
        res.writeHead('200', {
          'Content-Type': 'text/html; charset=utf8'
        });
        res.write('<h2>사용자 리스트</h2>');
        res.write('<div><ul>');

        for (var i = 0; i < results.length; i++) {
          var curId = results[i]._doc.id;
          var curName = results[i]._doc.name;
          res.write('<li>#' + i + ':' + curId + ',' + curName + '</li>');
        }

        res.write('</ul></div>');
        res.end();
      } else {
        res.writeHead('200', {
          'Content-Type': 'text/html; charset=utf8'
        });
        res.write('<h2>사용자 리스트 조회 실패</h2>');
        res.end();
      }
    });
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
