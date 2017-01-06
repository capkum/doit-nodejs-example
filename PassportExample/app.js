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
var route_loader = require('./routes/route_loader');

// Passport
var passport = require('passport');
var flash = require('connect-flash');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

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

// Passport 사용자 설정
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// 라우터와 디비연결 및 호출 모듈화
route_loader.init(app);

app.get('/', function(req, res) {
	console.log('/ 패스 요청됨.');
	res.render('index.ejs');
});

// login form
app.get('/login', function(req, res) {
  console.log('/login 패스 요청됨');
  res.render('login.ejs', {
    message: req.flash('loginMessage'),
  });
});

// login form
app.post('/login', passport.authenticate('local-login', {
  successRedirect: '/profile',
  failureRedirect: '/login',
  failureFlash: true
}));

// 회원가임 폼
app.get('/signup', function(req, res) {
  console.log('/signup 패스 요청됨');
  res.render('signup.ejs', {
    message: req.flash('signupMessage'),
  });
});

// 회원가임 proc
app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/profile',
    failureRedirect : '/signup',
    failureFlash: true
}));


// 프로필 링크 - 먼저 로그인 여부를 확인할 수 있도록 isLoggedIn 미들웨어 실행
app.get('/profile', isLoggedIn, function(req, res) {
	console.log('/profile 패스 요청됨.');
	console.dir(req.user);

	if (Array.isArray(req.user)) {
		res.render('profile.ejs', {user: req.user[0]._doc});
	} else {
		res.render('profile.ejs', {user: req.user});
	}
});

// 로그아웃
app.get('/logout', function(req, res) {
	console.log('/logout 패스 요청됨.');
	req.logout();
	res.redirect('/');
});

// 로그인 여부를 알 수 있도록 하는 미들웨어
function isLoggedIn(req, res, next) {
	console.log('isLoggedIn 미들웨어 호출됨.');

	if (req.isAuthenticated()) {
		return next();
	}

	res.redirect('/');
}



// 사용자 인증 성공 시 호출
passport.serializeUser(function(user, done) {
	console.log('serializeUser() 호출됨.');
	console.dir(user);

    done(null, user);
});

// 사용자 인증 이후 사용자 요청 시마다 호출
passport.deserializeUser(function(user, done) {
	console.log('deserializeUser() 호출됨.');
	console.dir(user);

	// 사용자 정보 중 id나 email만 있는 경우 사용자 정보 조회 필요 - 여기에서는 user 객체 전체를 패스포트에서 관리
	done(null, user);
});


var LocalStrategy = require('passport-local').Strategy;

passport.use('local-login', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, function(req, email, password, done) {
  console.log('passport의 local-login login 호출됨 : ' + email + ', ' +
    password);

  var database = app.get('database');
  database.UserModel.findOne({
    'email': email
  }, function(err, user) {
    if (err) {
      return done(err);
    }

    // 등록된 사용자가 없는 경우
    if (!user) {
      console.log('계정이 일치하지 않음.');
      return done(null, false, req.flash('loginMessage',
        '등록된 계정이 없습니다.'));
    }

    // 비밀번호 비교하여 맞지 않는 경우
    var authenticated = user.authenticate(password, user._doc.salt,
      user._doc.hashed_password);
    if (!authenticated) {
      console.log('비밀번호 일치하지 않음.');
      return done(null, false, req.flash('loginMessage',
        '비밀번호가 일치하지 않습니다.'));
    }

    // 정상인 경우
    console.log('계정과 비밀번호가 일치함.');
    return done(null, user);
  });

}));


// passport 회원 가입 설정
passport.use('local-signup', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true,
}, function(req, email, password, done) {
  var paramName = req.body.name;
  console.log('passport의 local-signup signup 호출됨:' + email + ', ' + password +
    ', ' + paramName);

  // User.fineOne이 blocking되므로  async 방식으로 변경할 수도 있음
  process.nextTick(function() {
    var database = app.get('database');
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

}));


var errorHandler = expressErrorHandler({
  static: {
    '404': './public/html/404.html'
  }
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

module.exports = app;
