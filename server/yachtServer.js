import httpServer from "./server";
import SocektIO from "socket.io";

const yachtServer = SocektIO(httpServer);

const roomName = "Drunken Yacht";

const gameSync = {
  player: [],
  current: 0,
  scores1: { total: 0 },
  scores2: { total: 0 },
  dices: [0, 0, 0, 0, 0],
  remain: 3,
  turn: 0,
};

const countMember = () => {
  return yachtServer.sockets.adapter.rooms.get(roomName)?.size;
};

yachtServer.on("connection", (socket) => {
  socket.on("enter_room", (nickName, done) => {
    socket.join(roomName);
    socket["nickname"] = nickName;
    if (countMember() < 3) {
      gameSync.player.push(nickName);
      gameSync.dices = [];
      socket["state"] = "player";
    } else {
      socket["state"] = "crowd";
    }
    socket
      .to(roomName)
      .emit("enter_room", socket.nickname, socket.state, gameSync.player);
    done(socket.state, gameSync.player);
  });

  socket.on("new_message", (msg, done) => {
    if (msg === "/help") {
      const info = `원본 yacht 게임 규칙을 따라갑니다.
      Ones ~ Sixes : 각 주사위 눈의 합
      four of a kind : 동일한 눈 4개가 나온 경우 그 합
      full house : 같은 눈 3개 + 같은 눈 2개
      little straight : 12345
      bit straight : 23456
      yacht : 전부 같은 눈
      choice : 나온 눈의 합`;
      done(info);
    } else {
      done();
      socket.to(roomName).emit("new_message", `${socket.nickname}: ${msg}`);
    }
  });

  socket.on("disconnecting", () => {
    if (gameSync.player.includes(socket.nickname)) {
      gameSync.player.filter((elem) => elem !== socket.nickname);
    }
    socket.to(roomName).emit("bye", socket.nickname);
  });

  socket.on("disconnect", () => {
    if (countMember() === undefined) {
      gameSync.player = [];
      gameSync.current = 0;
      gameSync.scores1 = { total: 0 };
      gameSync.scores2 = { total: 0 };
      gameSync.dices = [];
      gameSync.remain = 3;
      gameSync.turn = 0;
    }
  });

  socket.on("game_start", (done) => {
    gameSync.current = 0;
    socket.to(roomName).emit("game_start", "Game Started!");
    done("Game Started!");
  });

  socket.on("dice_rolled", (dices, done) => {
    gameSync.dices = dices;
    gameSync.remain--;
    socket.to(roomName).emit("dice_rolled", dices);
    done();
  });

  socket.on("turn_over", (current, done) => {
    gameSync.current = current;
    gameSync.remain = 3;
    gameSync.turn++;

    if (gameSync.turn === 24) {
      done(true, gameSync);
      socket.to(roomName).emit("game_over", gameSync);
    } else {
      done(false);
      socket.to(roomName).emit("turn_over", current);
    }
  });

  socket.on("score_input", (selected, resultScore) => {
    if (gameSync.current === 0) {
      gameSync.scores1[selected] = resultScore;
      gameSync.scores1["total"] = gameSync.scores1["total"] + resultScore;
    } else {
      gameSync.scores2[selected] = resultScore;
      gameSync.scores2["total"] = gameSync.scores2["total"] + resultScore;
    }
    gameSync.dices = [];
    socket.to(roomName).emit("score_input", selected, resultScore);
  });

  socket.on("crowd_entered", (done) => {
    done(gameSync);
  });
});
