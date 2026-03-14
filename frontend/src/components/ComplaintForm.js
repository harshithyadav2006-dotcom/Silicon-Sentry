import { useRef, useState } from "react";
import { parseApiResponse } from "../utils/api";

const buildInitialForm = (currentUser) => ({
  name: currentUser?.name || "",
  email: currentUser?.email || "",
  department: "",
  category: "Roads",
  subject: "",
  description: "",
  locationLabel: "",
  latitude: "",
  longitude: "",
  photos: [],
});

const API_URL = "http://localhost:5000/api/complaints";
const SPEECH_API_URL = "http://localhost:5000/api/speech/transcribe";
const DEFAULT_WHATSAPP_NUMBER = "918800001915";
const LANGUAGE_TO_GOOGLE = {
  en: "en-IN",
  kn: "kn-IN",
  hi: "hi-IN",
  te: "te-IN",
  ta: "ta-IN",
  ml: "ml-IN",
};

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const areLocationsClose = (formData, complaint) => {
  if (formData.latitude && formData.longitude && complaint.location?.lat && complaint.location?.lng) {
    const latDiff = Math.abs(Number(formData.latitude) - Number(complaint.location.lat));
    const lngDiff = Math.abs(Number(formData.longitude) - Number(complaint.location.lng));

    return latDiff <= 0.0025 && lngDiff <= 0.0025;
  }

  return normalizeText(formData.locationLabel) !== "" &&
    normalizeText(formData.locationLabel) === normalizeText(complaint.location?.label);
};

