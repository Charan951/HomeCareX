import { ADDRESSES } from "../../../mocks/customerMockData";

export default function Addresses() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Addresses</h1>
          <p className="text-muted text-sm mt-1">Manage the addresses you book services to.</p>
        </div>
        <button className="text-sm font-medium bg-brand text-white px-4 py-2 rounded hover:opacity-90">+ Add address</button>
      </div>

      <div className="space-y-3">
        {ADDRESSES.map((a) => (
          <div key={a.id} className="bg-panel border border-line rounded p-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-ink">{a.label}</span>
                {a.isDefault && <span className="text-xs bg-brand-soft text-brand px-2 py-0.5 rounded-full">Default</span>}
              </div>
              <div className="text-sm text-muted mt-1">{a.line}</div>
              <div className="text-sm text-muted">{a.city}</div>
            </div>
            <button className="text-sm text-brand font-medium">Edit</button>
          </div>
        ))}
      </div>
    </div>
  );
}
