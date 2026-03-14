export const formatCategory = (copy, category) => {
  const categories = {
    Roads: copy.shared.roads,
    "Water Supply": copy.shared.waterSupply,
    Sanitation: copy.shared.sanitation,
    "Street Lights": copy.shared.streetLights,
    "Public Safety": copy.shared.publicSafety,
    "Parks and Public Spaces": copy.shared.parks,
    "Public Transport": copy.shared.publicTransport,
    "Other Civic Issue": copy.shared.otherIssue,
  };

  return categories[category] || category;
};

export const formatStatus = (copy, status) => {
  const statuses = {
    Open: copy.shared.open,
    "In Progress": copy.shared.inProgress,
    Resolved: copy.shared.resolved,
  };

  return statuses[status] || status;
};

export const formatPriority = (copy, priority) => {
  const priorities = {
    High: copy.shared.highPriority,
    Medium: copy.shared.mediumPriority,
    Low: copy.shared.lowPriority,
  };

  return priorities[priority] || priority;
};

export const formatTimelineEntry = (copy, entry) => {
  const types = {
    Created: copy.shared.timelineCreated,
    Assigned: copy.shared.timelineAssigned,
    "Status Updated": copy.shared.timelineStatusUpdated,
    "Resolution Note": copy.shared.timelineResolutionNote,
    "Support Added": "Support Added",
  };

  let detail = entry.detail;

  if (entry.type === "Created") {
    detail = copy.shared.timelineCreatedDetail;
  }

  if (entry.type === "Assigned" && entry.detail.startsWith("Assigned to ")) {
    detail = `${copy.shared.timelineAssignedTo} ${entry.detail.replace("Assigned to ", "")}`;
  }

  if (entry.type === "Status Updated" && entry.detail.includes(" to ")) {
    const [fromStatus, toStatus] = entry.detail.split(" to ");
    detail = `${formatStatus(copy, fromStatus)} ${copy.shared.timelineTo} ${formatStatus(
      copy,
      toStatus
    )}`;
  }

  if (entry.type === "Support Added") {
    detail = entry.detail;
  }

  return {
    type: types[entry.type] || entry.type,
    detail,
  };
};
