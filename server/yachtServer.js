import httpServer from "./server";
import SocketIO from "socket.io";

const yachtServer = SocketIO(httpServer);

const getPublicRooms = () => {
  const { sids, rooms } = yachtServer.sockets.adapter;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
};

yachtServer.on("connection", (socket) => {
  socket.on("enter_room", (roomName, nickName, done) => {
    socket.join(roomName);
    console.log(socket.rooms);
    socket["nickname"] = nickName;
    done();
    socket.to(roomName).emit("welcome", socket.nickname);
  });

  socket.on("disconnecting", () => {
    console.log(socket.rooms);
    socket.rooms.forEach((room) => {
      socket.to(room).emit("bye", socket.nickname);
    });
  });

  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
    done();
  });
});
