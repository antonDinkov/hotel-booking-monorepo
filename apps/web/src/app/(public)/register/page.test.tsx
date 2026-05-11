/**
 * @jest-environment node
 */

import RegisterPage from "./page";

describe("RegisterPage", () => {
  it("renders without errors", () => {
    const result = RegisterPage();
    expect(result).not.toBeNull();
  });
});
