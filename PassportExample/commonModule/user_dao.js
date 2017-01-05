var database;
var UserSchema;
var UserModel;

var init = function(db, schema, model) {
  console.log('/commonModule/user_dao/ init호출됨');

  database = db;
  UserSchema = schema;
  UserModel = model;
};

// login
var login = function(req, res) {
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
};

// add user
var addUser = function(req, res) {
  console.log('/process/adduser');

  var paramId = req.param('id');
  var paramPassword = req.param('password');
  var paramName = req.param('name');

  if (database) {
    crateUser(database, paramId, paramPassword, paramName,
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
};

// user list
var userList = function(req, res) {
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
};

// add user in mongodb
var crateUser = function(database, id, password, name, cb) {
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

// auth
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

module.exports.login = login;
module.exports.addUser = addUser;
module.exports.userList = userList;
module.exports.init = init;
