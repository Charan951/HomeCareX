import { describe, expect, it } from "vitest";
import { isSafeReturnUrl } from "@/utils/isSafeReturnUrl";

describe("isSafeReturnUrl", () => {
  it("allows path-only return URLs", () => {
    expect(isSafeReturnUrl("/customer/book/home-cleaning")).toBe(true);
    expect(isSafeReturnUrl("/services/home-cleaning")).toBe(true);
  });

  it("allows same-origin absolute URLs", () => {
    expect(
      isSafeReturnUrl(
        `${window.location.origin}/customer/book/home-cleaning`
      )
    ).toBe(true);
  });

  it("rejects external URLs", () => {
    expect(isSafeReturnUrl("https://evil.com")).toBe(false);
    expect(isSafeReturnUrl("http://evil.com")).toBe(false);
  });

  it("rejects protocol-relative URLs", () => {
    expect(isSafeReturnUrl("//evil.com")).toBe(false);
  });

  it("rejects javascript URLs", () => {
    expect(isSafeReturnUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects data URLs", () => {
    expect(isSafeReturnUrl("data:text/html,test")).toBe(false);
  });

  it("rejects empty values", () => {
    expect(isSafeReturnUrl("")).toBe(false);
    expect(isSafeReturnUrl("   ")).toBe(false);
  });
});