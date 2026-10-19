import { describe, expect, it } from "vitest";
import { validateLogin, validatePasswordChange } from "./auth";

const t = (key: string) => key;

describe("validateLogin", () => {
  it("requires email and password", () => {
    const failures = validateLogin({ email: "", password: "" }, t);
    expect(failures.email).toBe("emailRequired");
    expect(failures.password).toBe("passwordRequired");
  });

  it("rejects malformed email and short passwords", () => {
    const failures = validateLogin({ email: "not-an-email", password: "short" }, t);
    expect(failures.email).toBe("emailInvalid");
    expect(failures.password).toBe("passwordTooShort");
  });

  it("accepts a well-formed login", () => {
    expect(validateLogin({ email: "buyer@example.com", password: "long-enough" }, t)).toEqual({});
  });
});

describe("validatePasswordChange", () => {
  it("requires current password and matching new passwords of length ≥ 10", () => {
    const failures = validatePasswordChange(
      { currentPassword: "", newPassword: "short", confirmPassword: "other" },
      t,
    );
    expect(failures.currentPassword).toBe("currentPasswordRequired");
    expect(failures.newPassword).toBe("passwordTooShort");
    expect(failures.confirmPassword).toBe("passwordsDoNotMatch");
  });
});
