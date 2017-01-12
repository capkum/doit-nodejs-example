var LocalStrategy = require('passport-local').Strategy;

// passport 회원 가입 설정
module.exports =  new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true,
}, function(req, email, password, done) {
  var paramName = req.body.name;
  console.log('passport의 local-signup signup 호출됨:' + email + ', ' + password +
    ', ' + paramName);

  // User.fineOne이 blocking되므로  async 방식으로 변경할 수도 있음
  process.nextTick(function() {
    var database = req.app.get('database');
    database.UserModel.findOne({
      'email': email
    }, function(err, user) {
      if (err) {
        return done(err);
      }

      //기존 메일이 있다면
      if (user) {
        console.log('기존에 계정이 있음');
        return done(null, false, req.flash('signupMessage',
          '계정이 이미 있음'));
      } else {
        // 모델 인스턴스 객체 만들어 저장
         user = new database.UserModel({
          'email': email,
          'password': password,
          'name': paramName,
        });
        user.save(function(err) {
          if (err) {
            throw err;
          }
          console.log('사용자 데이터 추가함');
          return done(null, user);
        });
      }

    });
  });

});
