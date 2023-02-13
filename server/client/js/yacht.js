const socket = io();

// enter
const welcome = document.getElementById("welcome");
const form = welcome.querySelector("#enterRoom");
const currentGame = welcome.querySelector("#currentGame");

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

const diceAnimation = [
  { transform: "rotate(0deg)" },
  { transform: "rotate(360deg)" },
  { transform: "rotate(720deg)" },
];

const yachtAnimation = [
  { backgroundColor: "orange" },
  { backgroundColor: "purple" },
  { backgroundColor: "orange" },
  { backgroundColor: "purple" },
  { backgroundColor: "orange" },
];

const aniDuration = 1000;
const yachtDuration = 2000;

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

const addMessage = (message, color) => {
  const ul = chat.querySelector("ul");
  const container = chat.querySelector(".chat-container");
  const li = document.createElement("li");
  li.innerText = message;
  if (color) {
    li.style.color = color;
  }
  const recent =
    container.scrollHeight - container.clientHeight === container.scrollTop
      ? true
      : false;
  ul.appendChild(li);
  if (recent) {
    container.scrollTop = container.scrollHeight;
  } else {
    container.animate(
      [{ backgroundColor: "lime" }, { backgroundColor: "black" }],
      1500
    );
  }
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
  socket.disconnect();
  setTimeout(() => {
    location.reload();
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
  addMessage(msg, "lime");
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
          resultScore = sumDice;
          break;
        }
      }
      break;
    case "fullhouse":
      let twice = false;
      let threeTimes = false;
      dices.forEach((dice) => {
        if (dice > 2) {
          threeTimes = true;
          if (dice === 5) twice = true;
        } else if (dice > 1) {
          twice = true;
        }
      });
      resultScore = threeTimes && twice ? sumDice : 0;
      break;
    case "littlestraight":
      let islittle = 0;
      for (let idx = 0; idx < 6; idx++) {
        if (islittle < 4) {
          if (dices[idx] === 0) islittle = 0;
          else islittle++;
        }
      }
      resultScore = islittle > 3 ? 15 : 0;
      break;
    case "bigstraight":
      let isbig = 0;
      for (let idx = 0; idx < 6; idx++) {
        if (isbig < 5) {
          if (dices[idx] === 0) isbig = 0;
          else isbig++;
        }
      }
      resultScore = isbig > 4 ? 30 : 0;
      break;
    case "yacht":
      dices.forEach((dice) => {
        if (dice === 5) {
          resultScore = 50;
          document.body.animate(yachtAnimation, yachtDuration);
        }
      });
      break;
    case "choice":
      resultScore = sumDice;
      break;
  }
  selected.innerText = resultScore;
  return resultScore;
};

const calcBonus = (whos) => {
  const whosScore = whos === 0 ? ulScores1 : ulScores2;
  const spanBonus = whosScore.querySelector(".bonus .score");
  if (Number(spanBonus.innerText) === 0) {
    const aces = [".ones", ".twos", ".threes", ".fours", ".fives", ".sixes"];
    let sumAces = 0;
    aces.forEach((ace) => {
      console.log(`${ace} .score`);
      const tempScore = whosScore.querySelector(`${ace} .score`).innerText;
      if (tempScore !== "") sumAces = sumAces + Number(tempScore);
    });
    if (sumAces > 62) {
      spanBonus.innerText = 35;
      spanBonus.classList.add("already");
      return 35;
    }
    return 0;
  } else {
    return 35;
  }
};

const addTotalScore = (whos, addedScore) => {
  const selected =
    whos === 0
      ? scoreboard1.querySelector(".board-score")
      : scoreboard2.querySelector(".board-score");
  if (selected.innerText === "") selected.innerText = 0;
  selected.innerText = Number(selected.innerText) + addedScore;
};

const reloadScore = (gameSync, whos) => {
  const spanScores = whos === 0 ? ulScores1 : ulScores2;
  const arrayScores = whos === 0 ? gameSync.scores1 : gameSync.scores2;
  const boardScores = whos === 0 ? scoreboard1 : scoreboard2;
  boardScores.querySelector(".board-score").innerText = arrayScores["total"];
  spanScores.childNodes.forEach((liScore) => {
    if (arrayScores[liScore.className] === undefined) {
      liScore.querySelector(".score").innerText = "";
    } else {
      liScore.querySelector(".score").innerText =
        arrayScores[liScore.className];
      liScore.classList.add("already");
    }
  });
};

