// login
var login = function(req, res) {
  console.log('/process/login 호출됨');
  var paramId = req.param('id');
  var paramPassword = req.param('password');
  var database = req.app.get('database');

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
        var context = {
          userid: paramId,
          username: docs[0].name,
        };
        req.app.render('login_success', context, function(err, html) {
          if (err) {
            throw err;
          }
          console.log('rendered: ' + html);
          res.end(html);
        });
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
  var database = req.app.get('database');

  if (database) {
    createUser(database, paramId, paramPassword, paramName, req,
      function(err, result) {
        if (err) {
          throw err;
        }

        if (result) {
          console.dir(result);

          res.writeHead('200', {
            'Content-Type': 'text/html; charset=utf8'
          });
          var context = {
            title: '사용자 추가 성공',
          };
          req.app.render('adduser_response', context, function(err, html) {
            if (err) {
              throw err;
            }
            res.end(html);
           });



          // res.write('<h2> 사용자 추가 성공</h2>');
          // res.write('<br><br><a href="/html/adduser.html">유저 추가</a>');
          // res.end();
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
  var database = req.app.get('database');
  var UserModel = database.UserModel;

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

        var dateFormat = require('dateformat');

        var context = {
          results: results,
          dateFormat: dateFormat,
        };

        req.app.render('listuser_response', context, function(err, html) {
          if (err) {
            throw err;
          }
          res.end(html);
        });

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
var createUser = function(database, id, password, name, req, cb) {
  console.log('addUser 호출');
  var UserModel = req.app.get('database').UserModel;

  // var user = new UserModel({
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
  var UserModel = database.UserModel;

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
