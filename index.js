import { io } from "socket.io-client";
import { Server } from "socket.io";
import express from "express";
import http from "http";

const app = express();
const server = http.createServer(app);
const ioServer = new Server(server);

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Truco Paulista Online - Servidor Ativo");
});

let salas = {};

ioServer.on("connection", (socket) => {
  console.log("Novo jogador conectado", socket.id);

  socket.on("criar_sala", (codigo) => {
    if (!salas[codigo]) {
      salas[codigo] = { jogadores: [socket.id], pontos: [0, 0] };
      socket.join(codigo);
      socket.emit("sala_criada", codigo);
    }
  });

  socket.on("entrar_sala", (codigo) => {
    if (salas[codigo] && salas[codigo].jogadores.length < 4) {
      salas[codigo].jogadores.push(socket.id);
      socket.join(codigo);
      ioServer.to(codigo).emit("atualizar_jogadores", salas[codigo].jogadores);
    }
  });

  socket.on("jogar_carta", (codigo, carta) => {
    ioServer.to(codigo).emit("carta_jogada", socket.id, carta);
  });

  socket.on("disconnect", () => {
    for (let codigo in salas) {
      salas[codigo].jogadores = salas[codigo].jogadores.filter((id) => id !== socket.id);
      if (salas[codigo].jogadores.length === 0) {
        delete salas[codigo];
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
