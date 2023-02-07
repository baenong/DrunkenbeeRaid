const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("#enterRoom");
const room = document.getElementById("room");

let roomName;
let nickName;

const addMessage = (message) => {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = message;
  ul.appendChild(li);
};

const handleMessageSubmit = (event) => {
  event.preventDefault();
  const input = room.querySelector("#message input");
  const value = input.value;
  socket.emit("new_message", input.value, roomName, () => {
    addMessage(`You: ${value}`);
  });
  input.value = "";
};

const showRoom = () => {
  welcome.classList.add("hidden");
  room.classList.remove("hidden");
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName}`;
  const msgForm = room.querySelector("#message");
  msgForm.addEventListener("submit", handleMessageSubmit);
};

const handleRoomSubmit = (event) => {
  event.preventDefault();
  const inputNick = form.querySelector("#nickname");
  const inputRoom = form.querySelector("#roomname");
  socket.emit("enter_room", inputRoom.value, inputNick.value, showRoom);

  nickName = inputNick.value;
  roomName = inputRoom.value;

  inputNick.value = "";
  inputRoom.value = "";
};

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (nick) => {
  addMessage(`${nick} arrived`);
});

socket.on("new_message", addMessage);

socket.on("bye", (nick) => {
  addMessage(`${nick} left`);
});
