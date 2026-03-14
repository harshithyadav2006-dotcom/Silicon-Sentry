const Complaint = require("../models/Complaint");
const {
  select,
  insert,
  update,
  uploadComplaintPhoto,
  createSignedComplaintPhotoUrl,
} = require("../config/supabase");
const { analyzeComplaint } = require("../services/nlpService");

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const areLocationsClose = (first, second) => {
  if (
    Number.isFinite(Number(first?.lat)) &&
    Number.isFinite(Number(first?.lng)) &&
    Number.isFinite(Number(second?.lat)) &&
    Number.isFinite(Number(second?.lng))
  ) {
    const latDiff = Math.abs(Number(first.lat) - Number(second.lat));
    const lngDiff = Math.abs(Number(first.lng) - Number(second.lng));
    return latDiff <= 0.0025 && lngDiff <= 0.0025;
  }

  return (
    normalizeText(first?.label) !== "" &&
    normalizeText(first?.label) === normalizeText(second?.label)
  );
};

const isDuplicateComplaint = (existingComplaint, incomingComplaint) => {
  const sameCategory = existingComplaint.category === incomingComplaint.category;
  const sameSubject =
    normalizeText(existingComplaint.subject) === normalizeText(incomingComplaint.subject);
  const sameLocation = areLocationsClose(existingComplaint.location, incomingComplaint.location);

  return sameCategory && sameSubject && sameLocation;
};

const sanitizePhotos = (photos) => {
  if (!Array.isArray(photos)) {
    return [];
  }

  return photos
    .filter(
      (photo) =>
        photo &&
        typeof photo.name === "string" &&
        typeof photo.dataUrl === "string" &&
        photo.dataUrl.startsWith("data:image/")
    )
    .slice(0, 3)
    .map((photo, index) => ({
      id: `photo-${Date.now()}-${index}`,
      name: photo.name,
      dataUrl: photo.dataUrl,
    }));
};

const uploadPhotosToStorage = async (complaintId, photos) => {
  const sanitizedPhotos = sanitizePhotos(photos);

  return Promise.all(
    sanitizedPhotos.map(async (photo, index) => {
      const upload = await uploadComplaintPhoto({
        complaintId,
        fileName: photo.name,
        dataUrl: photo.dataUrl,
        index,
      });

      return {
        id: photo.id,
        name: photo.name,
        path: upload.path,
      };
    })
  );
};

const attachSignedPhotoUrls = async (complaint) => {
  if (!Array.isArray(complaint.photos) || complaint.photos.length === 0) {
    return complaint;
  }

  complaint.photos = await Promise.all(
    complaint.photos.map(async (photo) => {
      if (!photo?.path) {
        return photo;
      }

      try {
        return {
          ...photo,
          url: await createSignedComplaintPhotoUrl(photo.path),
        };
      } catch (error) {
        return {
          ...photo,
          url: photo.url || null,
          signingError: error.message,
        };
      }
    })
  );

  return complaint;
};

