import React from "react";
import { KycItem } from "../../mocks/partnerDetails";

interface KycChecklistProps {
  items: KycItem[];
}

const KycChecklist: React.FC<KycChecklistProps> = ({
  items,
}) => {
  const completedCount = items.filter(
    (item) => item.completed
  ).length;

  return (
    <section
      className="kyc-checklist"
      aria-labelledby="kyc-checklist-title"
    >
      <div className="kyc-checklist-header">
        <div>
          <h3 id="kyc-checklist-title">
            KYC Checklist
          </h3>

          <p>
            {completedCount} of {items.length} checks
            completed
          </p>
        </div>

        <span
          className={
            completedCount === items.length
              ? "kyc-checklist-badge complete"
              : "kyc-checklist-badge pending"
          }
        >
          {completedCount === items.length
            ? "Complete"
            : "Pending"}
        </span>
      </div>

      <ul className="kyc-checklist-list">
        {items.map((item) => (
          <li
            key={item.id}
            className={`kyc-checklist-item ${
              item.completed ? "completed" : "pending"
            }`}
          >
            <span
              className="kyc-checklist-icon"
              aria-hidden="true"
            >
              {item.completed ? "✓" : "!"}
            </span>

            <span className="kyc-checklist-label">
              {item.label}
            </span>

            {item.required && (
              <span className="kyc-required">
                Required
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default KycChecklist;