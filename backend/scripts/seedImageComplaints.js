const API_URL = "http://localhost:5000/api/complaints";

const reporters = [
  { name: "Aarav User", email: "user@siliconsentry.local" },
  { name: "Diya Rao", email: "diya@siliconsentry.local" },
  { name: "Kiran Patel", email: "kiran@siliconsentry.local" },
];

const buildSvgDataUrl = (title, baseColor, accentColor) =>
  `data:image/svg+xml;base64,${Buffer.from(
    `
      <svg width="1200" height="720" viewBox="0 0 1200 720" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="720" fill="${baseColor}"/>
        <rect x="42" y="42" width="1116" height="636" rx="30" fill="#F8FBFF" opacity="0.92"/>
        <path d="M72 538C160 468 258 436 346 448C452 462 530 556 632 556C752 556 816 420 932 420C1018 420 1088 470 1128 508V650H72V538Z" fill="${accentColor}" opacity="0.88"/>
        <path d="M88 582C198 530 286 516 378 530C470 544 550 620 640 620C754 620 828 500 940 500C1018 500 1082 534 1112 560V650H88V582Z" fill="#1E293B" opacity="0.85"/>
        <rect x="120" y="106" width="560" height="160" rx="26" fill="white" opacity="0.82"/>
        <text x="160" y="182" fill="#0F172A" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="700">${title}</text>
        <text x="160" y="228" fill="#475569" font-family="Arial, Helvetica, sans-serif" font-size="24">Complaint attachment preview generated locally</text>
      </svg>
    `
  ).toString("base64")}`;

const complaints = [
  {
    reporter: 0,
    department: "Whitefield Ward",
    category: "Roads",
    subject: "Pothole patch near ITPL main gate",
    description:
      "Large pothole patch near the ITPL main gate is filling with water and causing abrupt braking during office commute hours.",
    location: { label: "ITPL Main Gate", lat: 12.9891, lng: 77.7288 },
    photoName: "itpl-pothole.svg",
    photoDataUrl: buildSvgDataUrl("ITPL road damage", "#D9E7F5", "#2563EB"),
  },
  {
    reporter: 1,
    department: "Jayanagar Ward",
    category: "Sanitation",
    subject: "Garbage spill beside Jayanagar shopping complex",
    description:
      "Garbage spill beside the Jayanagar shopping complex has spread across the pavement and needs immediate clearing.",
    location: { label: "Jayanagar Shopping Complex", lat: 12.9257, lng: 77.5931 },
    photoName: "jayanagar-garbage.svg",
    photoDataUrl: buildSvgDataUrl("Jayanagar waste spill", "#EEF6E8", "#16A34A"),
  },
  {
    reporter: 2,
    department: "Hebbal Ward",
    category: "Street Lights",
    subject: "Dark stretch under Hebbal service lane bridge",
    description:
      "The stretch under the Hebbal service lane bridge is dark because two street lights are out and the area feels unsafe for pedestrians.",
    location: { label: "Hebbal Service Lane Bridge", lat: 13.0399, lng: 77.5972 },
    photoName: "hebbal-streetlight.svg",
    photoDataUrl: buildSvgDataUrl("Hebbal dark stretch", "#E8EDF5", "#7C3AED"),
  },
];

const complaintKey = (item) =>
  [item.subject.trim().toLowerCase(), item.location?.label?.trim().toLowerCase() || ""].join("|");

const run = async () => {
  const existingResponse = await fetch(API_URL);

  if (!existingResponse.ok) {
    throw new Error(`Unable to load existing complaints: ${existingResponse.status}`);
  }

  const existingComplaints = await existingResponse.json();
  const existingKeys = new Set(existingComplaints.map(complaintKey));

  let created = 0;
  let skipped = 0;

  for (const item of complaints) {
    const key = complaintKey(item);

    if (existingKeys.has(key)) {
      skipped += 1;
      continue;
    }

    const reporter = reporters[item.reporter];
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: reporter.name,
        email: reporter.email,
        department: item.department,
        category: item.category,
        subject: item.subject,
        description: item.description,
        location: item.location,
        photos: [
          {
            name: item.photoName,
            dataUrl: item.photoDataUrl,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Failed for "${item.subject}": ${data.message || response.statusText}`);
    }

    existingKeys.add(key);
    created += 1;
  }

  console.log(JSON.stringify({ totalPlanned: complaints.length, created, skipped }, null, 2));
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
