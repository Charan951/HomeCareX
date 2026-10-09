import { z } from "zod";

export const PINCODE_FORMAT_ERROR = "Pincode must be 6 digits";

export type AddressField = "house" | "street" | "city" | "state" | "pincode";
export type AddressFormErrors = Partial<Record<AddressField, string>>;

const ADDRESS_FIELDS: readonly AddressField[] = ["house", "street", "city", "state", "pincode"];

const required = (message: string) => z.string().trim().min(1, message);

/**
 * Validation for the add / edit address form. `streetRequired` is false only when editing an older address
 * that was saved as a single line (no house / street yet), so those can still be edited.
 * Area and landmark are optional and not validated here.
 */
export const buildAddressSchema = (streetRequired: boolean) =>
  z.object({
    house: required("Enter your house or flat number"),
    street: streetRequired ? required("Enter the street or road") : z.string().trim(),
    city: required("Enter the city"),
    state: required("Enter the state"),
    pincode: z.string().trim().regex(/^\d{6}$/, PINCODE_FORMAT_ERROR),
  });

export type AddressFormValues = z.infer<ReturnType<typeof buildAddressSchema>>;

/** Runs the schema and returns the first message per field (an empty object means the values are valid). */
export function validateAddress(values: AddressFormValues, streetRequired: boolean): AddressFormErrors {
  const result = buildAddressSchema(streetRequired).safeParse(values);
  if (result.success) return {};
  const errors: AddressFormErrors = {};
  for (const issue of result.error.issues) {
    const field = ADDRESS_FIELDS.find((f) => f === issue.path[0]);
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}