function ComplaintForm({
  currentUser,
  knownComplaints = [],
  onSubmitted,
  onComplaintUpdated,
  copy,
  language = "en",
}) {
  const photoInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const voiceTranscriptRef = useRef("");
  const [formData, setFormData] = useState(buildInitialForm(currentUser));
  const [message, setMessage] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [recordingField, setRecordingField] = useState("");

  const categoryOptions = [
    { value: "Roads", label: copy.shared.roads },
    { value: "Water Supply", label: copy.shared.waterSupply },
    { value: "Sanitation", label: copy.shared.sanitation },
    { value: "Street Lights", label: copy.shared.streetLights },
    { value: "Public Safety", label: copy.shared.publicSafety },
    { value: "Parks and Public Spaces", label: copy.shared.parks },
    { value: "Public Transport", label: copy.shared.publicTransport },
    { value: "Other Civic Issue", label: copy.shared.otherIssue },
  ];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePhotoChange = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.some((file) => !file.type.startsWith("image/"))) {
      setMessage(copy.form.photoTypeError);
      return;
    }

    if (selectedFiles.length + formData.photos.length > 3) {
      setMessage(copy.form.photoLimitError);
      return;
    }

    try {
      const photos = await Promise.all(
        selectedFiles.map(async (file) => ({
          id: `${file.name}-${file.lastModified}`,
          name: file.name,
          dataUrl: await readFileAsDataUrl(file),
        }))
      );

      setFormData((current) => ({
        ...current,
        photos: [...current.photos, ...photos].slice(0, 3),
      }));
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      event.target.value = "";
    }
  };

  const removePhoto = (photoId) => {
    setFormData((current) => ({
      ...current,
      photos: current.photos.filter((photo) => photo.id !== photoId),
    }));
  };

  const openPhotoPicker = () => {
    photoInputRef.current?.click();
  };

  const matchingIssues = knownComplaints
    .filter((complaint) => {
      const sameCategory = complaint.category === formData.category;
      const sameSubject =
        normalizeText(formData.subject) !== "" &&
        normalizeText(formData.subject) === normalizeText(complaint.subject);
      const sameLocation = areLocationsClose(formData, complaint);

      return sameCategory && sameSubject && sameLocation;
    })
    .slice(0, 3);

  const upvoteIssue = async (complaintId) => {
    try {
      const complaint = knownComplaints.find((entry) => entry.id === complaintId);
      const alreadySupported = complaint?.upvotedBy?.includes(currentUser?.email);
      const response = await fetch(`${API_URL}/${complaintId}/upvote`, {
        method: alreadySupported ? "DELETE" : "POST",
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
        "Unable to support this issue right now. Make sure the backend server is running on http://localhost:5000."
      );

      if (!response.ok) {
        throw new Error(data.message || "Failed to support issue.");
      }

      setMessage(data.message);
      if (onComplaintUpdated) {
        onComplaintUpdated(data.complaint);
      }
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          department: formData.department,
          category: formData.category,
          subject: formData.subject,
          description: formData.description,
          location: formData.latitude && formData.longitude
            ? {
                label: formData.locationLabel,
                lat: Number(formData.latitude),
                lng: Number(formData.longitude),
              }
            : null,
          photos: formData.photos.map((photo) => ({
            name: photo.name,
            dataUrl: photo.dataUrl,
          })),
        }),
      });

      const data = await parseApiResponse(
        response,
        "Unable to submit the complaint. Make sure the backend server is running on http://localhost:5000."
      );

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit complaint.");
      }

      setMessage(data.message || copy.form.success);
      setFormData(buildInitialForm(currentUser));
      if (onSubmitted) {
        onSubmitted(data.complaint);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const stopRecording = (recorder, stream, chunks) =>
    new Promise((resolve) => {
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        resolve(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
      };
      recorder.stop();
    });

  const extractVoiceSections = (text) => {
    const normalized = String(text || "").trim();
    if (!normalized) {
      return {};
    }

    const result = {};
    const keywords = ["name", "email", "department", "category", "subject", "description", "location"];
    
    keywords.forEach((key) => {
      const allOthers = keywords.filter(k => k !== key).join("|");
      const regex = new RegExp(`\\b${key}\\b\\s*(?:is\\b|[:\\-])?\\s*(.+?)(?=\\b(?:${allOthers})\\b\\s*(?:is\\b|[:\\-])?|$)`, "i");
      const match = normalized.match(regex);
      if (match?.[1]) {
        let val = match[1].trim();
        if (key === "location") result["locationLabel"] = val;
        else result[key] = val;
      }
    });

    if (!Object.keys(result).length) {
      const parts = normalized
        .split(/[.\n]/)
        .map((part) => part.trim())
        .filter(Boolean);

      result.subject = parts[0] || "";
      result.description = parts.slice(1).join(". ") || normalized;
    }

    if (result.email) {
      result.email = result.email.replace(/\s+at\s+/i, "@").replace(/\s+dot\s+/i, ".").replace(/\s+/g, "").toLowerCase();
    }

    return result;
  };

  const handleVoiceInput = () => {
    if (recordingField === "all") {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setRecordingField("");
      setMessage("Voice input stopped.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessage("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    setMessage("");
    setLiveTranscript("");
    setRecordingField("all");
    voiceTranscriptRef.current = "";
    const initialFormState = { ...formData };

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = LANGUAGE_TO_GOOGLE[language] || "en-IN";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setMessage("Listening... (Speak your report, then click 'Stop listening' when done)");
      };

      recognition.onresult = (event) => {
        let newFinalChunk = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            newFinalChunk += event.results[i][0].transcript + " ";
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (newFinalChunk) {
          voiceTranscriptRef.current += newFinalChunk;
          const extracted = extractVoiceSections(voiceTranscriptRef.current);

          setFormData((current) => {
            const combine = (originalKey, spokenText) => {
              if (!spokenText) return current[originalKey];
              if (!initialFormState[originalKey]) return spokenText;
              return `${initialFormState[originalKey]} - ${spokenText}`.trim();
            };

            return {
              ...current,
              name: extracted.name ? combine("name", extracted.name) : current.name,
              email: extracted.email ? combine("email", extracted.email) : current.email,
              department: extracted.department ? combine("department", extracted.department) : current.department,
              category: extracted.category ? combine("category", extracted.category) : current.category,
              subject: extracted.subject ? combine("subject", extracted.subject) : current.subject,
              description: extracted.description ? combine("description", extracted.description) : current.description,
              locationLabel: extracted.locationLabel ? combine("locationLabel", extracted.locationLabel) : current.locationLabel,
            };
          });
          
          setLiveTranscript(voiceTranscriptRef.current);
          setMessage("Listening... (Speech applied to form)");
        } else if (interimTranscript) {
          setLiveTranscript(voiceTranscriptRef.current + interimTranscript);
          setMessage(`Listening...`);
        }
      };

      recognition.onerror = (event) => {
        if (event.error !== "aborted") {
          setMessage(`Speech recognition error: ${event.error}`);
        }
        setRecordingField("");
        recognitionRef.current = null;
      };

      recognition.onend = () => {
        setRecordingField("");
        recognitionRef.current = null;
        setMessage((prev) => prev.includes("Listening") ? "Voice input ended." : prev);
      };

      recognition.start();
      
    } catch (error) {
      setRecordingField("");
      recognitionRef.current = null;
      setMessage(error.message || "Unable to start speech recognition.");
    }
  };

  const handleInstantReport = () => {
    const requiredFields = [
      formData.name,
      formData.email,
      formData.department,
      formData.subject,
      formData.description,
    ];

    if (requiredFields.some((value) => !String(value || "").trim())) {
      setMessage("Fill in name, email, department, subject, and description before using Instant Report.");
      return;
    }

    const locationParts = [];
    if (formData.locationLabel) {
      locationParts.push(`Location: ${formData.locationLabel}`);
    }
    if (formData.latitude && formData.longitude) {
      locationParts.push(`Coordinates: ${formData.latitude}, ${formData.longitude}`);
      locationParts.push(
        `Map: https://www.google.com/maps?q=${encodeURIComponent(
          `${formData.latitude},${formData.longitude}`
        )}`
      );
    }

    const messageBody = [
      "Silicon Sentry Instant Civic Report",
      `Reporter: ${formData.name}`,
      `Email: ${formData.email}`,
      `Department/Ward: ${formData.department}`,
      `Category: ${formData.category}`,
      `Subject: ${formData.subject}`,
      `Description: ${formData.description}`,
      ...locationParts,
      formData.photos.length > 0 ? `Photos attached in app: ${formData.photos.length}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const whatsappUrl = `https://wa.me/${DEFAULT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
      messageBody
    )}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setMessage("Instant report opened in WhatsApp with the entered issue details.");
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setMessage(copy.form.geolocationUnsupported);
      return;
    }

    setLocating(true);
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
          locationLabel: current.locationLabel || "Pinned from current device location",
        }));
        setLocating(false);
      },
      () => {
        setMessage(copy.form.geolocationFailed);
        setLocating(false);
      }
    );
  };

  return (
    <form className="complaint-form" onSubmit={handleSubmit}>
      <div className="voice-panel">
        <div style={{ flex: 1 }}>
          <p className="eyebrow">Voice report</p>
          <h3>Speak one report to fill the form</h3>
          <p className="inline-message">
            Say your fields. Example: Name: Aarav. Email: aarav at app dot com. Department: Traffic. Subject: Pothole. Description: Large pothole. Location: MG Road.
          </p>
          
          {(liveTranscript || recordingField === "all") && (
             <div style={{ marginTop: 12, padding: 12, background: "rgba(255,255,255,0.5)", borderRadius: 8, border: "1px dashed var(--border)" }}>
               <strong>Live dictation: </strong>
               <span style={{ color: "var(--ink)" }}>{liveTranscript || "Waiting for voice..."}</span>
             </div>
          )}
        </div>
        <button
          type="button"
          className="voice-btn"
          onClick={handleVoiceInput}
          disabled={recordingField !== ""}
        >
          {recordingField === "all" ? "Stop listening" : "Voice input"}
        </button>
      </div>

      <label>
        {copy.form.name}
        <input name="name" value={formData.name} onChange={handleChange} required />
      </label>

      <label>
        {copy.form.email}
        <input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </label>

      <label>
        {copy.form.department}
        <input
          name="department"
          value={formData.department}
          onChange={handleChange}
          placeholder={copy.form.departmentPlaceholder}
          required
        />
      </label>

      <label>
        {copy.form.category}
        <select name="category" value={formData.category} onChange={handleChange} required>
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        {copy.form.subject}
        <input name="subject" value={formData.subject} onChange={handleChange} required />
      </label>

      <label>
        {copy.form.description}
        <textarea
          name="description"
          rows="6"
          value={formData.description}
          onChange={handleChange}
          required
        />
      </label>

      <div className="photo-panel">
        <div className="location-panel-header">
          <div>
            <p className="eyebrow">{copy.form.photos}</p>
            <h3>{copy.form.photoHelp}</h3>
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
            hidden
          />
          <button type="button" className="upload-btn secondary-btn" onClick={openPhotoPicker}>
            {copy.form.photos}
          </button>
        </div>

        {formData.photos.length ? (
          <div className="photo-grid">
            {formData.photos.map((photo) => (
              <figure key={photo.id} className="photo-card">
                <img src={photo.dataUrl} alt={photo.name} />
                <figcaption>{photo.name}</figcaption>
                <button type="button" className="photo-remove" onClick={() => removePhoto(photo.id)}>
                  {copy.form.removePhoto}
                </button>
              </figure>
            ))}
          </div>
        ) : null}
      </div>

      <div className="location-panel">
        <div className="location-panel-header">
          <div>
            <p className="eyebrow">{copy.form.mapEyebrow}</p>
            <h3>{copy.form.mapTitle}</h3>
          </div>
          <button
            className="secondary-btn"
            type="button"
            onClick={useMyLocation}
            disabled={locating}
          >
            {locating ? copy.form.locating : copy.form.useMyLocation}
          </button>
        </div>

        <label>
          {copy.form.locationLabel}
          <input
            name="locationLabel"
            value={formData.locationLabel}
            onChange={handleChange}
            placeholder={copy.form.locationPlaceholder}
          />
        </label>

        <div className="location-grid">
          <label>
            {copy.form.latitude}
            <input
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              placeholder="12.971599"
            />
          </label>
          <label>
            {copy.form.longitude}
            <input
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              placeholder="77.594566"
            />
          </label>
        </div>

        {formData.latitude && formData.longitude ? (
          <iframe
            className="form-map"
            title="Selected issue location"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${
              Number(formData.longitude) - 0.01
            }%2C${Number(formData.latitude) - 0.01}%2C${
              Number(formData.longitude) + 0.01
            }%2C${Number(formData.latitude) + 0.01}&layer=mapnik&marker=${
              formData.latitude
            }%2C${formData.longitude}`}
          />
        ) : null}
      </div>

      {matchingIssues.length ? (
        <div className="support-panel">
          <div className="location-panel-header">
            <div>
              <p className="eyebrow">Similar issues</p>
              <h3>Support an existing issue instead of creating a duplicate</h3>
            </div>
          </div>
          <div className="support-list">
            {matchingIssues.map((complaint) => {
              const alreadySupported = complaint.upvotedBy?.includes(currentUser?.email);

              return (
                <article key={complaint.id} className="support-card">
                  <div>
                    <strong>{complaint.subject}</strong>
                    <p>{complaint.location?.label || complaint.department}</p>
                  </div>
                  <div className="support-actions">
                    <span className="support-count">{complaint.upvotes || 1} supports</span>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => upvoteIssue(complaint.id)}
                    >
                      {alreadySupported ? "Remove upvote" : "Upvote issue"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="form-actions">
        <button className="primary-btn" type="submit" disabled={submitting}>
          {submitting ? copy.form.submitting : copy.form.submit}
        </button>
        <button className="primary-btn" type="button" onClick={handleInstantReport}>
          {copy.form.instantReport || "Instant Report!"}
        </button>
      </div>

      {message ? <p className="form-message">{message}</p> : null}
    </form>
  );
}

export default ComplaintForm;
