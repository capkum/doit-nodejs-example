var express = require('express');
var path = require('path');
// var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
var expressErrorHandler = require('express-error-handler');
var mongodb = require('mongodb');
var mongoose = require('mongoose');
var app = express();
var crypto = require('crypto');
var route_loader = require('./routes/route_loader');
var socketio = require('socket.io');
var cors = require('cors');

// Passport
var passport = require('passport');
var flash = require('connect-flash');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressSession({
  secret: 'my key',
  resave: true,
  saveUninitialized: true
}));

// Passport 사용자 설정
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// cors
app.use(cors);

// 라우터와 디비연결 및 호출 모듈화
route_loader.init(app);

var configPassport = require('./config/passport');
configPassport(app, passport);

var userPassport = require('./routes/user_passport');
userPassport(app, passport);

// ..
var errorHandler = expressErrorHandler({
  static: {
    '404': './public/html/404.html'
  }
});

var login_ids = {};
// socketSet
app.socketSet = io => {
  io.sockets.on('connection', (socket) => {
    console.log('connection info :', socket.request.connection._peername);
    socket.remoteAddress = socket.request.connection._peername.address;
    socket.remotePort = socket.request.connection._peername.port;

    // 메시지를 받음
    socket.on('message', message => {
      console.log('message 이벤트를 받았습니다.');
      console.log(message);

      if (message.recepient == 'All') {
        console.dir('나를 포함한 모든 클라이언트에게 message이벤트를 전송합니다.');
        io.sockets.emit('message', message);

      } else {
        // 1:1 chat
        if (login_ids[message.recepient]) {
          io.sockets.connected[login_ids[message.recepient]].emit(
            'message', message);

          // 응답 메시지 전송
          sendResponse(socket, 'message', '200', '메시지를 전송했습니다.');
        } else {
          // 응답 메시지 전송
          sendResponse(socket, 'login', '404',
            '상대방의 로그인 ID를 찾을 수 없습니다.');
        }
      }
    });

    // login
    socket.on('login', login => {
      console.log('login 이벤트를 받았습니다.');
      console.dir(login);

      // 기존 클라이언트 ID가 없으면 클라이언트 ID를 맵에 추가
      console.log('접속한 소켓의 ID :' + socket.id);
      login_ids[login.id] = socket.id;
      socket.login_id = login.id;

      console.log('접속한 클라이언트 ID 개수: %d', Object.keys(login_ids).length);

      // 응답
      sendResponse(socket, 'login', 200, '로그인되었습니다.');
    });

    // logout
    socket.on('logout', logout => {
      console.log('logout 이벤트를 받았습니다.');
      console.dir(logout);
      delete login_ids[logout.id];

      console.log('접속한 클라이언트 ID 개수: %d', Object.keys(login_ids).length);

      // 응답
      sendResponse(socket, 'logout', 200, '로그아웃 되었습니다..');
    });

    // group chat
    socket.on('room', function(room) {
      console.log('room 이벤트를 받았습니다.');
      console.dir(room);

      if (room.command === 'create') {

        if (io.sockets.adapter.rooms[room.roomId]) { // 방이 이미 만들어져 있는 경우
          console.log('방이 이미 만들어져 있습니다.');

        } else {
          console.log('방을 새로 만듭니다.');

          socket.join(room.roomId);

          let curRoom = io.sockets.adapter.rooms[room.roomId];
          curRoom.id = room.roomId;
          curRoom.name = room.roomName;
          curRoom.owner = room.roomOwner;
        }

      } else if (room.command === 'update') {
        // 방이  만들어져 있는 경우
        if (io.sockets.adapter.rooms[room.roomId]) {
          let curRoom = io.sockets.adapter.rooms[room.roomId];
          curRoom.id = room.roomId;
          curRoom.name = room.roomName;
          curRoom.owner = room.roomOwner;
          
        } else {
          // 방이  만들어져 있지 않은 경우
          console.log('방이 만들어져 있지 않습니다.');

        }

      } else if (room.command === 'delete') {

        socket.leave(room.roomId);

        if (io.sockets.adapter.rooms[room.roomId]) { // 방이  만들어져 있는 경우
          delete io.sockets.adapter.rooms[room.roomId];
        } else { // 방이  만들어져 있지 않은 경우
          console.log('방이 만들어져 있지 않습니다.');

        }
      }

      var roomList = getRoomList(io);
      var output = {command:'list', rooms:roomList};
      console.log('클라이언트로 보낼 데이터 : ' + JSON.stringify(output));

      io.sockets.emit('room', output);

    });

  });
};

sendResponse = (socket, command, code, message) => {
  var statuObj = {
    command: command,
    code: code,
    message: message,
  };
  socket.emit('response', statuObj);
};

// room list
getRoomList = (io) => {
  console.dir(io.sockets.adapter.rooms);

  var roomList = [];

  Object.keys(io.sockets.adapter.rooms).forEach(function(roomId) {
    // for each room
    console.log('current room id : ' + roomId);
    var outRoom = io.sockets.adapter.rooms[roomId];

    // find default room using all attributes
    var foundDefault = false;
    var index = 0;
    Object.keys(outRoom).forEach(function(key) {
      console.log('#' + index + ' : ' + key + ', ' + outRoom[key]);

      // default room
      if (roomId == key) {
        foundDefault = true;
        console.log('this is default room.');
      }
      index++;
    });

    if (!foundDefault) {
      roomList.push(outRoom);
    }
  });

  console.log('[ROOM LIST]');
  console.dir(roomList);

  return roomList;
};


app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

module.exports = app;
