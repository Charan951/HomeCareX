import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Plus } from "lucide-react";
import clsx from "clsx";
import { customerPath } from "@/routes/customerPath";
import { EmptyState, ErrorState, OfflineState } from "@/components/customer";
import { Skeleton } from "@/components/customer/Skeleton";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
  useUpdateAddress,
  type AddressInput,
} from "@/features/customer";
import AddressCard from "./AddressCard";
import AddressForm from "./AddressForm";

/** "adding" = new address form open; a string = editing that address id. */
type FormMode = null | "adding" | string;

export default function Addresses() {
  const navigate = useNavigate();
  const online = useOnlineStatus();
  const { data, isPending, isError, error, refetch } = useAddresses();
  const create = useCreateAddress();
  const update = useUpdateAddress();
  const select = useSetDefaultAddress();
  const remove = useDeleteAddress();

  const [mode, setMode] = useState<FormMode>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | undefined>();

  const closeForm = () => {
    setMode(null);
    setActionError(undefined);
    create.reset();
    update.reset();
  };

  function save(input: AddressInput) {
    setActionError(undefined);
    if (mode === "adding") {
      create.mutate(input, { onSuccess: closeForm, onError: (e) => setActionError(e.message) });
    } else if (mode) {
      const { isDefault, ...fields } = input;
      update.mutate(
        { id: mode, patch: { ...fields, ...(isDefault ? { isDefault: true as const } : {}) } },
        { onSuccess: closeForm, onError: (e) => setActionError(e.message) },
      );
    }
  }

  function choose(id: string) {
    setBusyId(id);
    setActionError(undefined);
    // Selecting = making it the default; the dashboard reads the default, so go straight there.
    select.mutate(id, {
      onSuccess: () => navigate(customerPath("/")),
      onError: (e) => setActionError(e.message),
      onSettled: () => setBusyId(null),
    });
  }

  function del(id: string) {
    setBusyId(id);
    setActionError(undefined);
    remove.mutate(id, { onError: (e) => setActionError(e.message), onSettled: () => setBusyId(null) });
  }

  const header = (
    <div>
      <h1 className="text-xl font-semibold text-ink">Saved addresses</h1>
      <p className="mt-1 text-sm text-muted">Choose where we should come. Your selected address shows on the dashboard.</p>
    </div>
  );

  if (isPending) {
    return (
      <div className="space-y-4" role="status" aria-busy="true">
        <span className="sr-only">Loading your addresses…</span>
        <Skeleton className="h-8 w-40" />
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-[132px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    const noConnection = !online || error?.code === "NETWORK_ERROR";
    return noConnection ? (
      <OfflineState onRetry={() => void refetch()} />
    ) : (
      <ErrorState title="We couldn't load your addresses" message={error?.message} onRetry={() => void refetch()} />
    );
  }

  const editing = mode && mode !== "adding" ? data.find((a) => a.id === mode) : undefined;
  const saving = create.isPending || update.isPending;

  return (
    <div className="space-y-3 sm:space-y-4">
      {header}

      {actionError && mode === null && (
        <p role="alert" className="rounded bg-danger-soft px-3 py-2 text-sm text-danger">{actionError}</p>
      )}

      {mode === null && data.length > 0 && (
        <button
          type="button"
          onClick={() => setMode("adding")}
          className={clsx("flex min-h-[52px] w-full items-center gap-3 rounded-xl border border-dashed border-brand/40 bg-brand-soft/50 px-3 py-2 text-left sm:min-h-[64px] sm:px-4 sm:py-3 transition-colors hover:bg-brand-soft", FOCUS_RING)}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white sm:h-10 sm:w-10">
            <Plus className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-brand">Add new address</span>
            <span className="block truncate text-xs text-muted">Home, work or anywhere we should reach you</span>
          </span>
        </button>
      )}

      {mode !== null && (mode === "adding" || editing) && (
        <AddressForm
          key={mode}
          initial={editing}
          isFirst={data.length === 0}
          saving={saving}
          serverError={actionError}
          onSubmit={save}
          onCancel={closeForm}
        />
      )}

      {data.length === 0 && mode === null && (
        <EmptyState
          icon={MapPin}
          title="No saved addresses yet"
          description="Add where you'd like services delivered. You can save Home, Work and more."
          action={
            <button type="button" onClick={() => setMode("adding")} className={clsx("min-h-[44px] rounded bg-brand px-4 text-sm font-medium text-white hover:opacity-90", FOCUS_RING)}>
              Add your first address
            </button>
          }
        />
      )}

      {data.length > 0 && (
        <ul className="space-y-2.5 sm:space-y-3">
          {[...data].sort((x, y) => Number(y.isDefault) - Number(x.isDefault)).map((a) => (
            <AddressCard
              key={a.id}
              address={a}
              busy={busyId === a.id}
              onSelect={() => choose(a.id)}
              onEdit={() => {
                setActionError(undefined);
                setMode(a.id);
              }}
              onDelete={() => del(a.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}