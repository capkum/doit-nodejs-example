var express = require('express');
var router = express.Router();
var userDao = require('../commonModule/user_dao');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// login
router.post('/process/login', userDao.login);

// add user
router.post('/process/adduser', userDao.addUser);

// user list
router.post('/process/listuser', userDao.userList);

module.exports = router;
