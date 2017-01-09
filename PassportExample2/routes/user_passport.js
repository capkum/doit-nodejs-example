module.exports = function(app, passport) {
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
    successRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash: true
  }));


  // 프로필 링크 - 먼저 로그인 여부를 확인할 수 있도록 isLoggedIn 미들웨어 실행
  app.get('/profile', isLoggedIn, function(req, res) {
    if (!req.isAuthenticated()) {
      res.redirect('/');

    } else {
      console.log('/profile 패스 요청됨.');
      console.dir(req.user);
      if (Array.isArray(req.user)) {
        res.render('profile.ejs', {
          user: req.user[0]._doc
        });
      } else {
        res.render('profile.ejs', {
          user: req.user
        });
      }
    }
  });

  // 로그아웃
  app.get('/logout', function(req, res) {
    console.log('/logout 패스 요청됨.');
    req.logout();
    res.redirect('/');
  });

  // passport facebook인증
  app.get('/auth/facebook', passport.authenticate('facebook', {
    scope: 'email',
  }));

  //passport facebook 인증 callback
  app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/profile',
    failureRedirect: '/',
  }));


  // 로그인 여부를 알 수 있도록 하는 미들웨어
  function isLoggedIn(req, res, next) {
  	console.log('isLoggedIn 미들웨어 호출됨.');

  	if (req.isAuthenticated()) {
  		return next();
  	}

  	res.redirect('/');
  }

};
