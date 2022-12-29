const inputSearch = document.querySelector(".char-search");

/**
 * 검색값이 변경되면 그에 해당하는 캐릭터 필터링하는 핸들러
 */
inputSearch.addEventListener("input", (event) => {
  const charList = document.querySelector(".char-list");
  const charMixins = charList.childNodes;
  const CLASSNAME_HIDDEN = "hidden";
  const regex = new RegExp(event.target.value, "i");

  charMixins.forEach((elem) => {
    if (regex.test(elem.innerText)) {
      elem.classList.remove(CLASSNAME_HIDDEN);
    } else {
      elem.classList.add(CLASSNAME_HIDDEN);
    }
  });
});

inputSearch.addEventListener("keydown", (event) => {
  if (event.code === "Enter") event.preventDefault();
});
