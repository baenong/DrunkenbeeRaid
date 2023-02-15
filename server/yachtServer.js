import httpServer from "./server";
import SocektIO from "socket.io";

// 개선사항
// 데굴데굴버튼 채팅이랑 안 겹치게 위치 조정좀
// 채팅 접기 펴기?
// 현재 입장인원 몇명인지, 누구 들어와있는지 표시
// 입장화면에서 게임중인지 확인기능

const yachtServer = SocektIO(httpServer);
const roomName = "Drunken Yacht";

const nicknames = new Map();

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
  socket.on("initial_load", (done) => {
    done(gameSync);
  });

  socket.on("enter_room", (nickName, done) => {
    if (!nicknames.has(nickName)) {
      socket.join(roomName);
      socket["nickname"] = nickName;
      nicknames.set(nickName, socket.id);

      if (countMember() < 3) {
        gameSync.player.push(nickName);
        gameSync.dices = [];
        socket["state"] = "플레이어";
      } else {
        socket["state"] = "관전자";
      }
      yachtServer.emit("waiting_update", gameSync);
      socket
        .to(roomName)
        .emit("enter_room", socket.nickname, socket.state, gameSync.player);
      done(true, socket.state, gameSync.player);
    } else {
      done(false);
    }
  });

  socket.on("new_message", (msg, done) => {
    if (msg === "/help" || msg === "/?") {
      const info = `Ones ~ Sixes : 각 주사위 눈의 합
      bonus : ones ~ sixes 점수 합이 63점 이상일 때 35점
      four of a kind : 동일한 눈 4개가 나온 경우 주사위 5개의 합
      full house : 같은 눈 3개 + 같은 눈 2개
      little straight : 4개 연속인 경우(1234, 2345, 3456) 15점
      bit straight : 5개 연속인 경우(12345, 23456) 30점
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
      const logoutPlayer = gameSync.player.indexOf(socket.nickname);
      logoutPlayer === 0
        ? (gameSync.scores1["total"] = -1)
        : (gameSync.scores2["total"] = -1);
      socket.to(roomName).emit("game_over", gameSync);
    } else {
      socket.to(roomName).emit("bye", socket.nickname);
    }
  });

  socket.on("disconnect", () => {
    nicknames.delete(socket.nickname);
    if (countMember() === undefined) {
      gameSync.player = [];
      gameSync.current = 0;
      gameSync.scores1 = { total: 0 };
      gameSync.scores2 = { total: 0 };
      gameSync.dices = [];
      gameSync.remain = 3;
      gameSync.turn = 0;
      yachtServer.emit("waiting_update", gameSync);
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

  socket.on("score_input", (selected, resultScore, acesbonus) => {
    if (gameSync.current === 0) {
      gameSync.scores1[selected] = resultScore;
      gameSync.scores1["bonus"] = acesbonus;
      gameSync.scores1["total"] =
        gameSync.scores1["total"] + resultScore + acesbonus;
    } else {
      gameSync.scores2[selected] = resultScore;
      gameSync.scores2["bonus"] = acesbonus;
      gameSync.scores2["total"] =
        gameSync.scores2["total"] + resultScore + acesbonus;
    }
    gameSync.dices = [];
    socket.to(roomName).emit("score_input", selected, resultScore, acesbonus);
  });

  socket.on("crowd_entered", (done) => {
    done(gameSync);
  });

  socket.on("dice_selected", (idx, done) => {
    socket.to(roomName).emit("dice_selected", idx);
    done();
  });
});