const fromDbComplaint = (row) =>
  new Complaint({
    id: row.id,
    name: row.name,
    email: row.email,
    department: row.department,
    assignedDepartment: row.assigned_department,
    subject: row.subject,
    description: row.description,
    location: row.location,
    category: row.category,
    priority: row.priority,
    sentiment: row.sentiment,
    status: row.status,
    resolutionNotes: row.resolution_notes || "",
    photos: row.photos || [],
    reviews: row.reviews || [],
    upvotes: row.upvotes || 1,
    upvotedBy: row.upvoted_by || [],
    timeline: row.timeline || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

const toDbComplaint = (complaint) => ({
  id: complaint.id,
  name: complaint.name,
  email: complaint.email,
  department: complaint.department,
  assigned_department: complaint.assignedDepartment,
  subject: complaint.subject,
  description: complaint.description,
  location: complaint.location,
  category: complaint.category,
  priority: complaint.priority,
  sentiment: complaint.sentiment,
  status: complaint.status,
  resolution_notes: complaint.resolutionNotes,
  photos: complaint.photos,
  reviews: complaint.reviews,
  upvotes: complaint.upvotes,
  upvoted_by: complaint.upvotedBy,
  timeline: complaint.timeline,
});

const fetchComplaints = async () => {
  const rows = await select("complaints", {
    select: "*",
    order: "updated_at.desc",
  });

  return Promise.all(rows.map((row) => attachSignedPhotoUrls(fromDbComplaint(row))));
};

const saveComplaint = async (complaint) => {
  complaint.touch();
  const rows = await update("complaints", toDbComplaint(complaint), {
    id: `eq.${complaint.id}`,
    select: "*",
  });

  return fromDbComplaint(rows[0]);
};

const createComplaint = async (req, res) => {
  const {
    name,
    email,
    department,
    subject,
    description,
    category,
    location,
    photos,
  } = req.body;

  if (!name || !email || !department || !subject || !description) {
    return res.status(400).json({
      message: "All complaint fields are required.",
    });
  }

  try {
    const analysis = analyzeComplaint(description, department, category);
    const normalizedComplaint = {
      category: analysis.category,
      subject,
      location: location || null,
    };

    const allComplaints = await fetchComplaints();
    const duplicateComplaint = allComplaints.find((entry) =>
      isDuplicateComplaint(entry, normalizedComplaint)
    );

    if (duplicateComplaint) {
      if (duplicateComplaint.email === email) {
        return res.status(200).json({
          message: "A matching issue already exists and it was already submitted by you.",
          complaint: (await attachSignedPhotoUrls(duplicateComplaint)).toJSON(),
          duplicate: true,
          upvoted: false,
        });
      }

      if (duplicateComplaint.upvotedBy.includes(email)) {
        return res.status(200).json({
          message: "A matching issue already exists and you have already supported it.",
          complaint: (await attachSignedPhotoUrls(duplicateComplaint)).toJSON(),
          duplicate: true,
          upvoted: false,
        });
      }

      duplicateComplaint.upvotes += 1;
      duplicateComplaint.upvotedBy.push(email);
      duplicateComplaint.timeline.unshift({
        type: "Support Added",
        detail: `${name} backed this issue`,
        at: new Date().toISOString(),
      });

      const savedDuplicate = await saveComplaint(duplicateComplaint);

      return res.status(200).json({
        message: "A matching issue already exists. Your support has been added to it.",
        complaint: (await attachSignedPhotoUrls(savedDuplicate)).toJSON(),
        duplicate: true,
        upvoted: true,
      });
    }

    const now = new Date().toISOString();
    const complaint = new Complaint({
      name,
      email,
      department,
      assignedDepartment: department,
      subject,
      description,
      location: location || null,
      category: analysis.category,
      priority: analysis.priority,
      sentiment: analysis.sentiment,
      status: "Open",
      resolutionNotes: "",
      photos: [],
      reviews: [],
      upvotes: 1,
      upvotedBy: [email],
      timeline: [
        {
          type: "Created",
          detail: "Complaint submitted by citizen",
          at: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    });

    complaint.photos = await uploadPhotosToStorage(complaint.id, photos);

    const rows = await insert("complaints", toDbComplaint(complaint));

    return res.status(201).json({
      message: "Issue submitted successfully.",
      complaint: (await attachSignedPhotoUrls(fromDbComplaint(rows[0]))).toJSON(),
    });
  } catch (error) {
    return res.status(500).json({
      message: `Issue submission failed: ${error.message}`,
    });
  }
};

const getComplaints = async (req, res) => {
  try {
    const complaints = await fetchComplaints();
    res.json(complaints.map((complaint) => complaint.toJSON()));
  } catch (error) {
    res.status(500).json({
      message: `Unable to fetch complaints: ${error.message}`,
    });
  }
};

const getComplaintSummary = async (req, res) => {
  try {
    const complaints = await fetchComplaints();

    const summary = complaints.reduce(
      (acc, complaint) => {
        acc.total += 1;
        acc.byStatus[complaint.status] = (acc.byStatus[complaint.status] || 0) + 1;
        acc.byCategory[complaint.category] = (acc.byCategory[complaint.category] || 0) + 1;
        acc.byPriority[complaint.priority] = (acc.byPriority[complaint.priority] || 0) + 1;
        acc.byDepartment[complaint.assignedDepartment] =
          (acc.byDepartment[complaint.assignedDepartment] || 0) + 1;
        acc.totalUpvotes += complaint.upvotes || 1;
        acc.totalReviews += Array.isArray(complaint.reviews) ? complaint.reviews.length : 0;
        if (complaint.status === "Resolved") {
          acc.resolved += 1;
        }
        return acc;
      },
      {
        total: 0,
        totalUpvotes: 0,
        totalReviews: 0,
        resolved: 0,
        byStatus: {},
        byCategory: {},
        byPriority: {},
        byDepartment: {},
      }
    );

    summary.resolutionRate = summary.total
      ? Math.round((summary.resolved / summary.total) * 100)
      : 0;

    res.json(summary);
  } catch (error) {
    res.status(500).json({
      message: `Unable to build summary: ${error.message}`,
    });
  }
};

const getHeatMapPoints = async (req, res) => {
  try {
    const complaints = await fetchComplaints();
    const groupedPoints = new Map();

    complaints
      .filter(
        (complaint) =>
          Number.isFinite(Number(complaint.location?.lat)) &&
          Number.isFinite(Number(complaint.location?.lng))
      )
      .forEach((complaint) => {
        const key = [
          normalizeText(complaint.subject),
          complaint.category,
          Number(complaint.location.lat).toFixed(3),
          Number(complaint.location.lng).toFixed(3),
        ].join("|");
        const current = groupedPoints.get(key);

        if (!current) {
          groupedPoints.set(key, {
            id: complaint.id,
            subject: complaint.subject,
            category: complaint.category,
            label: complaint.location?.label || complaint.subject,
            lat: complaint.location.lat,
            lng: complaint.location.lng,
            priority: complaint.priority,
            complaintCount: 1,
            upvotes: complaint.upvotes || 1,
          });
          return;
        }

        current.complaintCount += 1;
        current.upvotes += complaint.upvotes || 1;

        if (
          (complaint.priority === "High" && current.priority !== "High") ||
          (complaint.priority === "Medium" && current.priority === "Low")
        ) {
          current.priority = complaint.priority;
        }
      });

    const points = Array.from(groupedPoints.values()).map((point) => ({
      ...point,
      weight: Math.min(0.35 + point.complaintCount * 0.18 + point.upvotes * 0.05, 1),
    }));

    res.json(points);
  } catch (error) {
    res.status(500).json({
      message: `Unable to build heatmap: ${error.message}`,
    });
  }
};

const addReview = async (req, res) => {
  const { id } = req.params;
  const { reviewerName, rating, comment } = req.body;

  if (!reviewerName || !rating || !comment) {
    return res.status(400).json({
      message: "Reviewer name, rating, and comment are required.",
    });
  }

  try {
    const complaints = await fetchComplaints();
    const complaint = complaints.find((entry) => entry.id === id);

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found.",
      });
    }

    complaint.reviews.unshift({
      id: `${id}-${Date.now()}`,
      reviewerName,
      rating: Number(rating),
      comment,
      createdAt: new Date().toISOString(),
    });

    const savedComplaint = await saveComplaint(complaint);

    return res.status(201).json({
      message: "Review added successfully.",
      complaint: (await attachSignedPhotoUrls(savedComplaint)).toJSON(),
    });
  } catch (error) {
    return res.status(500).json({
      message: `Unable to add review: ${error.message}`,
    });
  }
};

const updateComplaint = async (req, res) => {
  const { id } = req.params;
  const { status, assignedDepartment, resolutionNotes } = req.body;

  try {
    const complaints = await fetchComplaints();
    const complaint = complaints.find((entry) => entry.id === id);

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found.",
      });
    }

    const previousStatus = complaint.status;
    const previousDepartment = complaint.assignedDepartment;
    const timelineEntries = [];

    if (status) {
      complaint.status = status;
    }

    if (assignedDepartment) {
      complaint.assignedDepartment = assignedDepartment;
    }

    if (typeof resolutionNotes === "string") {
      complaint.resolutionNotes = resolutionNotes;
    }

    if (status && status !== previousStatus) {
      timelineEntries.push({
        type: "Status Updated",
        detail: `${previousStatus} to ${status}`,
        at: new Date().toISOString(),
      });
    }

    if (assignedDepartment && assignedDepartment !== previousDepartment) {
      timelineEntries.push({
        type: "Assigned",
        detail: `Assigned to ${assignedDepartment}`,
        at: new Date().toISOString(),
      });
    }

    if (resolutionNotes) {
      timelineEntries.push({
        type: "Resolution Note",
        detail: resolutionNotes,
        at: new Date().toISOString(),
      });
    }

    complaint.timeline.unshift(...timelineEntries);

    const savedComplaint = await saveComplaint(complaint);

    return res.json({
      message: "Complaint updated successfully.",
      complaint: (await attachSignedPhotoUrls(savedComplaint)).toJSON(),
    });
  } catch (error) {
    return res.status(500).json({
      message: `Unable to update complaint: ${error.message}`,
    });
  }
};

