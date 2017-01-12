var crypto = require('crypto');

var Schema = {};

Schema.createSchema = function(mongoose) {
  var UserSchema = mongoose.Schema({
    email: {
      type: String,
      'default': '',
    },
    hashed_password: {
      type: String,
      'default': '',
    },
    salt: {
      type: String,
    },
    name: {
      type: String,
      index: 'hashed',
      'default': ''
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
    provider: {
      type: String,
      'default': '',
    },
    authToken: {
      type: String,
      'default': '',
    },
    facebook: {},
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
      return crypto.createHmac('sha1', this.salt).update(plainText).digest(
        'hex');
    }
  });

  UserSchema.method('makeSalt', function() {
    return Math.round((new Date().valueOf() * Math.random())) + '';
  });

  UserSchema.method('authenticate', function(plainText, inSalt,
    hashed_password) {
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

  // UserSchema.path('name').validate(function(name) {
  //   return name.length;
  // }, 'name 컬럼이 없습니다.');
  //
  // UserSchema.path('email').validate(function(email) {
  //   return email.length;
  // }, 'email 칼럼의 값이 없습니다.');

  // UserSchema.path('hashed_password').validate(function(hashed_password) {
  //   return hashed_password.length;
  // }, 'hashed_password 칼럼의 값이 없습니다.');

  UserSchema.static('findByEmail', function(email, callback) {
    return this.find({
      'email': email
    }, callback);
  });

  UserSchema.static('findAll', function(callback) {
    return this.find({}, callback);
  });

  UserSchema.static('load', function(options, callback) {
		options.select = options.select || 'name';
	    this.findOne(options.criteria)
	      .select(options.select)
	      .exec(callback);
	});

  console.log('UserSchema 정의함');

  return UserSchema;
};

module.exports = Schema;
