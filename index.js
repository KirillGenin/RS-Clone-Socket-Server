const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = require('cors');

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  }
});

app.use(cors({ origin: '*' })); // CORS

app.get('/', (req, res) => {
  res.send('Приложение запущено');
});

const PORT = process.env.PORT ?? 5000;

server.listen(PORT, () => {
  console.log(`listening on PORT: ${PORT}`);
});


io.on('connection', (socket) => {
  console.log('a new user connected, ID: ' + socket.id);
  
  let userName;

  socket.on('disconnect', () => {
    console.log(`user ID: ${socket.id} is disconnect`);
  })

  socket.on('user-name', ({ message }) => {
    if (!userName) {
      userName = message;
      console.log(`${userName} присоединился к чату`);

      io.emit('add-new-user', userName);
    }
  })

  socket.on('chat', ({ message }) => {
    console.log(`${userName}: ${message}`);

    io.emit('add-new-message', userName, message);
  })
});