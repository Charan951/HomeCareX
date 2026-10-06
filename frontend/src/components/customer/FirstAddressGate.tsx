import { Navigate, useLocation } from "react-router-dom";
import { useAddresses } from "@/features/customer";
import { customerPath } from "@/routes/customerPath";
import { SKIP_ADDRESS_SETUP_KEY } from "@/pages/customer/SetupAddress";

/** Paths where a customer with no address may stay: they are already adding one. */
const ALLOWED = [customerPath("/addresses"), customerPath("/setup-address")];

/**
 * Sends a customer who has no saved address to the map setup page. It only acts once the address list has
 * loaded successfully, so a slow or failed request never traps anyone. "Skip for now" pauses it for the session.
 */
export default function FirstAddressGate() {
  const { pathname, search } = useLocation();
  const { data, isSuccess } = useAddresses();

  if (!isSuccess || data.length > 0) return null;
  if (ALLOWED.some((p) => pathname.replace(/\/+$/, "").toLowerCase() === p)) return null;

  let skipped = false;
  try {
    skipped = sessionStorage.getItem(SKIP_ADDRESS_SETUP_KEY) === "1";
  } catch {
    /* ignore */
  }
  if (skipped) return null;

  return <Navigate to={customerPath("/setup-address")} replace state={{ from: `${pathname}${search}` }} />;
}
