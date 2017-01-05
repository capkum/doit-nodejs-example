var user = require('../commonModule/user3');

function showUser() {
  return user.getUser().name + ',' + user.group.name;
}

console.log('사용자정보: %s',showUser());
