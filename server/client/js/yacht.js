const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("#enterRoom");
const currentGame = welcome.querySelector("#currentGame");

const gameScreen = document.getElementById("gameScreen");
const announce = gameScreen.querySelector("#announce span");
const chat = gameScreen.querySelector("#chat");
const board = gameScreen.querySelector("#yachtBoard");
const gameStart = board.querySelector(".game-start");

const playground = board.querySelector("#playground");
const rollButton = playground.querySelector("button");
const ulDice = playground.querySelector(".dices");
const leftover = playground.querySelector(".leftover");

const scoreboard1 = board.querySelector("#player1Score");
const scoreboard2 = board.querySelector("#player2Score");
const ulScores1 = scoreboard1.querySelector("ul");
const ulScores2 = scoreboard2.querySelector("ul");

const yachtNotify = document.getElementById("yachtNotify");

let nickName;
let players = [];
let current;
let myTurn;
let isPlayer;
let getBonus = false;

const yachtDuration = 3200;

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

const addMessage = (speaker, message, color, emoticon) => {
  const ul = chat.querySelector("ul");
  const container = chat.querySelector(".chat-container");
  const li = document.createElement("li");
  const spanSpeaker = document.createElement("span");
  const spanMessage = document.createElement("span");
  let txtSpeaker = "";
  switch (speaker) {
    case "SYSTEM":
      txtSpeaker = "[SYSTEM] ";
      break;
    case "escape":
      txtSpeaker = "";
      break;
    default:
      txtSpeaker = `${speaker} : `;
  }
  spanSpeaker.innerText = txtSpeaker;
  if (color) li.style.color = color;
  if (speaker === "나") spanSpeaker.style.color = "orange";
  if (emoticon) {
    const img = document.createElement("img");
    img.src = emoticon;
    spanMessage.appendChild(img);
  } else spanMessage.innerText = message;
  li.appendChild(spanSpeaker);
  li.appendChild(spanMessage);
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
  const indicator = board.querySelector(".indicator");
  indicator.innerText = current === 0 ? "◀" : "▶";
};

const turnover = () => {
  current = current === 0 ? 1 : 0;
  scoreboard1.classList.toggle("myturn");
  scoreboard2.classList.toggle("myturn");
  whosturn();
  socket.emit("turn_over", current, (isGameover, gameSync) => {
    if (isGameover) {
      gameover(gameSync);
    } else {
      setAnnounce(`${players[current]}'s turn`);
      resetDice();
    }
  });
};

const setNotify = (msg) => {
  yachtNotify.querySelector("span").innerText = msg;
};

const gameover = (gameSync) => {
  const score1 = gameSync.scores1["total"];
  const score2 = gameSync.scores2["total"];
  if (score1 === score2) {
    setAnnounce("무승부! 5초 뒤 연결이 종료됩니다.");
    setNotify("Draw!");
  } else if (score1 > score2) {
    setAnnounce(`${gameSync.player[0]} 승리! 5초 뒤 연결이 종료됩니다.`);
    setNotify(`${gameSync.player[0]} Win!`);
  } else {
    setAnnounce(`${gameSync.player[1]} 승리! 5초 뒤 연결이 종료됩니다.`);
    setNotify(`${gameSync.player[1]} Win!`);
  }
  yachtNotify.classList.remove("hidden");
  socket.disconnect();
  setTimeout(() => {
    location.reload();
  }, 5000);
};

const getRandomDice = () => {
  return Math.floor(Math.random() * 6) + 1;
};

const getRandomAngle = () => {
  return (Math.floor(Math.random() * 3) - 1) * 360;
};

const getAngleDice = (val) => {
  if (val === 0) val = 1;
  switch (val) {
    case 1:
      return [0, 0];
    case 6:
      return [0, 180];
    default:
      return [(6 - val) * 90, 90];
  }
};

const animateDice = (diceVal) => {
  const [x, y] = getAngleDice(diceVal);

  return `transform: rotateY(${x + getRandomAngle()}deg) rotateX(${
    y + getRandomAngle()
  }deg)`;
};

const resetDice = () => {
  leftover.innerText = 3;
  ulDice.childNodes.forEach((liDice) => {
    const dice = liDice.querySelector(".dice");
    dice.dataset.value = 0;
    dice.style.cssText = animateDice(0);
  });
};

const refreshLeftOver = () => {
  leftover.innerText = Number(leftover.innerText) - 1;
};

const rerollable = () => {
  return leftover.innerText !== "0" ? true : false;
};

const startGame = (msg) => {
  addMessage("SYSTEM", msg, "lime");
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
    const diceValue = Number(liDice.querySelector(".dice").dataset.value);
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
          yachtNotify.classList.remove("hidden");
          setTimeout(() => {
            yachtNotify.classList.add("hidden");
          }, yachtDuration);
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
  if (getBonus) return 0;
  if (Number(spanBonus.dataset.value) === 0) {
    const aces = [".ones", ".twos", ".threes", ".fours", ".fives", ".sixes"];
    let sumAces = 0;
    aces.forEach((ace) => {
      sumAces =
        sumAces +
        Number(whosScore.querySelector(`${ace} .score`).dataset.value);
    });
    if (sumAces > 62) {
      spanBonus.dataset.value = 35;
      spanBonus.innerText = 35;
      spanBonus.parentElement.classList.add("already");
      getBonus = true;
      return 35;
    }
    return 0;
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
    if (
      liScore.className !== "bonus" &&
      arrayScores[liScore.className] !== undefined
    ) {
      liScore.querySelector(".score").innerText =
        arrayScores[liScore.className];
      liScore.querySelector(".score").dataset.value =
        arrayScores[liScore.className];
      liScore.classList.add("already");
    }
  });
  ulDice.childNodes.forEach((liDice) => {
    const dice = liDice.querySelector(".dice");
    dice.style.cssText = animateDice(Number(dice.dataset.value));
  });
  const indicator = board.querySelector(".indicator");
  indicator.innerText = current === 0 ? "◀" : "▶";
};

