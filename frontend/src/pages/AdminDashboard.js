import { useEffect, useMemo, useState } from "react";
import Charts from "../components/Charts";
import HeatMap from "../components/HeatMap";
import { parseApiResponse } from "../utils/api";
import {
  formatCategory,
  formatPriority,
  formatStatus,
  formatTimelineEntry,
} from "../content/formatters";

const API_URL = "http://localhost:5000/api/complaints";
const statusOptions = ["Open", "In Progress", "Resolved"];
const assignmentOptions = [
  "BBMP Roads",
  "BBMP Sanitation",
  "BWSSB",
  "BESCOM",
  "Traffic Police",
  "Public Transport Cell",
];

function AdminDashboard({ currentUser, copy }) {
  const [complaints, setComplaints] = useState([]);
  const [heatMapPoints, setHeatMapPoints] = useState([]);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [summaryOpen, setSummaryOpen] = useState({});
  const [summary, setSummary] = useState({
    total: 0,
    resolved: 0,
    resolutionRate: 0,
    byStatus: {},
    byCategory: {},
    byPriority: {},
    byDepartment: {},
  });
  const [filters, setFilters] = useState({
    query: "",
    status: "All",
    category: "All",
    department: "All",
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [complaintsRes, summaryRes, heatMapRes] = await Promise.all([
        fetch(API_URL),
        fetch(`${API_URL}/summary`),
        fetch(`${API_URL}/heatmap`),
      ]);

      const complaintsData = await parseApiResponse(
        complaintsRes,
        "Unable to load dashboard data. Make sure the backend server is running on http://localhost:5000."
      );
      const summaryData = await parseApiResponse(
        summaryRes,
        "Unable to load dashboard summary. Make sure the backend server is running on http://localhost:5000."
      );
      const heatMapData = await parseApiResponse(
        heatMapRes,
        "Unable to load heat map data. Make sure the backend server is running on http://localhost:5000."
      );

      setComplaints(complaintsData);
      setSummary(summaryData);
      setHeatMapPoints(heatMapData);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const filteredComplaints = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    return [...complaints.filter((complaint) => {
      const matchesQuery =
        !query ||
        complaint.subject.toLowerCase().includes(query) ||
        complaint.description.toLowerCase().includes(query) ||
        complaint.location?.label?.toLowerCase().includes(query) ||
        complaint.name.toLowerCase().includes(query);

      const matchesStatus =
        filters.status === "All" || complaint.status === filters.status;
      const matchesCategory =
        filters.category === "All" || complaint.category === filters.category;
      const matchesDepartment =
        filters.department === "All" ||
        complaint.assignedDepartment === filters.department;

      return matchesQuery && matchesStatus && matchesCategory && matchesDepartment;
    })].sort((first, second) => {
      const voteGap = (second.upvotes || 1) - (first.upvotes || 1);
      if (voteGap !== 0) {
        return voteGap;
      }

      return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
    });
  }, [complaints, filters]);

  const filterOptions = useMemo(
    () => ({
      categories: ["All", ...new Set(complaints.map((item) => item.category))],
      departments: [
        "All",
        ...new Set(complaints.map((item) => item.assignedDepartment || item.department)),
      ],
    }),
    [complaints]
  );

  const departmentRows = useMemo(
    () =>
      Object.entries(summary.byDepartment || {})
        .map(([name, count]) => {
          const assignedComplaints = complaints.filter(
            (complaint) => (complaint.assignedDepartment || complaint.department) === name
          );
          const resolvedCount = assignedComplaints.filter(
            (complaint) => complaint.status === "Resolved"
          ).length;

          return {
            name,
            assigned: count,
            resolved: resolvedCount,
            compliance: count ? Math.round((resolvedCount / count) * 100) : 0,
          };
        })
        .sort((a, b) => b.assigned - a.assigned),
    [complaints, summary.byDepartment]
  );

  const priorityRows = useMemo(
    () =>
      [...complaints]
        .sort((a, b) => {
          const voteGap = (b.upvotes || 1) - (a.upvotes || 1);
          if (voteGap !== 0) {
            return voteGap;
          }

          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        })
        .slice(0, 8),
    [complaints]
  );

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleComplaintUpdate = async (complaintId, updates) => {
    try {
      const response = await fetch(`${API_URL}/${complaintId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const data = await parseApiResponse(
        response,
        "Unable to update the complaint. Make sure the backend server is running on http://localhost:5000."
      );

      if (!response.ok) {
        throw new Error(data.message || "Unable to update complaint.");
      }

      setComplaints((current) =>
        current.map((complaint) =>
          complaint.id === complaintId ? data.complaint : complaint
        )
      );
      fetchDashboardData();
    } catch (error) {
      console.error(error);
    }
  };

  const getMapsUrl = (complaint) => {
    if (complaint.location?.lat && complaint.location?.lng) {
      return `https://www.google.com/maps?q=${complaint.location.lat},${complaint.location.lng}`;
    }

    if (complaint.location?.label) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        complaint.location.label
      )}`;
    }

    return null;
  };

  const getAiSummary = (complaint) =>
    `${formatPriority(copy, complaint.priority)} priority ${formatCategory(
      copy,
      complaint.category
    ).toLowerCase()} issue reported by ${complaint.name}. ${
      complaint.assignedDepartment
    } is currently handling it with status ${formatStatus(copy, complaint.status).toLowerCase()}.`;

  const getStageEntry = (complaint, stage) => {
    if (stage === "Received") {
      return complaint.timeline.find((entry) => entry.type === "Created") || {
        at: complaint.createdAt,
        detail: "Received",
      };
    }

    if (stage === "Verified") {
      const completed =
        complaint.timeline.some((entry) => entry.type === "Assigned") ||
        complaint.status === "In Progress" ||
        complaint.status === "Resolved";

      return completed ? { at: complaint.updatedAt, detail: "Verified" } : null;
    }

    if (stage === "Assigned") {
      return (
        complaint.timeline.find((entry) => entry.type === "Assigned") ||
        (complaint.assignedDepartment
          ? { at: complaint.updatedAt, detail: `Assigned to ${complaint.assignedDepartment}` }
          : null)
      );
    }

    if (stage === "In Progress") {
      return complaint.status === "In Progress" || complaint.status === "Resolved"
        ? { at: complaint.updatedAt, detail: "In Progress" }
        : null;
    }

    if (stage === "Resolved") {
      return complaint.status === "Resolved"
        ? { at: complaint.updatedAt, detail: complaint.resolutionNotes || "Resolved" }
        : null;
    }

    return null;
  };

  const buildResolutionStages = (complaint) => {
    const stages = ["Received", "Verified", "Assigned", "In Progress", "Resolved"];
    const rawStages = stages.map((stage) => ({
      stage,
      entry: getStageEntry(complaint, stage),
    }));

    let highestCompletedIndex = -1;
    rawStages.forEach((item, index) => {
      if (item.entry) {
        highestCompletedIndex = index;
      }
    });

    return rawStages.map((item, index) => {
      if (item.entry || index > highestCompletedIndex) {
        return item;
      }

      return {
        ...item,
        entry: {
          at: complaint.updatedAt || complaint.createdAt,
          detail: item.stage,
        },
      };
    });
  };

  return (
    <section className="dashboard-grid">
      <div className="panel hero-dashboard">
        <div className="section-heading">
          <p className="eyebrow">{copy.admin.eyebrow}</p>
          <h2>
            {currentUser?.name}
            {copy.admin.titleSuffix}
          </h2>
          <p className="section-copy">
            {copy.admin.body}
          </p>
        </div>
        <div className="stats-row">
          <article className="stat-card">
            <span>{copy.admin.totalIssues}</span>
            <strong>{summary.total}</strong>
          </article>
          <article className="stat-card">
            <span>{copy.admin.openCases}</span>
            <strong>{summary.byStatus.Open || 0}</strong>
          </article>
          <article className="stat-card">
            <span>{copy.admin.resolved}</span>
            <strong>{summary.resolved || 0}</strong>
          </article>
          <article className="stat-card">
            <span>{copy.admin.resolutionRate}</span>
            <strong>{summary.resolutionRate || 0}%</strong>
          </article>
        </div>
      </div>

      <Charts summary={summary} copy={copy} />

      <div className="panel">
        <div className="section-heading">
          <p className="eyebrow">Priority queue</p>
          <h2>Top community-backed issues</h2>
          <p className="section-copy">
            Complaints with the most support rise to the top so repeated issues get handled faster.
          </p>
        </div>
        <div className="priority-table">
          <div className="priority-table-head">
            <span>Issue</span>
            <span>Category</span>
            <span>Supports</span>
            <span>Status</span>
          </div>
          <div className="priority-table-body">
            {priorityRows.map((complaint, index) => (
              <article key={complaint.id} className="priority-row">
                <div className="priority-rank">
                  <span className="priority-index">{index + 1}</span>
                  <div>
                    <strong>{complaint.subject}</strong>
                    <p>{complaint.location?.label || complaint.department}</p>
                  </div>
                </div>
                <span>{formatCategory(copy, complaint.category)}</span>
                <span className="support-count">{complaint.upvotes || 1}</span>
                <span className={`status-pill status-${complaint.status.toLowerCase().replace(" ", "-")}`}>
                  {formatStatus(copy, complaint.status)}
                </span>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="section-heading">
          <p className="eyebrow">{copy.admin.departmentEyebrow}</p>
          <h2>{copy.admin.departmentTitle}</h2>
        </div>
        <div className="department-table">
          {departmentRows.length === 0 ? (
            <p>{copy.admin.noAssignments}</p>
          ) : (
            <>
              <div className="department-table-head">
                <span>{copy.admin.departmentName}</span>
                <span>{copy.admin.assignedCount}</span>
                <span>{copy.admin.resolvedCount}</span>
                <span>{copy.admin.slaCompliance}</span>
              </div>
              <div className="department-table-body">
                {departmentRows.map((department) => (
                  <article key={department.name} className="department-row">
                    <div className="department-name">
                      <span className="department-accent" />
                      <strong>{department.name}</strong>
                    </div>
                    <span>{department.assigned}</span>
                    <span>{department.resolved}</span>
                    <span className="compliance-pill">{department.compliance}%</span>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="section-heading">
          <p className="eyebrow">{copy.admin.heatEyebrow}</p>
          <h2>{copy.admin.heatTitle}</h2>
          <p className="section-copy">
            {copy.admin.heatBody}
          </p>
        </div>
        <HeatMap points={heatMapPoints} copy={copy} />
      </div>

      <div className="panel">
        <div className="section-heading">
          <p className="eyebrow">{copy.admin.filtersEyebrow}</p>
          <h2>{copy.admin.filtersTitle}</h2>
        </div>
        <div className="filter-grid">
          <input
            name="query"
            placeholder={copy.admin.searchPlaceholder}
            value={filters.query}
            onChange={handleFilterChange}
          />
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="All">{copy.admin.allStatuses}</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "Open"
                  ? copy.shared.open
                  : status === "In Progress"
                    ? copy.shared.inProgress
                    : copy.shared.resolved}
              </option>
            ))}
          </select>
          <select name="category" value={filters.category} onChange={handleFilterChange}>
            {filterOptions.categories.map((category) => (
              <option key={category} value={category}>
                {category === "All" ? copy.admin.allCategories : formatCategory(copy, category)}
              </option>
            ))}
          </select>
          <select
            name="department"
            value={filters.department}
            onChange={handleFilterChange}
          >
            {filterOptions.departments.map((department) => (
              <option key={department} value={department}>
                {department === "All" ? copy.admin.allAssignments : department}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="panel">
        <div className="section-heading">
          <p className="eyebrow">{copy.admin.workflowEyebrow}</p>
          <h2>{copy.admin.workflowTitle}</h2>
        </div>
        {loading ? (
          <p>{copy.admin.loading}</p>
        ) : filteredComplaints.length === 0 ? (
          <p>{copy.admin.noMatches}</p>
        ) : (
          <div className="complaint-stack">
            {filteredComplaints.map((complaint) => (
              <article key={complaint.id} className="complaint-card">
                <div className="complaint-card-header">
                  <div>
                    <h3>{complaint.subject}</h3>
                    <p>
                      {complaint.department} - {formatCategory(copy, complaint.category)} -{" "}
                      {formatPriority(copy, complaint.priority)} {copy.shared.prioritySuffix}
                    </p>
                  </div>
                  <span className={`status-pill status-${complaint.status.toLowerCase().replace(" ", "-")}`}>
                    {formatStatus(copy, complaint.status)}
                  </span>
                </div>

                <div className="complaint-card-actions">
                  <span className="support-count">{complaint.upvotes || 1} supports</span>
                </div>

                <p>{complaint.description}</p>

                <button
                  type="button"
                  className="summary-chip"
                  onClick={() =>
                    setSummaryOpen((current) => ({
                      ...current,
                      [complaint.id]: !current[complaint.id],
                    }))
                  }
                >
                  AI Summarise
                </button>

                {summaryOpen[complaint.id] ? (
                  <p className="summary-copy">{getAiSummary(complaint)}</p>
                ) : null}

                <div className="meta-grid">
                  <span>{copy.admin.reporter}: {complaint.name}</span>
                  <span>{copy.admin.sentiment}: {complaint.sentiment}</span>
                  <span>{copy.admin.assigned}: {complaint.assignedDepartment}</span>
                  <span className="map-link-row">
                    {copy.admin.location}:{" "}
                    {getMapsUrl(complaint) ? (
                      <a href={getMapsUrl(complaint)} target="_blank" rel="noreferrer">
                        View on Google Maps
                      </a>
                    ) : (
                      complaint.location?.label || copy.admin.noLocation
                    )}
                  </span>
                </div>

                {complaint.photos?.length ? (
                  <div className="attachment-block">
                    <strong>{copy.admin.attachmentsTitle}</strong>
                    <div className="attachment-grid">
                      {complaint.photos.map((photo) => (
                        <button
                          key={photo.id || photo.name}
                          type="button"
                          className="attachment-card attachment-button"
                          onClick={() =>
                            setPreviewPhoto({
                              name: photo.name,
                              url: photo.url || photo.dataUrl,
                            })
                          }
                        >
                          <img src={photo.url || photo.dataUrl} alt={photo.name} />
                          <span>{photo.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="admin-controls">
                  <label>
                    {copy.admin.status}
                    <select
                      value={complaint.status}
                      onChange={(event) =>
                        handleComplaintUpdate(complaint.id, {
                          status: event.target.value,
                        })
                      }
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {formatStatus(copy, status)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {copy.admin.assignedDepartment}
                    <select
                      value={complaint.assignedDepartment}
                      onChange={(event) =>
                        handleComplaintUpdate(complaint.id, {
                          assignedDepartment: event.target.value,
                        })
                      }
                    >
                      {assignmentOptions.map((department) => (
                        <option key={department} value={department}>
                          {department}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="resolution-notes">
                  {copy.admin.resolutionNotes}
                  <textarea
                    rows="3"
                    defaultValue={complaint.resolutionNotes}
                    onBlur={(event) =>
                      handleComplaintUpdate(complaint.id, {
                        resolutionNotes: event.target.value,
                      })
                    }
                    placeholder={copy.admin.resolutionPlaceholder}
                  />
                </label>

                <div className="timeline-block">
                  <strong>{copy.admin.timelineTitle}</strong>
                  <div className="resolution-stage-list">
                    {buildResolutionStages(complaint).map(({ stage, entry }, index, stages) => (
                      <div
                        key={`${complaint.id}-${stage}`}
                        className={entry ? "resolution-stage complete" : "resolution-stage"}
                      >
                        <span className="resolution-stage-dot">
                          {entry ? "✓" : ""}
                        </span>
                        {index !== stages.length - 1 ? (
                          <span className={entry ? "resolution-stage-line complete" : "resolution-stage-line"} />
                        ) : null}
                        <div className="resolution-stage-copy">
                          <strong>{stage}</strong>
                          <p>
                            {entry?.at
                              ? new Date(entry.at).toLocaleString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Pending"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {previewPhoto?.url ? (
        <div
          className="image-preview-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={previewPhoto.name || "Attachment preview"}
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="image-preview-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="image-preview-close"
              onClick={() => setPreviewPhoto(null)}
              aria-label="Close image preview"
            >
              Close
            </button>
            <img src={previewPhoto.url} alt={previewPhoto.name} />
            <p>{previewPhoto.name}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default AdminDashboard;
