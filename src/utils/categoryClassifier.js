
const NEED_KEYWORDS = [
  "rent",
  "housing",
  "groceries",
  "grocery",
  "food",
  "transport",
  "bus",
  "fuel",
  "petrol",
  "electricity",
  "utility",
  "insurance",
  "medical",
  "health",
  "medicine"
];

const WANT_KEYWORDS = [
  "restaurant",
  "dining",
  "shopping",
  "movie",
  "netflix",
  "subscription",
  "travel",
  "vacation",
  "game",
  "entertainment",
  "hobby",
  "clothes",
  "amazon"
];

export const classifyExpense = (category) => {

  if (!category) return "wants";

  const name = category.toLowerCase();

  let needScore = 0;
  let wantScore = 0;

  NEED_KEYWORDS.forEach(word => {
    if (name.includes(word)) needScore++;
  });

  WANT_KEYWORDS.forEach(word => {
    if (name.includes(word)) wantScore++;
  });

  if (needScore > wantScore) return "needs";

  return "wants";
};