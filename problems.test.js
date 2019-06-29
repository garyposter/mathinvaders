import { generate, analyze, makeGroups } from "./problems";

test("generate iterates", () =>
  expect(generate().next()).toEqual({ done: false, value: [0, 0] }));

test("analyze zero factor", () =>
  expect(analyze([0, 5])).toEqual({
    factors: [0, 5],
    help: "Zero times any number equals zero",
    level: 0,
    product: 0
  }));

test("analyze one factor", () =>
  expect(analyze([1, 5])).toEqual({
    factors: [1, 5],
    help: "One times any number equals the same number",
    level: 0,
    product: 5
  }));

test("makeGroups produces groups of problems", () => {
  const groups = makeGroups();
  expect(groups.length).toEqual(5);
});
