import React from 'react';
import { Drawer } from './Drawer';
import { StatusBadge } from "./StatusBadge";

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId?: string;
  /** Already formatted. */
  time: string;
  ip?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

interface AuditDiffDrawerProps {
  entry: AuditEntry | null;
  onClose: () => void;
}

export interface FieldChange {
  field: string;
  before: unknown;
  after: unknown;
  kind: 'added' | 'removed' | 'changed';
}

const show = (v: unknown) =>
  v === undefined ? '—' : typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v);

/** Fields that differ between two snapshots. Unchanged fields are left out. */
export function diffRecords(before?: Record<string, unknown> | null, after?: Record<string, unknown> | null): FieldChange[] {
  const b = before ?? {};
  const a = after ?? {};
  const keys = Array.from(new Set([...Object.keys(b), ...Object.keys(a)]));
  const changes: FieldChange[] = [];
  for (const field of keys) {
    const inB = field in b;
    const inA = field in a;
    if (inB && inA && JSON.stringify(b[field]) === JSON.stringify(a[field])) continue;
    changes.push({ field, before: b[field], after: a[field], kind: !inB ? 'added' : !inA ? 'removed' : 'changed' });
  }
  return changes;
}

/** Right-hand drawer showing who did what and a before/after table for one audit log row. */
export const AuditDiffDrawer: React.FC<AuditDiffDrawerProps> = ({ entry, onClose }) => {
  const changes = entry ? diffRecords(entry.before, entry.after) : [];

  return (
    <Drawer open={Boolean(entry)} onClose={onClose} title="Audit entry" subtitle={entry?.time} width="lg">
      {entry && (
        <>
          <dl className="hcx-kv">
            <div><dt>Actor</dt><dd>{entry.actor}</dd></div>
            <div><dt>Action</dt><dd><StatusBadge status={entry.action} tone="info" dot={false} /></dd></div>
            <div><dt>Entity</dt><dd>{entry.entity}{entry.entityId ? ` · ${entry.entityId}` : ''}</dd></div>
            {entry.ip && <div><dt>IP address</dt><dd>{entry.ip}</dd></div>}
          </dl>

          <h3 className="hcx-drawer__section">Changes</h3>
          {changes.length === 0 ? (
            <p className="hcx-timeline__empty">No field-level changes were recorded.</p>
          ) : (
            <div className="hcx-table-scroll">
              <table className="hcx-table hcx-diff">
                <thead>
                  <tr><th scope="col">Field</th><th scope="col">Before</th><th scope="col">After</th></tr>
                </thead>
                <tbody>
                  {changes.map((c) => (
                    <tr key={c.field}>
                      <td><code>{c.field}</code></td>
                      <td className={c.kind !== 'added' ? 'hcx-diff__before' : undefined}>{show(c.before)}</td>
                      <td className={c.kind !== 'removed' ? 'hcx-diff__after' : undefined}>{show(c.after)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Drawer>
  );
};

export default AuditDiffDrawer;
