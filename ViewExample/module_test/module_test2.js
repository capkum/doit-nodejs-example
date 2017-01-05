var user = require('../commonModule/user2');

console.dir(user);

function showUser() {
  return user.getUser().name + ',' + user.group.name;
}

console.log(showUser());
