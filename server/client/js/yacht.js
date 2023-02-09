const socket = io();

// enter
const welcome = document.getElementById("welcome");
const form = welcome.querySelector("#enterRoom");

// game board
const gameScreen = document.getElementById("gameScreen");
const announce = gameScreen.querySelector("#announce span");
const chat = gameScreen.querySelector("#chat");
const board = gameScreen.querySelector("#yachtBoard");
const gameStart = board.querySelector(".game-start");

// playground
const playground = board.querySelector("#playground");
const rollButton = playground.querySelector("button");
const ulDice = playground.querySelector(".dices");
const leftover = playground.querySelector(".leftover");

// player
const scoreboard1 = board.querySelector("#player1Score");
const scoreboard2 = board.querySelector("#player2Score");
const ulScores1 = scoreboard1.querySelector("ul");
const ulScores2 = scoreboard2.querySelector("ul");

let nickName;
let players = [];
let current;
let myTurn;
let isPlayer;

const changeTitle = () => {
  const player1Name = scoreboard1.querySelector(".board-title");
  const player2Name = scoreboard2.querySelector(".board-title");
  if (players.length > 0) {
    player1Name.innerText = players[0];
    player2Name.innerText = "Waiting...";
  }
  if (players.length === 2) {
    const roomTitle = gameScreen.querySelector("h3");
    roomTitle.innerText = `${players[0]} vs ${players[1]}`;
    player2Name.innerText = players[1];
    if (isPlayer) gameStart.classList.remove("hidden");
  }
};

const addMessage = (message) => {
  const ul = chat.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = message;
  ul.appendChild(li);
  ul.scrollTop = ul.scrollHeight;
};

const setAnnounce = (msg) => {
  announce.innerText = msg;
};

const whosturn = () => {
  myTurn = players[current] === nickName ? true : false;
};

const turnover = () => {
  current = current === 0 ? 1 : 0;
  scoreboard1.classList.toggle("myturn");
  scoreboard2.classList.toggle("myturn");
  socket.emit("turn_over", current, (isGameover, gameSync) => {
    if (isGameover) {
      gameover(gameSync);
    } else {
      setAnnounce(`${players[current]}'s turn`);
      resetDice();
    }
  });
};

const gameover = (gameSync) => {
  const score1 = gameSync.scores1["total"];
  const score2 = gameSync.scores2["total"];
  if (score1 === score2) {
    setAnnounce("무승부! 5초 뒤 연결이 종료됩니다.");
  } else if (score1 > score2) {
    setAnnounce(`${gameSync.player[0]} 승리! 5초 뒤 연결이 종료됩니다.`);
  } else {
    setAnnounce(`${gameSync.player[1]} 승리! 5초 뒤 연결이 종료됩니다.`);
  }
  setTimeout(() => {
    socket.disconnect();
  }, 5000);
};

const getRandomDice = () => {
  return Math.floor(Math.random() * 6) + 1;
};

const resetDice = () => {
  leftover.innerText = 3;
  ulDice.childNodes.forEach((liDice) => {
    liDice.innerText = "0";
  });
};

const refreshLeftOver = () => {
  leftover.innerText = Number(leftover.innerText) - 1;
};

const rerollable = () => {
  return leftover.innerText !== "0" ? true : false;
};

const startGame = (msg) => {
  addMessage(msg);
  playground.classList.remove("hidden");
  gameStart.classList.add("hidden");
  setAnnounce(`${players[0]}'s turn`);
  scoreboard1.classList.add("myturn");
  current = 0;
  whosturn();
  if (myTurn) rollButton.classList.remove("hidden");
};

const calcScore = (selected) => {
  const selectedCase = selected.parentNode.className;
  let resultScore = 0;
  const dices = [0, 0, 0, 0, 0, 0];
  let sumDice = 0;

  ulDice.childNodes.forEach((liDice) => {
    const diceValue = Number(liDice.innerText);
    if (diceValue !== 0) {
      dices[diceValue - 1]++;
    }
    sumDice = sumDice + diceValue;
  });

  switch (selectedCase) {
    case "ones":
      resultScore = dices[0];
      break;
    case "twos":
      resultScore = dices[1] * 2;
      break;
    case "threes":
      resultScore = dices[2] * 3;
      break;
    case "fours":
      resultScore = dices[3] * 4;
      break;
    case "fives":
      resultScore = dices[4] * 5;
      break;
    case "sixes":
      resultScore = dices[5] * 6;
      break;
    case "fourofakind":
      for (let idx = 0; idx < 6; idx++) {
        if (dices[idx] > 3) {
          resultScore = (idx + 1) * 4;
          break;
        }
      }
      break;
    case "fullhouse":
      // 2개, 3개인경우
      let twice = false;
      let threeTimes = false;
      dices.forEach((dice) => {
        if (dice > 2) {
          threeTimes = true;
        } else if (dice > 1) {
          twice = true;
        }
      });
      resultScore = threeTimes && twice ? sumDice : 0;
      break;
    case "littlestraight":
      let islittle = true;
      if (dices[5] > 0) {
        islittle = false;
      } else {
        for (let idx = 0; idx < 5; idx++) {
          if (dices[idx] > 1) {
            islittle = false;
          }
        }
      }
      resultScore = islittle ? 30 : 0;
      break;
    case "bigstraight":
      let isbig = true;
      if (dices[0] > 0) {
        isbig = false;
      } else {
        for (let idx = 1; idx < 6; idx++) {
          if (dices[idx] > 1) {
            isbig = false;
          }
        }
      }
      resultScore = isbig ? 30 : 0;
      break;
    case "yacht":
      dices.forEach((dice) => {
        if (dice === 5) {
          resultScore = 50;
        }
      });
      break;
    case "choice":
      resultScore = sumDice;
      break;
  }
  selected.innerText = resultScore;
  socket.emit("score_input", selectedCase, resultScore);
  return resultScore;
};

