var require = function() {
  var exports = {
    getUser: function () {
      return {
        id: 'test01',
        name: '소녀시대'
      };
    },
    group: {
      id: 'group01',
      name: '친구'
    }
  };

  return exports;
};

var user = require('...');

function showUser() {
  return user.getUser().name + ', ' + user.group.name;
}

console.log('사용자 정보 %s', showUser());
