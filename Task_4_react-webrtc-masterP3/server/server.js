const express = require('express');
var app = express();

app.use(express.static(__dirname + '/public'));
var server = require('http').Server(app);
var io = require('socket.io')(server);



server.listen(8080);

//Now we use ngrok

io.on('connection', function (socket) {
  socket.on('join', function (data) {
    if (!data.roomId) return socket.emit('error', 'Missing roomId');
    
    const room = io.sockets.adapter.rooms.get(data.roomId);
    const numClients = room ? room.size : 0;

    if (numClients >= 2) {
      socket.emit('full');
      return;
    }

    socket.join(data.roomId);
    socket.room = data.roomId;

    if (numClients === 0) {
      socket.emit('init');
    } else if (numClients === 1) {
      io.to(data.roomId).emit('ready');
    }
  });

  socket.on('signal', (data) => {
    if (socket.room && (data && data.desc)) {
      io.to(socket.room).emit('desc', data.desc);
    }
  });

  socket.on('disconnect', () => {
    if (socket.room) {
      io.to(socket.room).emit('disconnected');
    }
  });
});