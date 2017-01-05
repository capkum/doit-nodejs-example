var user1 = require('../commonModule/user1');

function showUser() {
  return user1.getUser().name + ', ' +user1.group.name;
}

console.log('사용자 정보: %s', showUser());