const handleScoreClick = (liScore, whos) => {
  if (leftover.innerText !== "3") {
    if (!liScore.classList.contains("bonus")) {
      if (!liScore.classList.contains("already")) {
        const spanScore = liScore.querySelector(".score");
        whosturn();
        if (myTurn & (current === whos)) {
          const selectScore = calcScore(spanScore);
          spanScore.dataset.value = selectScore;
          const acesbonus = calcBonus(whos);
          const truebonus = getBonus ? 35 : 0;
          socket.emit(
            "score_input",
            spanScore.parentNode.className,
            selectScore,
            acesbonus,
            truebonus
          );
          const total = selectScore + acesbonus;
          addTotalScore(whos, total);
          turnover();
          liScore.classList.add("already");
          rollButton.classList.add("hidden");
        }
      }
    }
  } else {
    setAnnounce("주사위를 굴려주세요");
  }
};

const searchMyboard = (scoreboard) => {
  const boardTitle = scoreboard.querySelector(".board-title");
  if (boardTitle.innerText === nickName) scoreboard.classList.add("myboard");
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
      nickName = inputNick.value;

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
            liDice.querySelector(".dice").dataset.value =
              gameSync.dices[idx] === undefined ? "0" : gameSync.dices[idx];
          });
          leftover.innerText = gameSync.remain;
          reloadScore(gameSync, 0);
          reloadScore(gameSync, 1);
        });
      } else {
        searchMyboard(scoreboard1);
        searchMyboard(scoreboard2);
      }
    } else {
      alert("중복된 닉네임");
      inputNick.value = "";
    }
  });
});

chat.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = chat.querySelector("#message input");
  const msg = input.value;
  socket.emit("new_message", input.value, (info, emoticon) => {
    if (emoticon) {
      addMessage("나", "", "", emoticon);
    } else if (info) {
      addMessage("escape", info, "gold");
    } else {
      addMessage("나", msg);
    }
  });
  input.value = "";
});

gameStart.addEventListener("click", () => {
  socket.emit("game_start", (msg) => {
    startGame(msg);
  });
});

rollButton.addEventListener("click", (e) => {
  e.preventDefault();
  if (rerollable()) {
    const dices = [];
    rollButton.disabled = true;
    ulDice.childNodes.forEach((liDice) => {
      const dice = liDice.querySelector(".dice");
      diceValue = dice.dataset.value;
      if (diceValue === "0" || liDice.classList.contains("reroll")) {
        diceValue = getRandomDice();
        dice.style.cssText = animateDice(diceValue);
        liDice.classList.remove("reroll");
        dice.dataset.value = diceValue;
      }
      dices.push(diceValue);
    });
    socket.emit("dice_rolled", dices, () => {
      refreshLeftOver();
      setTimeout(() => {
        rollButton.disabled = false;
      }, 2000);
    });
  }
});

ulDice.childNodes.forEach((liDice) =>
  liDice.addEventListener("click", () => {
    if (rerollable() && myTurn) {
      const selected = liDice;
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
  addMessage("SYSTEM", `${state}(${nick})이(가) 들어왔습니다.`, "lime");
  if (state === "플레이어") {
    players = player;
    changeTitle();
  }
});

socket.on("new_message", (speaker, msg) => {
  addMessage(speaker, msg);
});

socket.on("new_emoticon", (speaker, emoticon) => {
  addMessage(speaker, "", "", emoticon);
});

socket.on("game_start", (msg) => {
  startGame(msg);
});

socket.on("dice_selected", (idx) => {
  ulDice.childNodes[idx].classList.toggle("reroll");
});

socket.on("dice_rolled", (dices) => {
  for (let idx = 0; idx < 5; idx++) {
    const rolledDice = ulDice.childNodes[idx].querySelector(".dice");
    if (
      rolledDice.dataset.value === "0" ||
      ulDice.childNodes[idx].classList.contains("reroll")
    ) {
      rolledDice.dataset.value = dices[idx];
      rolledDice.style.cssText = animateDice(dices[idx]);
      ulDice.childNodes[idx].classList.remove("reroll");
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

socket.on("score_input", (selected, resultScore, acesbonus, truebonus) => {
  addTotalScore(current, resultScore + acesbonus);
  const spanScore = current === 0 ? ulScores1 : ulScores2;
  spanScore.querySelector(`.${selected} .score`).innerText = resultScore;
  spanScore.querySelector(`.${selected} .score`).dataset.value = resultScore;
  spanScore.querySelector(`.${selected}`).classList.add("already");
  spanScore.querySelectorAll("li").forEach((lis) => {
    if (lis.classList.contains("last-selected"))
      lis.classList.remove("last-selected");
  });
  spanScore.querySelector(`.${selected}`).classList.add("last-selected");
  if (selected === "yacht" && resultScore === 50) {
    yachtNotify.classList.remove("hidden");
    setTimeout(() => {
      yachtNotify.classList.add("hidden");
    }, yachtDuration);
  }
  if (truebonus !== 0) {
    spanScore.querySelector(".bonus").classList.add("already");
    spanScore.querySelector(".bonus").innerText = 35;
    spanScore.querySelector(".bonus").dataset.value = 35;
  }
});

socket.on("game_over", (gameSync) => {
  gameover(gameSync);
});

socket.on("bye", (nick) => {
  if (nick !== null) {
    addMessage("SYSTEM", `${nick}이(가) 떠났습니다.`, "lime");
  }
});
