var FacebookStrategy = require('passport-facebook').Strategy;
var config = require('../config');

module.exports = function(app, passport) {
  return new FacebookStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret,
    callbackURL: config.facebook.callbackURL,
    profileFields: ['id', 'emails', 'gender', 'link', 'locale', 'name',
      'timezone', 'updated_time', 'verified'
    ],
  }, function(accessToken, refreshToken, profile, done) {
    console.log('passportsㅇ의 facebook 호출됨');
    console.dir(profile);

    var options = {
      criteria: {
        'facebook.id': profile.id,
      }
    };

    var database = app.get('database');
    database.UserModel.load(options, function(err, user) {
      if (err) {
        return done(err);
      }

      if (!user) {
          user = new database.UserModel({
          name: profile.name.familyName + profile.name.givenName ,
          email: profile.emails[0].value,
          provider: 'facebook',
          facebook: profile._json,
        });
      }

      user.save(function(err) {
        if (err) {
          console.log(err);
        }
        return done(err, user);
      });
    });
  });
};
