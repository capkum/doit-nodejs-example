var user = require('../commonModule/user4');

function showUser() {
  return user().name + ', '+  'No Group';
}

console.log('사용자 정보: %s', showUser());
