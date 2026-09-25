import React, { useState } from 'react';
import { Pencil, Save } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

// Basic editable profile form. Starts read-only; "Edit" unlocks the fields,
// "Save" locks them again (wire this up to an API call when one exists).
export const AdminProfilePage: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: (user?.name as string) ?? 'Admin',
    email: (user?.email as string) ?? 'admin@homecarex.com',
    phone: (user?.phone as string) ?? '+91 90000 00000',
    role: (user?.role as string) ?? 'Administrator',
  });

  const handleChange = (field: keyof typeof form) => (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Persist to the backend here when the API is ready.
    setIsEditing(false);
  };

  return (
    <div className="admin-page-container p-6">
      <div className="profile-page__header">
        <h1 className="text-2xl font-bold">My Profile</h1>
        {!isEditing && (
          <button type="button" className="profile-edit-btn" onClick={() => setIsEditing(true)}>
            <Pencil size={16} />
            Edit Profile
          </button>
        )}
      </div>

      <form className="profile-card" onSubmit={handleSubmit}>
        <div className="profile-card__avatar">
          {form.name.charAt(0).toUpperCase()}
        </div>

        <div className="profile-form-grid">
          <label className="profile-field">
            <span>Full Name</span>
            <input
              type="text"
              value={form.name}
              onChange={handleChange('name')}
              disabled={!isEditing}
              required
            />
          </label>

          <label className="profile-field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={handleChange('email')}
              disabled={!isEditing}
              required
            />
          </label>

          <label className="profile-field">
            <span>Phone</span>
            <input
              type="tel"
              value={form.phone}
              onChange={handleChange('phone')}
              disabled={!isEditing}
            />
          </label>

          <label className="profile-field">
            <span>Role</span>
            <input type="text" value={form.role} disabled />
          </label>
        </div>

        {isEditing && (
          <div className="profile-card__actions">
            <button
              type="button"
              className="profile-cancel-btn"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
            <button type="submit" className="profile-save-btn">
              <Save size={16} />
              Save Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default AdminProfilePage;
