import { useAddresses } from "@/features/booking";
import { LoadingState, ErrorState, EmptyState } from "@/components/customer";

export default function Addresses() {
  // 1. Fetch real addresses from the backend API instead of mock data
  const { addresses, isLoading, isError, error, refetch } = useAddresses();

  // Sort addresses so the default address appears first
  const sortedAddresses = addresses 
    ? [...addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Addresses</h1>
          <p className="text-muted text-sm mt-1">Manage the addresses you book services to.</p>
        </div>
        <button className="text-sm font-medium bg-brand text-white px-4 py-2 rounded hover:opacity-90">
          + Add address
        </button>
      </div>

      {/* 2. Handle API Loading and Error States */}
      {isLoading && <LoadingState label="Loading your addresses..." />}
      {isError && <ErrorState title="Failed to load" message={error?.message} onRetry={refetch} />}

      {/* 3. Handle Empty Database State */}
      {!isLoading && !isError && sortedAddresses.length === 0 && (
        <EmptyState 
          title="No saved addresses yet" 
          description="Add an address to easily book services." 
        />
      )}

      {/* 4. Map over real database addresses */}
      {!isLoading && !isError && sortedAddresses.length > 0 && (
        <div className="space-y-3">
          {sortedAddresses.map((a) => (
            <div key={a.id} className="bg-panel border border-line rounded p-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">{a.label}</span>
                  {a.isDefault && (
                    <span className="text-xs bg-brand-soft text-brand px-2 py-0.5 rounded-full">Default</span>
                  )}
                </div>
                {/* Notice we use a.line1, a.city, a.state, a.pincode to match your database structure */}
                <div className="text-sm text-muted mt-1">{a.line1}</div>
                <div className="text-sm text-muted">{a.city}, {a.state} {a.pincode}</div>
              </div>
              <button className="text-sm text-brand font-medium">Edit</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}