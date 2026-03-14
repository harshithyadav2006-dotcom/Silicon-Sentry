import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { parseApiResponse } from "../utils/api";
import { formatCategory, formatStatus } from "../content/formatters";

const API_URL = `${process.env.REACT_APP_API_URL}/api/complaints`;

const labels = {
  eyebrow: "Citizen workspace",
  titleSuffix: "'s dashboard",
  body: "Review your reported issues, see current status, and move quickly to file a new complaint.",
  newIssue: "File new complaint",
  myReports: "View and manage reports",
  totalReports: "My complaints",
  openReports: "Open",
  resolvedReports: "Resolved",
  totalSupports: "Support votes",
  recentTitle: "Recent complaints",
  recentBody: "Your latest reported issues appear here for quick follow-up.",
  empty: "You have not submitted any complaints yet.",
  location: "Location",
  assigned: "Assigned",
  supports: "Supports",
};

function UserDashboard({ currentUser, copy }) {
  const [complaints, setComplaints] = useState([]);
  const [communityComplaints, setCommunityComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const response = await fetch(API_URL);
        const data = await parseApiResponse(
          response,
          `Unable to load your complaints. Make sure the backend server is running on ${process.env.REACT_APP_API_URL}.`
        );

        const sorted = [...data].sort(
          (first, second) =>
            (second.upvotes || 1) - (first.upvotes || 1) ||
            new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime()
        );
        const mine = sorted
          .filter((complaint) => complaint.email === currentUser?.email)
          .sort((first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime());
        const community = sorted.filter((complaint) => complaint.email !== currentUser?.email);

        setComplaints(mine);
        setCommunityComplaints(community);
      } catch (error) {
        console.error("Failed to load user dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [currentUser]);

  const stats = useMemo(() => {
    const total = complaints.length;
    const open = complaints.filter((complaint) => complaint.status !== "Resolved").length;
    const resolved = complaints.filter((complaint) => complaint.status === "Resolved").length;
    const supports = complaints.reduce((sum, complaint) => sum + (complaint.upvotes || 1), 0);

    return { total, open, resolved, supports };
  }, [complaints]);

  const text = {
    eyebrow: copy?.userDashboard?.eyebrow || labels.eyebrow,
    titleSuffix: copy?.userDashboard?.titleSuffix || labels.titleSuffix,
    body: copy?.userDashboard?.body || labels.body,
    newIssue: copy?.userDashboard?.newIssue || labels.newIssue,
    myReports: copy?.userDashboard?.myReports || labels.myReports,
    totalReports: copy?.userDashboard?.totalReports || labels.totalReports,
    openReports: copy?.userDashboard?.openReports || labels.openReports,
    resolvedReports: copy?.userDashboard?.resolvedReports || labels.resolvedReports,
    totalSupports: copy?.userDashboard?.totalSupports || labels.totalSupports,
    recentTitle: copy?.userDashboard?.recentTitle || labels.recentTitle,
    recentBody: copy?.userDashboard?.recentBody || labels.recentBody,
    empty: copy?.userDashboard?.empty || labels.empty,
    location: copy?.userDashboard?.location || labels.location,
    assigned: copy?.userDashboard?.assigned || labels.assigned,
    supports: copy?.userDashboard?.supports || labels.supports,
  };

  const toggleUpvote = async (complaintId, alreadyUpvoted) => {
    try {
      const response = await fetch(`${API_URL}/${complaintId}/upvote`, {
        method: alreadyUpvoted ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: currentUser?.name,
          email: currentUser?.email,
        }),
      });

      const data = await parseApiResponse(
        response,
        `Unable to update support for this complaint. Make sure the backend server is running on ${process.env.REACT_APP_API_URL}.`
      );

      if (!response.ok) {
        throw new Error(data.message || "Failed to update support.");
      }

      setCommunityComplaints((current) =>
        [...current.map((complaint) =>
          complaint.id === complaintId ? data.complaint : complaint
        )].sort(
          (first, second) =>
            (second.upvotes || 1) - (first.upvotes || 1) ||
            new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime()
        )
      );
    } catch (error) {
      console.error("Failed to update support", error);
    }
  };

  return (
    <section className="dashboard-grid">
      <div className="panel hero-dashboard">
        <div className="section-heading">
          <p className="eyebrow">{text.eyebrow}</p>
          <h2>
            {currentUser?.name}
            {text.titleSuffix}
          </h2>
          <p className="section-copy">{text.body}</p>
        </div>
        <div className="hero-actions">
          <Link className="primary-btn" to="/submit">
            {text.newIssue}
          </Link>
          <a className="secondary-btn" href="#user-reports">
            {text.myReports}
          </a>
        </div>
        <div className="stats-row">
          <article className="stat-card">
            <span>{text.totalReports}</span>
            <strong>{stats.total}</strong>
          </article>
          <article className="stat-card">
            <span>{text.openReports}</span>
            <strong>{stats.open}</strong>
          </article>
          <article className="stat-card">
            <span>{text.resolvedReports}</span>
            <strong>{stats.resolved}</strong>
          </article>
          <article className="stat-card">
            <span>{text.totalSupports}</span>
            <strong>{stats.supports}</strong>
          </article>
        </div>
      </div>

      <div className="panel" id="user-reports">
        <div className="section-heading">
          <p className="eyebrow">{copy.submit.reportsEyebrow}</p>
          <h2>{text.recentTitle}</h2>
          <p className="section-copy">{text.recentBody}</p>
        </div>
        {loading ? (
          <p>{copy.submit.loading}</p>
        ) : complaints.length === 0 ? (
          <p>{text.empty}</p>
        ) : (
          <div className="priority-table">
            <div className="priority-table-head">
              <span>Issue</span>
              <span>Category</span>
              <span>Status</span>
              <span>{text.supports}</span>
            </div>
            <div className="priority-table-body">
              {complaints.slice(0, 8).map((complaint, index) => (
                <article key={complaint.id} className="priority-row">
                  <div className="priority-rank">
                    <span className="priority-index">{index + 1}</span>
                    <div>
                      <strong>{complaint.subject}</strong>
                      <p>{text.location}: {complaint.location?.label || copy.submit.noLocation}</p>
                      <p>{text.assigned}: {complaint.assignedDepartment}</p>
                    </div>
                  </div>
                  <span>{formatCategory(copy, complaint.category)}</span>
                  <span className={`status-pill status-${complaint.status.toLowerCase().replace(" ", "-")}`}>
                    {formatStatus(copy, complaint.status)}
                  </span>
                  <span className="support-count">{complaint.upvotes || 1}</span>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="section-heading">
          <p className="eyebrow">Community priorities</p>
          <h2>Most supported city issues</h2>
          <p className="section-copy">
            Upvote existing complaints so repeated issues rise without creating duplicates.
          </p>
        </div>
        {loading ? (
          <p>{copy.submit.loading}</p>
        ) : communityComplaints.length === 0 ? (
          <p>No community complaints available yet.</p>
        ) : (
          <div className="complaint-stack">
            {communityComplaints.slice(0, 8).map((complaint) => {
              const alreadyUpvoted = complaint.upvotedBy?.includes(currentUser?.email);

              return (
                <article key={complaint.id} className="complaint-card">
                  <div className="complaint-card-header">
                    <div>
                      <h3>{complaint.subject}</h3>
                      <p>
                        {complaint.department} - {formatCategory(copy, complaint.category)}
                      </p>
                    </div>
                    <span className={`status-pill status-${complaint.status.toLowerCase().replace(" ", "-")}`}>
                      {formatStatus(copy, complaint.status)}
                    </span>
                  </div>
                  <div className="complaint-card-actions">
                    <button
                      type="button"
                      className="upvote-btn"
                      onClick={() => toggleUpvote(complaint.id, alreadyUpvoted)}
                    >
                      {alreadyUpvoted ? "Remove upvote" : "Upvote"}
                    </button>
                    <span className="support-count">{complaint.upvotes || 1} supports</span>
                  </div>
                  <p>{complaint.description}</p>
                  <div className="meta-grid">
                    <span>{text.location}: {complaint.location?.label || copy.submit.noLocation}</span>
                    <span>{text.assigned}: {complaint.assignedDepartment}</span>
                    <span>Submitted by: {complaint.name}</span>
                    <span>Priority: {complaint.priority}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default UserDashboard;
