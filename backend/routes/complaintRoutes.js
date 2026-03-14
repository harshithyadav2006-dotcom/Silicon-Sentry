const express = require("express");
const {
  createComplaint,
  getComplaints,
  getComplaintSummary,
  getHeatMapPoints,
  addReview,
  updateComplaint,
  upvoteComplaint,
  removeUpvoteComplaint,
} = require("../controllers/complaintController");

const router = express.Router();

router.get("/", getComplaints);
router.get("/summary", getComplaintSummary);
router.get("/heatmap", getHeatMapPoints);
router.post("/", createComplaint);
router.patch("/:id", updateComplaint);
router.post("/:id/upvote", upvoteComplaint);
router.delete("/:id/upvote", removeUpvoteComplaint);
router.post("/:id/reviews", addReview);

module.exports = router;
