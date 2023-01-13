export const getPatchNote = (req, res) => {
  res.render("patchNote", { pageTitle: "Patch Note" });
};

export const getTool = (req, res) => {
  res.render("tool", { pageTitle: "Tool" });
};

export const postCalcEngrave = (req, res) => {
  const {
    body: { goal, read },
  } = req;

  // 가능한 조합 계산
  // 목표 각인 중 읽은 각인 감소
  goal[read.first.name] = goal[read.first.name] - read.first.num;
  goal[read.second.name] = goal[read.second.name] - read.second.num;

  // 이미 있는 돌을 입력했다면 해당 수치도 감소

  // 남은 목표각인을 달성할 수 있는 조합 전부 검색
};