const upvoteComplaint = async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  try {
    const complaints = await fetchComplaints();
    const complaint = complaints.find((entry) => entry.id === id);

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found.",
      });
    }

    if (complaint.email === email) {
      return res.status(403).json({
        message: "Complaint owners cannot upvote their own issue.",
        complaint: (await attachSignedPhotoUrls(complaint)).toJSON(),
        upvoted: false,
      });
    }

    if (complaint.upvotedBy.includes(email)) {
      return res.status(200).json({
        message: "You have already supported this issue.",
        complaint: (await attachSignedPhotoUrls(complaint)).toJSON(),
        upvoted: false,
      });
    }

    complaint.upvotes += 1;
    complaint.upvotedBy.push(email);
    complaint.timeline.unshift({
      type: "Support Added",
      detail: name ? `${name} backed this issue` : "Citizen backed this issue",
      at: new Date().toISOString(),
    });

    const savedComplaint = await saveComplaint(complaint);

    return res.status(200).json({
      message: "Support added successfully.",
      complaint: (await attachSignedPhotoUrls(savedComplaint)).toJSON(),
      upvoted: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: `Unable to add support: ${error.message}`,
    });
  }
};

const removeUpvoteComplaint = async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  try {
    const complaints = await fetchComplaints();
    const complaint = complaints.find((entry) => entry.id === id);

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found.",
      });
    }

    if (!complaint.upvotedBy.includes(email)) {
      return res.status(200).json({
        message: "You have not supported this issue yet.",
        complaint: (await attachSignedPhotoUrls(complaint)).toJSON(),
        removed: false,
      });
    }

    complaint.upvotedBy = complaint.upvotedBy.filter((entry) => entry !== email);
    complaint.upvotes = Math.max(1, complaint.upvotes - 1);
    complaint.timeline.unshift({
      type: "Support Removed",
      detail: name ? `${name} removed support` : "Citizen removed support",
      at: new Date().toISOString(),
    });

    const savedComplaint = await saveComplaint(complaint);

    return res.status(200).json({
      message: "Support removed successfully.",
      complaint: (await attachSignedPhotoUrls(savedComplaint)).toJSON(),
      removed: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: `Unable to remove support: ${error.message}`,
    });
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintSummary,
  getHeatMapPoints,
  addReview,
  updateComplaint,
  upvoteComplaint,
  removeUpvoteComplaint,
};
