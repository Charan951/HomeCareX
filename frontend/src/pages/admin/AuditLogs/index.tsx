// import React from 'react';

// export const AdminAuditLogsPage: React.FC = () => {
//   return (
//     <div className="admin-page-container p-6">
//       <h1 className="text-2xl font-bold">Admin AuditLogs</h1>
//     </div>
//   );
// };

// export default AdminAuditLogsPage;
import React, { useState } from "react";

interface AuditLog {
  id: number;
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  ip: string;
  result: "Success" | "Failed";
  before: string;
  after: string;
}

const auditLogsData: AuditLog[] = [
  {
    id: 1,
    timestamp: "2026-09-28 10:15 AM",
    actor: "Admin",
    action: "CREATE",
    entity: "Category",
    entityId: "CAT001",
    ip: "192.168.1.10",
    result: "Success",
    before: "{}",
    after: '{"name":"Home Cleaning","status":"Active"}',
  },
  {
    id: 2,
    timestamp: "2026-09-28 11:20 AM",
    actor: "Manager",
    action: "UPDATE",
    entity: "Partner",
    entityId: "PAR002",
    ip: "192.168.1.15",
    result: "Success",
    before: '{"status":"Pending"}',
    after: '{"status":"Approved"}',
  },
  {
    id: 3,
    timestamp: "2026-09-28 12:45 PM",
    actor: "Admin",
    action: "DELETE",
    entity: "Service",
    entityId: "SER003",
    ip: "192.168.1.22",
    result: "Failed",
    before: '{"name":"AC Repair"}',
    after: "{}",
  },
];

const AdminAuditLogsPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = auditLogsData.filter(
    (log) =>
      log.actor.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entity.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-auditlogs-container">
      <div className="auditlogs-header">
        <h1 className="auditlogs-title">Audit Logs</h1>
      </div>

      <div className="auditlogs-search">
        <input
          type="text"
          placeholder="Search Actor, Action or Entity"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="auditlogs-table-wrapper">
        <table className="auditlogs-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Entity ID</th>
              <th>IP Address</th>
              <th>Result</th>
              <th>Details</th>
            </tr>
          </thead>

          <tbody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>{log.timestamp}</td>
                  <td>{log.actor}</td>
                  <td>{log.action}</td>
                  <td>{log.entity}</td>
                  <td>{log.entityId}</td>
                  <td>{log.ip}</td>

                  <td>
                    <span
                      className={
                        log.result === "Success"
                          ? "success-badge"
                          : "failed-badge"
                      }
                    >
                      {log.result}
                    </span>
                  </td>

                  <td>
                    <button
                      className="view-btn"
                      onClick={() => setSelectedLog(log)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="no-records">
                  No Audit Logs Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="auditlogs-count">
        Total Logs: {filteredLogs.length}
      </div>

      {selectedLog && (
        <div className="audit-drawer-overlay">
          <div className="audit-drawer">
            <div className="audit-drawer-header">
              <h2 className="audit-drawer-title">
                Audit Log Details
              </h2>

              <button
                className="close-btn"
                onClick={() => setSelectedLog(null)}
              >
                Close
              </button>
            </div>

            <div className="audit-info">
              <strong>Actor:</strong> {selectedLog.actor}
            </div>

            <div className="audit-info">
              <strong>Action:</strong> {selectedLog.action}
            </div>

            <div className="audit-info">
              <strong>Entity:</strong> {selectedLog.entity}
            </div>

            <div className="audit-info">
              <strong>Entity ID:</strong> {selectedLog.entityId}
            </div>

            <div className="audit-info">
              <strong>IP:</strong> {selectedLog.ip}
            </div>

            <div className="audit-section">
              <h3>Before JSON</h3>
              <pre className="json-box">
                {selectedLog.before}
              </pre>
            </div>

            <div className="audit-section">
              <h3>After JSON</h3>
              <pre className="json-box">
                {selectedLog.after}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogsPage;