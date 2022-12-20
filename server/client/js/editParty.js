const partyForm = document.getElementById("partyForm");
const currentList = document.querySelectorAll(
  ".current-member input[type=checkbox]"
);
const freeList = document.querySelectorAll(".free-char input[type=checkbox]");
const countCurrentMember = document.querySelector(".count-current");

const handleClick = (event) => {
  let currentNum = Number(countCurrentMember.innerText);

  if (event.target.checked) {
    currentNum += 1;
  } else {
    currentNum -= 1;
  }

  countCurrentMember.innerText = currentNum;
};

currentList.forEach((elem) => {
  elem.addEventListener("click", handleClick);
});

freeList.forEach((elem) => {
  elem.addEventListener("click", handleClick);
});
