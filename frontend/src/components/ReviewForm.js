import { useState } from "react";
import { parseApiResponse } from "../utils/api";

const buildInitialState = (currentUser) => ({
  reviewerName: currentUser?.name || "",
  rating: "5",
  comment: "",
});

function ReviewForm({ complaintId, currentUser, onReviewAdded, copy }) {
  const [formData, setFormData] = useState(buildInitialState(currentUser));
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/complaints/${complaintId}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await parseApiResponse(
        response,
        "Unable to save the review. Make sure the backend server is running on http://localhost:5000."
      );

      if (!response.ok) {
        throw new Error(data.message || copy.review.failed);
      }

      setMessage(copy.review.success);
      setFormData(buildInitialState(currentUser));
      onReviewAdded(data.complaint);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <input
        name="reviewerName"
        placeholder={copy.review.reviewerName}
        value={formData.reviewerName}
        onChange={handleChange}
        required
      />
      <select name="rating" value={formData.rating} onChange={handleChange}>
        <option value="5">5 {copy.review.stars}</option>
        <option value="4">4 {copy.review.stars}</option>
        <option value="3">3 {copy.review.stars}</option>
        <option value="2">2 {copy.review.stars}</option>
        <option value="1">1 {copy.review.stars}</option>
      </select>
      <input
        name="comment"
        placeholder={copy.review.comment}
        value={formData.comment}
        onChange={handleChange}
        required
      />
      <button className="secondary-btn" type="submit" disabled={submitting}>
        {submitting ? copy.review.saving : copy.review.add}
      </button>
      {message ? <p className="inline-message">{message}</p> : null}
    </form>
  );
}

export default ReviewForm;
