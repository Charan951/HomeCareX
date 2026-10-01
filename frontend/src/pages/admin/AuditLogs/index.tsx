import React, { useEffect, useState } from "react";
import DataTable, {
  Column,
} from "../../../components/tables/DataTable";
import './index.css';
import { useUIStore } from "@/store/useUIStore";
interface AuditLog {
  id: string;
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

interface AuditLogApi {
  _id?: string;
  id?: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ip: string;
  result: "Success" | "Failed";
  timestamp?: string;
  createdAt?: string;
}

interface AuditLogsResponse {
  success: boolean;
  data: {
    items: AuditLogApi[];
    total: number;
    page: number;
    limit: number;
  };
}

const AdminAuditLogsPage: React.FC = () => {
   // Search text comes from the navbar search bar
  const search = useUIStore((state) => state.pageSearch);
  const [selectedLog, setSelectedLog] =
    useState<AuditLog | null>(null);

  const [auditLogsData, setAuditLogsData] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:5000/api/v1/admin/audit-logs"
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch audit logs: ${response.status}`
          );
        }

        const result: AuditLogsResponse =
          await response.json();

        if (!result.success) {
          throw new Error("Failed to load audit logs");
        }

        const logs: AuditLog[] =
          result.data.items.map((log) => ({
            id: log.id || log._id || "",
            timestamp: new Date(
              log.timestamp || log.createdAt || ""
            ).toLocaleString(),
            actor: log.actor,
            action: log.action,
            entity: log.entity,
            entityId: log.entityId,
            ip: log.ip,
            result: log.result,
            before:
              log.before === undefined ||
              log.before === null
                ? "{}"
                : typeof log.before === "string"
                ? log.before
                : JSON.stringify(
                    log.before,
                    null,
                    2
                  ),
            after:
              log.after === undefined ||
              log.after === null
                ? "{}"
                : typeof log.after === "string"
                ? log.after
                : JSON.stringify(
                    log.after,
                    null,
                    2
                  ),
          }));

        setAuditLogsData(logs);
      } catch (err) {
        console.error(
          "Failed to fetch audit logs:",
          err
        );

        setError(
          "Unable to load audit logs. Please check that the backend is running."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, []);

  const filteredLogs = auditLogsData.filter((log) => {
    const searchValue = search.toLowerCase().trim();

    if (!searchValue) {
      return true;
    }

    return (
      log.actor
        .toLowerCase()
        .includes(searchValue) ||
      log.action
        .toLowerCase()
        .includes(searchValue) ||
      log.entity
        .toLowerCase()
        .includes(searchValue) ||
      log.entityId
        .toLowerCase()
        .includes(searchValue) ||
      log.ip
        .toLowerCase()
        .includes(searchValue) ||
      log.result
        .toLowerCase()
        .includes(searchValue)
    );
  });

  const auditColumns: Column<AuditLog>[] = [
    {
      key: "timestamp",
      header: "Timestamp",
      sortValue: (row) => row.timestamp,
    },
    {
      key: "actor",
      header: "Actor",
      sortValue: (row) => row.actor,
    },
    {
      key: "action",
      header: "Action",
      sortValue: (row) => row.action,
    },
    {
      key: "entity",
      header: "Entity",
      sortValue: (row) => row.entity,
    },
    {
      key: "entityId",
      header: "Entity ID",
      sortValue: (row) => row.entityId,
    },
    {
      key: "ip",
      header: "IP Address",
      sortValue: (row) => row.ip,
    },
    {
      key: "result",
      header: "Result",
      sortValue: (row) => row.result,
      cell: (row) => (
        <span
          className={
            row.result === "Success"
              ? "success-badge"
              : "failed-badge"
          }
        >
          {row.result}
        </span>
      ),
    },
    {
      key: "details",
      header: "Details",
      cell: (row) => (
        <button
          type="button"
          className="view-btn"
          onClick={() => setSelectedLog(row)}
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div className="admin-auditlogs-container">
      <div className="auditlogs-header">
        <h1 className="auditlogs-title">
          Audit Logs
        </h1>
      </div>

      

      {loading && (
        <div className="auditlogs-count">
          Loading audit logs...
        </div>
      )}

      {!loading && error && (
        <div className="auditlogs-count">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="auditlogs-table-container">
            <DataTable
              columns={auditColumns}
              data={filteredLogs}
              rowKey={(row) => String(row.id)}
              label="Audit logs"
              defaultPageSize={10}
              pageSizeOptions={[5, 10, 20, 50]}
              emptyTitle="No audit logs found"
              emptyMessage={
                search
                  ? "No audit logs match your search."
                  : "There are no audit logs to display."
              }
            />
          </div>

          <div className="auditlogs-count">
            Total Logs: {filteredLogs.length}
          </div>
        </>
      )}

      {selectedLog && (
        <div
          className="audit-drawer-overlay"
          role="presentation"
          onClick={() => setSelectedLog(null)}
        >
          <aside
            className="audit-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="audit-drawer-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="audit-drawer-header">
              <h2
                id="audit-drawer-title"
                className="audit-drawer-title"
              >
                Audit Log Details
              </h2>

              <button
                type="button"
                className="close-btn"
                onClick={() =>
                  setSelectedLog(null)
                }
              >
                Close
              </button>
            </div>

            <div className="audit-info">
              <strong>Timestamp:</strong>{" "}
              {selectedLog.timestamp}
            </div>

            <div className="audit-info">
              <strong>Actor:</strong>{" "}
              {selectedLog.actor}
            </div>

            <div className="audit-info">
              <strong>Action:</strong>{" "}
              {selectedLog.action}
            </div>

            <div className="audit-info">
              <strong>Entity:</strong>{" "}
              {selectedLog.entity}
            </div>

            <div className="audit-info">
              <strong>Entity ID:</strong>{" "}
              {selectedLog.entityId}
            </div>

            <div className="audit-info">
              <strong>IP Address:</strong>{" "}
              {selectedLog.ip}
            </div>

            <div className="audit-info">
              <strong>Result:</strong>{" "}
              <span
                className={
                  selectedLog.result === "Success"
                    ? "success-badge"
                    : "failed-badge"
                }
              >
                {selectedLog.result}
              </span>
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
          </aside>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogsPage;