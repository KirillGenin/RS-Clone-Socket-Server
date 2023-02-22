import express, { Express } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
// @ts-ignore
import AppController from './app/controller/AppController';

const app: Express = express();

app.use(cors({
  origin: '*',
}));

const server = http.createServer(app);

const PORT = process.env.PORT ?? 3000;

server.listen(PORT, () => {
  console.log(`listening on PORT: ${PORT}`);
});

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const appController = new AppController(io);

appController.listener();
