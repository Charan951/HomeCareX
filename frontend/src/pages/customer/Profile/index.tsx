import { PROFILE, ADDRESSES } from "../../../mocks/customerMockData";

export default function Profile() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Profile</h1>
        <p className="text-muted text-sm mt-1">Manage your personal details and preferences.</p>
      </div>

      <div className="bg-panel border border-line rounded p-6 flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-brand-soft text-brand flex items-center justify-center text-xl font-semibold shrink-0">
          {PROFILE.name.split(" ").map((n) => n[0]).join("")}
        </div>
        <div>
          <div className="font-semibold text-ink">{PROFILE.name}</div>
          <div className="text-sm text-muted">Member since {PROFILE.memberSince}</div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded p-6 grid sm:grid-cols-2 gap-4 text-sm">
        <div><div className="text-muted text-xs">Phone</div><div className="text-ink mt-0.5">{PROFILE.phone}</div></div>
        <div><div className="text-muted text-xs">Email</div><div className="text-ink mt-0.5">{PROFILE.email}</div></div>
        <div><div className="text-muted text-xs">Language</div><div className="text-ink mt-0.5">{PROFILE.language}</div></div>
        <div><div className="text-muted text-xs">Default address</div><div className="text-ink mt-0.5">{ADDRESSES.find((a) => a.isDefault)?.label}</div></div>
      </div>

      <button className="text-sm font-medium bg-brand text-white px-4 py-2 rounded hover:opacity-90">Edit profile</button>
    </div>
  );
}
