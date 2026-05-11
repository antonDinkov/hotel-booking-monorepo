/**
 * @jest-environment node
 */

import LoginPage from "./page";

describe("LoginPage", () => {
  it("renders without errors", () => {
    const result = LoginPage();
    expect(result).not.toBeNull();
  });
});
