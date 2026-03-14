class Complaint {
  constructor({
    id,
    name,
    email,
    department,
    assignedDepartment,
    subject,
    description,
    location,
    category,
    priority,
    sentiment,
    status = "Open",
    resolutionNotes = "",
    photos = [],
    reviews = [],
    upvotes = 1,
    upvotedBy = [],
    timeline = [],
    createdAt,
    updatedAt,
  }) {
    const now = new Date().toISOString();

    this.id = id || `complaint-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.name = name;
    this.email = email;
    this.department = department;
    this.assignedDepartment = assignedDepartment || department;
    this.subject = subject;
    this.description = description;
    this.location = location || null;
    this.category = category;
    this.priority = priority;
    this.sentiment = sentiment;
    this.status = status;
    this.resolutionNotes = resolutionNotes;
    this.photos = photos;
    this.reviews = reviews;
    this.upvotes = upvotes;
    this.upvotedBy = upvotedBy;
    this.timeline = timeline;
    this.createdAt = createdAt || now;
    this.updatedAt = updatedAt || now;
  }

  touch() {
    this.updatedAt = new Date().toISOString();
    return this;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      department: this.department,
      assignedDepartment: this.assignedDepartment,
      subject: this.subject,
      description: this.description,
      location: this.location,
      category: this.category,
      priority: this.priority,
      sentiment: this.sentiment,
      status: this.status,
      resolutionNotes: this.resolutionNotes,
      photos: this.photos,
      reviews: this.reviews,
      upvotes: this.upvotes,
      upvotedBy: this.upvotedBy,
      timeline: this.timeline,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Complaint;
