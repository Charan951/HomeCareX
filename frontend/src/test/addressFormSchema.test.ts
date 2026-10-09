import { describe, expect, it } from "vitest";
import { validateAddress, PINCODE_FORMAT_ERROR } from "@/pages/customer/Addresses/addressFormSchema";
const valid = { house: "Flat 302", street: "JNTU Road", city: "Hyderabad", state: "Telangana", pincode: "500072" };

describe("validateAddress (zod)", () => {
  it("accepts a complete address", () => {
    expect(validateAddress(valid, true)).toEqual({});
  });

  it("trims whitespace before checking, so a padded pincode is fine", () => {
    expect(validateAddress({ ...valid, pincode: " 500072 ", house: "  Flat 302 " }, true)).toEqual({});
  });

  it.each([
    ["empty", ""],
    ["too short", "50007"],
    ["too long", "5000722"],
    ["contains a letter", "50007a"],
    ["contains a space inside", "500 072"],
    ["contains a symbol", "500-072"],
  ])("rejects a pincode that is %s", (_name, pincode) => {
    expect(validateAddress({ ...valid, pincode }, true)).toEqual({ pincode: PINCODE_FORMAT_ERROR });
  });

  it("asks for house, city and state when they are blank or only spaces", () => {
    expect(validateAddress({ ...valid, house: "  ", city: "", state: " " }, true)).toEqual({
      house: "Enter your house or flat number",
      city: "Enter the city",
      state: "Enter the state",
    });
  });

  it("requires a street for a new address but not for an older single-line one", () => {
    expect(validateAddress({ ...valid, street: "" }, true)).toEqual({ street: "Enter the street or road" });
    expect(validateAddress({ ...valid, street: "" }, false)).toEqual({});
  });
});