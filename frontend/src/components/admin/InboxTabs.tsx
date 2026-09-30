import React from 'react';
import { Mail, Star } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/admin/leads', label: 'Enquiries & leads', icon: Mail },
  { to: '/admin/reviews', label: 'Customer reviews', icon: Star },
];

export const InboxTabs: React.FC = () => (
  <nav aria-label="Admin inbox sections" className="mb-6 flex gap-1 border-b border-slate-200">
    {tabs.map(({ to, label, icon: Icon }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) => `inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-xs font-semibold transition sm:px-4 ${
          isActive ? 'border-[#4338ca] text-[#4338ca]' : 'border-transparent text-slate-500 hover:text-slate-900'
        }`}
      >
        <Icon aria-hidden="true" size={15} />
        {label}
      </NavLink>
    ))}
  </nav>
);