const addTotalScore = (selected, addedScore) => {
  selected.innerText = Number(selected.innerText) + addedScore;
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const inputNick = form.querySelector("#nickname");
  socket.emit("enter_room", inputNick.value, (state, player) => {
    welcome.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    players = player;
    isPlayer = state === "player" ? true : false;

    changeTitle();
    if (!isPlayer) {
      setAnnounce("현재 관전기능 고민중");
      playground.classList.remove("hidden");
      socket.emit("crowd_entered", (gameSync) => {
        ulDice.childNodes.forEach((liDice, idx) => {
          liDice.innerText =
            gameSync.dices[idx] === undefined ? "0" : gameSync.dices[idx];
        });
        leftover.innerText = gameSync.remain;
        ulScores1.childNodes.forEach((liScore) => {
          liScore.querySelector(".score").innerText =
            gameSync.scores1[liScore.className] === undefined
              ? "0"
              : gameSync.scores1[liScore.className];
        });
        scoreboard1.querySelector(".board-score").innerText =
          gameSync.scores1["total"];
        scoreboard2.querySelector(".board-score").innerText =
          gameSync.scores2["total"];
        ulScores2.childNodes.forEach((liScore) => {
          liScore.querySelector(".score").innerText =
            gameSync.scores2[liScore.className] === undefined
              ? "0"
              : gameSync.scores2[liScore.className];
        });
      });
    }
  });
  nickName = inputNick.value;
  inputNick.value = "";
});

chat.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = chat.querySelector("#message input");
  const msg = input.value;
  socket.emit("new_message", input.value, (info) => {
    addMessage(`나: ${msg}`);
    if (info) {
      addMessage(info);
    }
  });
  input.value = "";
});

gameStart.addEventListener("click", () => {
  socket.emit("game_start", (msg) => {
    startGame(msg);
  });
});

rollButton.addEventListener("click", () => {
  if (rerollable()) {
    const dices = [];
    ulDice.childNodes.forEach((liDice) => {
      if (liDice.innerText === "0" || liDice.classList.contains("reroll")) {
        liDice.innerText = getRandomDice();
        liDice.classList.remove("reroll");
      }
      dices.push(liDice.innerText);
    });
    socket.emit("dice_rolled", dices, () => {
      refreshLeftOver();
    });
  }
});

ulDice.childNodes.forEach((liDice) =>
  liDice.addEventListener("click", (event) => {
    if (rerollable() && myTurn) {
      event.target.classList.toggle("reroll");
    }
  })
);

ulScores1.childNodes.forEach((liScore) => {
  liScore.addEventListener("click", () => {
    const totalScore = scoreboard1.querySelector(".board-score");
    const spanScore = liScore.querySelector(".score");
    if (!liScore.classList.contains("already")) {
      whosturn();
      if (myTurn & (current === 0)) {
        const total = calcScore(spanScore);
        addTotalScore(totalScore, total);
        turnover();
        liScore.classList.add("already");
        rollButton.classList.add("hidden");
      }
    }
  });
});

ulScores2.childNodes.forEach((liScore) => {
  liScore.addEventListener("click", () => {
    const spanScore = liScore.querySelector(".score");
    const totalScore = scoreboard2.querySelector(".board-score");
    if (!liScore.classList.contains("already")) {
      whosturn();
      if (myTurn & (current === 1)) {
        const total = calcScore(spanScore);
        addTotalScore(totalScore, total);
        turnover();
        liScore.classList.add("already");
        rollButton.classList.add("hidden");
      }
    }
  });
});

// request
socket.on("enter_room", (nick, state, player) => {
  addMessage(`${state}(${nick}) is arrived`);
  if (state === "player") {
    players = player;
    changeTitle();
  }
});

socket.on("new_message", (msg) => {
  addMessage(msg);
});

socket.on("game_start", (msg) => {
  startGame(msg);
});

socket.on("dice_rolled", (dices) => {
  for (let idx = 0; idx < 5; idx++) {
    ulDice.childNodes[idx].innerText = dices[idx];
  }
  if (rerollable()) {
    refreshLeftOver();
  }
});

socket.on("turn_over", (next) => {
  current = next;
  setAnnounce(`${players[current]}'s turn`);
  scoreboard1.classList.toggle("myturn");
  scoreboard2.classList.toggle("myturn");
  resetDice();
  whosturn();
  if (myTurn) rollButton.classList.remove("hidden");
});

socket.on("score_input", (selected, resultScore) => {
  if (current === 0) {
    ulScores1.querySelector(`.${selected} .score`).innerText = resultScore;
    ulScores1.querySelector(`.${selected}`).classList.add("already");
    addTotalScore(scoreboard1.querySelector(".board-score"), resultScore);
  } else {
    ulScores2.querySelector(`.${selected} .score`).innerText = resultScore;
    ulScores2.querySelector(`.${selected}`).classList.add("already");
    addTotalScore(scoreboard2.querySelector(".board-score"), resultScore);
  }
});

socket.on("game_over", (gameSync) => {
  gameover(gameSync);
});

socket.on("bye", (nick) => {
  addMessage(`${nick} left`);
});
