export const makeGroups = () => {
  const results = [[], [], [], [], []];
  for (const problem of generate()) {
    const data = analyze(problem);
    results[data.level].push(data);
  }
  return results;
};

export const generate = function*() {
  for (let factor1 = 0; factor1 < 13; factor1++) {
    for (let factor2 = factor1; factor2 < 13; factor2++) {
      yield [factor1, factor2];
    }
  }
};

export const analyze = factors => {
  const [factor1, factor2] = factors;
  const FIVE_HELP =
    "5 * ? (like 5 * 8): multiply by 10 (add a 0, like 80) and then divide that in half (like half of 80 is 40).";
  const TEN_HELP =
    "10 * ? (like 4 * 10): add a zero at the end of the other number (like 40)";
  const result = {
    factors: factors,
    product: factor1 * factor2,
    help: "You just have to memorize this one",
    challenges: [`${factor1} * ${factor2}`, `${factor2} * ${factor1}`],
    level: 4
  };
  switch (factor1) {
    case 0:
      result.help = "Zero times any number equals zero";
      result.level = 0;
      return result;
    case 1:
      result.help = "One times any number equals the same number";
      result.level = 0;
      return result;
    case 10:
      result.help = TEN_HELP;
      result.level = 1;
      return result;
    case 2:
      result.help =
        "2 * ? (like 2 * 5): add the doubled number to itself (like 5 + 5 = 10)";
      result.level = 1;
      return result;
    default:
      switch (factor2) {
        case 10:
          result.help = TEN_HELP;
          result.level = 1;
          return result;
        case 12:
          if (factor1 === 3 || factor1 === 4) {
            result.help =
              "12 times 3 or 4 is a doubling pattern: 12 * 3 = 36 (6 is twice 3) and 12 * 4 is 48 (8 is twice 4)";
            result.level = 3;
          }
          if (factor1 === 5) {
            result.level = 2;
            result.help = FIVE_HELP;
          }
          return result;
        case 11:
          if (factor1 < 10) {
            result.help =
              "11 * single digit (like 6 * 11): repeat the digit (like 66)";
            result.level = 1;
          }
          return result;
        case 9:
          result.help =
            '9 * single digit (like 6 * 9): subtract one from the other digit from the other digit (6 - 1 = 5). Then subtract that result from 9 (9 - 5 = 4). Write down those two digits in order ("5" and "4" = 54)';
          result.level = 2;
          return result;
        default:
          if (factor1 === 5 || factor2 === 5) {
            result.level = 2;
            result.help = FIVE_HELP;
          } else if (factor1 === 3 || factor1 === 4) {
            result.level = 3;
          }
          return result;
      }
  }
};
