const express = require('express');
var app = express();

app.use(express.static(__dirname + '/public'));
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(8080);

//Now we use ngrok

io.on('connection', function (socket) {
  console.log(`[SERVER]: New connection with socket id: "${socket.id}"`);

  socket.on('join', function (data) {
    if (!data.roomId) {
      console.warn(`[SERVER]: Missing roomId for socket id: "${socket.id}"`);
      return socket.emit('error', 'Missing roomId');
    }
    
    const room = io.sockets.adapter.rooms.get(data.roomId);
    const numClients = room ? room.size : 0;
    console.log(`[SERVER]: Socket id: "${socket.id}" joining room with id: "${data.roomId}" (current clients: ${numClients})`);


    if (numClients >= 2) {
      console.log(`[SERVER]: Room with id: "${data.roomId}" is full`);
      socket.emit('full');
      return;
    }

    socket.join(data.roomId);
    socket.room = data.roomId;

    if (numClients === 0) {
      console.log(`[SERVER]: Room with id "${data.roomId}" created, with socket id: "${socket.id}"`);
      socket.emit('init');
    } else if (numClients === 1) {
      console.log(`[SERVER]: Room with id "${data.roomId}" ready. One participant in`);
      io.to(data.roomId).emit('ready');
    }
  });

  socket.on('signal', (data) => {
    if (socket.room && (data && data.desc)) {
      console.log(`[SERVER]: Relaying signal in room ${socket.room}, with socket id: ${socket.id}`);
      io.to(socket.room).emit('desc', data.desc);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[SERVER]: Socket with id: "${socket.id}" disconnected`);
    if (socket.room) {
      console.log(`[SERVER]: Notifying room "${socket.room}" of disconnection`);
      io.to(socket.room).emit('disconnected');
    }
  });
});