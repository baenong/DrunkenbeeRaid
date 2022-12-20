const partyContainer = document.querySelector(".party-info__container");
const form = document.getElementById("commentForm");
const textarea = form.querySelector("textarea");

const addComment = (text, name, createdAt, id) => {
  const partyComments = document.getElementById("commentContainer");
  const firstChild = partyComments.childNodes[0];

  if (firstChild.className === "empty__message") {
    partyComments.removeChild(firstChild);
  }

  const newComment = document.createElement("li");
  newComment.className = "comment";

  const commentContainer = document.createElement("div");
  commentContainer.className = "comment-mixin__container";
  newComment.appendChild(commentContainer);

  const commentData = document.createElement("div");
  commentData.className = "comment-mixin__data";
  commentContainer.appendChild(commentData);

  const spanName = document.createElement("span");
  spanName.innerText = name;
  commentData.appendChild(spanName);

  const spanDate = document.createElement("span");
  spanDate.innerText = `${new Intl.DateTimeFormat("ko").format(
    new Date(createdAt)
  )}`;
  commentData.appendChild(spanDate);

  const commentText = document.createElement("div");
  commentText.className = "comment-mixin__text";
  commentData.appendChild(commentText);

  const p = document.createElement("p");
  p.innerText = text;
  commentText.appendChild(p);

  const commentDelete = document.createElement("div");
  commentDelete.className = "comment-delete";
  const a = document.createElement("a");
  a.className = "delete-button";
  a.href = `/comment/${id}/delete`;
  a.innerText = "X";
  commentDelete.appendChild(a);
  commentData.appendChild(commentDelete);

  partyComments.prepend(newComment);
};

const handleSubmit = async (event) => {
  event.preventDefault();
  const commentOwner = document.querySelector(".comment-owner");
  const text = textarea.value;
  const partyId = partyContainer.dataset.id;
  if (text === "") {
    return;
  }
  const response = await fetch(`/party/${partyId}/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, commenter: commentOwner.value }),
  });
  textarea.value = "";

  if (response.status === 201) {
    const result = await response.json();
    const { name, createdAt, id } = result;
    addComment(text, name, createdAt, id);
  }
};

form.addEventListener("submit", handleSubmit);
