import httpServer from "./server";
import SocektIO from "socket.io";
import Yacht from "./models/Yacht.js";

// 개선사항
// 채팅 접기 펴기?
// 현재 입장인원 몇명인지, 누구 들어와있는지 표시

const yachtServer = SocektIO(httpServer);
const roomName = "Drunken Yacht";

const nicknames = new Map();

const emoticons = {
  깡: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9hwz-Ko7wuhiobEtk3rG3dURfNR4VvhHqrvmX9ISrzRPmDRReDiC0u3mi3Tp-Opx1n34&usqp=CAU",
  감사: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTl5LuRvGolooKSYNIAv6EvCWnBTy4Tdj339zJ0oTNcc5NJNA1--WCM8TBZdDchaFhcSfA&usqp=CAU",
  꺼억: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdCh26sQKuURTRAfR5qAD3B62UT6EMfLBG6X4QKA_jkP71f2Fp9_7k2nWAjiueWmtVym0&usqp=CAU",
  드가자:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSInE6WhxXYrKkvonfbUqbbKgCeLeTe0fMMnA&usqp=CAU",
};

const gameSync = {
  player: [],
  current: 0,
  scores1: { total: 0, bonus: 0 },
  scores2: { total: 0, bonus: 0 },
  dices: [0, 0, 0, 0, 0],
  remain: 3,
  turn: 0,
};

const countMember = () => {
  return yachtServer.sockets.adapter.rooms.get(roomName)?.size;
};

const sortScores = (target) => {
  const scoreNames = [
    "total",
    "ones",
    "twos",
    "threes",
    "fours",
    "fives",
    "sixes",
    "fourofakind",
    "fullhouse",
    "littlestraight",
    "bigstraight",
    "yacht",
    "choice",
    "bonus",
  ];
  const temp = {};
  scoreNames.map((elem) => {
    temp[elem] = target[elem];
  });
  return Object.values(temp);
};

const saveRecord = async () => {
  try {
    const scores1 = sortScores(gameSync.scores1);
    const scores2 = sortScores(gameSync.scores2);
    const winner =
      scores1[0] > scores2[0] ? 1 : scores1[0] === scores2[0] ? 0 : 2;
    await Yacht.create({
      player1: gameSync.player[0],
      player2: gameSync.player[1],
      scores1: scores1,
      scores2: scores2,
      winner: winner,
    });
  } catch (e) {
    console.error(e);
  }
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
    } else if (msg === "/emoticon") {
      const keys = Object.keys(emoticons);
      let info = "";
      keys.forEach((key) => {
        info = `${info}
        ${key}`;
      });
      done(info);
    } else if (msg.charAt(0) === "[") {
      let emoticon = "";
      const keys = Object.keys(emoticons);
      for (let idx = 0; idx < keys.length; idx++) {
        if (msg.includes(keys[idx])) {
          emoticon = emoticons[keys[idx]];
          break;
        }
      }
      if (emoticon !== "") {
        done("emoticon", emoticon);
        socket.to(roomName).emit("new_emoticon", socket.nickname, emoticon);
      }
    } else {
      done();
      socket.to(roomName).emit("new_message", socket.nickname, msg);
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
      saveRecord();
      socket.to(roomName).emit("game_over", gameSync);
    } else {
      done(false);
      socket.to(roomName).emit("turn_over", current);
    }
  });

  socket.on("score_input", (selected, resultScore, acesbonus, truebonus) => {
    const currScores =
      gameSync.current === 0 ? gameSync.scores1 : gameSync.scores2;
    currScores[selected] = resultScore;
    currScores["bonus"] = truebonus;
    currScores["total"] += resultScore + acesbonus;
    gameSync.dices = [];
    socket
      .to(roomName)
      .emit("score_input", selected, resultScore, acesbonus, truebonus);
  });

  socket.on("crowd_entered", (done) => {
    done(gameSync);
  });

  socket.on("dice_selected", (idx, done) => {
    socket.to(roomName).emit("dice_selected", idx);
    done();
  });
});