const handleScoreClick = (liScore, whos) => {
  if (!liScore.classList.contains("bonus")) {
    if (!liScore.classList.contains("already")) {
      const spanScore = liScore.querySelector(".score");
      whosturn();
      if (myTurn & (current === whos)) {
        const selectScore = calcScore(spanScore);
        const acesbonus = calcBonus(whos);
        socket.emit(
          "score_input",
          spanScore.parentNode.className,
          selectScore,
          acesbonus
        );
        const total = selectScore + acesbonus;
        addTotalScore(whos, total);
        turnover();
        liScore.classList.add("already");
        rollButton.classList.add("hidden");
      }
    }
  }
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const inputNick = form.querySelector("#nickname");
  socket.emit("enter_room", inputNick.value, (isUnique, state, player) => {
    if (isUnique) {
      welcome.classList.add("hidden");
      gameScreen.classList.remove("hidden");

      players = player;
      isPlayer = state === "플레이어" ? true : false;

      changeTitle();
      if (!isPlayer) {
        setAnnounce("관전자로 입장했습니다.");
        playground.classList.remove("hidden");
        socket.emit("crowd_entered", (gameSync) => {
          gameSync.current === 0
            ? scoreboard1.classList.add("myturn")
            : scoreboard2.classList.add("myturn");
          current = gameSync.current;
          ulDice.childNodes.forEach((liDice, idx) => {
            liDice.innerText =
              gameSync.dices[idx] === undefined ? "0" : gameSync.dices[idx];
          });
          leftover.innerText = gameSync.remain;
          reloadScore(gameSync, 0);
          reloadScore(gameSync, 1);
        });
      }
    } else {
      alert("중복된 닉네임");
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
      addMessage(info, "gold");
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
        liDice.animate(diceAnimation, aniDuration);
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
      const selected = event.target;
      const idx = [...selected.parentElement.children].indexOf(selected);
      socket.emit("dice_selected", idx, () => {
        selected.classList.toggle("reroll");
      });
    }
  })
);

ulScores1.childNodes.forEach((liScore) => {
  liScore.addEventListener("click", () => {
    handleScoreClick(liScore, 0);
  });
});

ulScores2.childNodes.forEach((liScore) => {
  liScore.addEventListener("click", () => {
    handleScoreClick(liScore, 1);
  });
});

const stateUpdate = (gameSync) => {
  switch (gameSync.player.length) {
    case 2:
      currentGame.innerText = `게임 진행 중(${gameSync.player[0]} vs ${gameSync.player[1]})`;
      break;
    case 1:
      currentGame.innerText = `게임 대기중 (대기자 : ${gameSync.player[0]})`;
      break;
    default:
      currentGame.innerText = `입장 대기중`;
  }
};

socket.emit("initial_load", (gameSync) => {
  stateUpdate(gameSync);
});

socket.on("waiting_update", (gameSync) => stateUpdate(gameSync));

// request
socket.on("enter_room", (nick, state, player) => {
  addMessage(`${state}(${nick})이(가) 들어왔습니다.`, "lime");
  if (state === "플레이어") {
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

socket.on("dice_selected", (idx) => {
  ulDice.childNodes[idx].classList.toggle("reroll");
});

socket.on("dice_rolled", (dices) => {
  for (let idx = 0; idx < 5; idx++) {
    const rolledDice = ulDice.childNodes[idx];
    rolledDice.innerText = dices[idx];
    if (rolledDice.classList.contains("reroll")) {
      rolledDice.animate(diceAnimation, aniDuration);
      rolledDice.classList.remove("reroll");
    }
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

socket.on("score_input", (selected, resultScore, acesbonus) => {
  addTotalScore(current, resultScore + acesbonus);
  const spanScore = current === 0 ? ulScores1 : ulScores2;
  spanScore.querySelector(`.${selected} .score`).innerText = resultScore;
  spanScore.querySelector(`.${selected}`).classList.add("already");
  spanScore.querySelector(`.bonus .score`).innerText = acesbonus;
  if (selected === "yacht" && resultScore === 50) {
    document.body.animate(yachtAnimation, yachtDuration);
  }
  if (acesbonus !== 0)
    spanScore.querySelector(".bonus").classList.add("already");
});

socket.on("game_over", (gameSync) => {
  gameover(gameSync);
});

socket.on("bye", (nick) => {
  addMessage(`${nick}이(가) 떠났습니다.`, "lime");
});
