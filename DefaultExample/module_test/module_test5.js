var user = require('../commonModule/user5.js');

function showUser() {
  return user.getUser().name + ', ' + user.group.name;
}

console.log(showUser());
