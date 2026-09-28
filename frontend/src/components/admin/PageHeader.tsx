import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Buttons / ExportButton etc., right-aligned (wraps under the title on mobile). */
  actions?: React.ReactNode;
  /** Shows a back button. `true` goes back in history; a string navigates to that path. */
  back?: boolean | string;
  /** Small element beside the title, e.g. a StatusBadge. */
  meta?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions, back, meta }) => {
  const navigate = useNavigate();
  return (
    <div className="hcx-page-header">
      <div className="hcx-page-header__text">
        {back && (
          <button
            type="button"
            className="hcx-page-header__back"
            onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div>
          <h1 className="hcx-page-header__title">
            {title}
            {meta}
          </h1>
          {description && <p className="hcx-page-header__desc">{description}</p>}
        </div>
      </div>
      {actions && <div className="hcx-page-header__actions">{actions}</div>}
    </div>
  );
};

export default PageHeader;
