const API_URL = "http://localhost:5000/api/complaints";

const reporters = [
  { name: "Aarav User", email: "user@siliconsentry.local" },
  { name: "Diya Rao", email: "diya@siliconsentry.local" },
  { name: "Kiran Patel", email: "kiran@siliconsentry.local" },
  { name: "Meera Nair", email: "meera@siliconsentry.local" },
];

const complaints = [
  {
    reporter: 0,
    department: "Byatarayanapura Ward",
    category: "Street Lights",
    subject: "Street lights out near Hebbal flyover service road",
    description:
      "Three street lights have stopped working near the Hebbal flyover service road, making the stretch dark and unsafe for commuters after 8 PM.",
    location: { label: "Hebbal Service Road", lat: 13.0418, lng: 77.5919 },
  },
  {
    reporter: 1,
    department: "Kammanahalli Ward",
    category: "Street Lights",
    subject: "Dark pedestrian stretch near Kammanahalli main road",
    description:
      "Street light poles on the pedestrian stretch near Kammanahalli main road are not functioning for the last two nights.",
    location: { label: "Kammanahalli Main Road", lat: 13.0154, lng: 77.6408 },
  },
  {
    reporter: 2,
    department: "Banaswadi Ward",
    category: "Sanitation",
    subject: "Garbage dump growing beside the Banaswadi underpass",
    description:
      "Mixed garbage is accumulating beside the Banaswadi underpass and the smell is spreading into nearby residential lanes.",
    location: { label: "Banaswadi Underpass", lat: 13.0147, lng: 77.6511 },
  },
  {
    reporter: 3,
    department: "Whitefield Ward",
    category: "Roads",
    subject: "Deep potholes near Hope Farm signal",
    description:
      "Multiple deep potholes have formed near Hope Farm signal and vehicles are swerving suddenly to avoid them during peak traffic.",
    location: { label: "Hope Farm Signal", lat: 12.9867, lng: 77.7531 },
  },
  {
    reporter: 0,
    department: "Doddanekkundi Ward",
    category: "Roads",
    subject: "Footpath blocked by construction debris in Doddanekkundi",
    description:
      "Footpath in Doddanekkundi is blocked by construction debris, forcing pedestrians to walk on the main carriageway.",
    location: { label: "Doddanekkundi Outer Ring Road", lat: 12.9768, lng: 77.6955 },
  },
  {
    reporter: 1,
    department: "Shivajinagar Ward",
    category: "Public Safety",
    subject: "Broken manhole cover near Commercial Street",
    description:
      "A broken manhole cover near Commercial Street is creating a serious safety risk for shoppers and two-wheelers.",
    location: { label: "Commercial Street Junction", lat: 12.9856, lng: 77.6089 },
  },
  {
    reporter: 2,
    department: "Shanthi Nagar Ward",
    category: "Water Supply",
    subject: "Sewage overflow close to Richmond Circle",
    description:
      "Sewage water has been overflowing close to Richmond Circle since morning and is now spreading across the roadside.",
    location: { label: "Richmond Circle", lat: 12.9673, lng: 77.5995 },
  },
  {
    reporter: 3,
    department: "Jayanagar Ward",
    category: "Parks and Public Spaces",
    subject: "Fallen tree branch blocking park walkway in Jayanagar",
    description:
      "A large fallen tree branch is blocking the walking track inside the neighborhood park and requires urgent clearing.",
    location: { label: "Jayanagar 4th Block Park", lat: 12.925, lng: 77.5938 },
  },
  {
    reporter: 0,
    department: "JP Nagar Ward",
    category: "Water Supply",
    subject: "Water leakage near JP Nagar mini forest road",
    description:
      "Continuous water leakage near the JP Nagar mini forest road is wasting supply and weakening the road edge.",
    location: { label: "JP Nagar Mini Forest Road", lat: 12.9081, lng: 77.5852 },
  },
  {
    reporter: 1,
    department: "Begur Ward",
    category: "Sanitation",
    subject: "Garbage pile next to Begur lake approach road",
    description:
      "Garbage and dry waste have piled up next to the Begur lake approach road and dogs are scattering it into the street.",
    location: { label: "Begur Lake Approach Road", lat: 12.8843, lng: 77.6256 },
  },
  {
    reporter: 2,
    department: "Singasandra Ward",
    category: "Public Safety",
    subject: "Stray dog pack chasing vehicles in Singasandra",
    description:
      "A pack of stray dogs is chasing two-wheelers near the Singasandra metro approach road during the early morning hours.",
    location: { label: "Singasandra Metro Approach", lat: 12.8931, lng: 77.6436 },
  },
  {
    reporter: 3,
    department: "Kengeri Ward",
    category: "Street Lights",
    subject: "Street lights not working on Kengeri satellite town road",
    description:
      "The row of street lights on the Kengeri satellite town road is not working and the area remains completely dark after sunset.",
    location: { label: "Kengeri Satellite Town Road", lat: 12.9147, lng: 77.4836 },
  },
  {
    reporter: 0,
    department: "Uttarahalli Ward",
    category: "Roads",
    subject: "Damaged road patch near Uttarahalli circle",
    description:
      "The repaired road patch near Uttarahalli circle has sunk again and buses are causing heavy splashing during every pass.",
    location: { label: "Uttarahalli Circle", lat: 12.9074, lng: 77.5526 },
  },
  {
    reporter: 1,
    department: "RR Nagar Ward",
    category: "Public Transport",
    subject: "Broken bus shelter seating in RR Nagar",
    description:
      "The seating inside the bus shelter in RR Nagar is broken and commuters, especially elderly passengers, have no place to wait.",
    location: { label: "RR Nagar BEML Bus Stop", lat: 12.9275, lng: 77.5201 },
  },
  {
    reporter: 2,
    department: "Anjanapura Ward",
    category: "Parks and Public Spaces",
    subject: "Dead tree leaning over internal road in Anjanapura",
    description:
      "A dead roadside tree in Anjanapura is leaning over the internal road and could fall during strong wind or rain.",
    location: { label: "Anjanapura 80 Feet Road", lat: 12.8612, lng: 77.5586 },
  },
  {
    reporter: 3,
    department: "Yelahanka Ward",
    category: "Sanitation",
    subject: "Overflowing waste bins near Yelahanka new town market",
    description:
      "Waste bins near the Yelahanka new town market are overflowing and garbage is spilling into the pedestrian area.",
    location: { label: "Yelahanka New Town Market", lat: 13.1005, lng: 77.5963 },
  },
  {
    reporter: 0,
    department: "Vijayanagar Ward",
    category: "Roads",
    subject: "Signal approach road broken near Vijayanagar metro",
    description:
      "The signal approach road near Vijayanagar metro has cracked badly and traffic is slowing down sharply before the junction.",
    location: { label: "Vijayanagar Metro Junction", lat: 12.9719, lng: 77.5346 },
  },
  {
    reporter: 1,
    department: "Mahadevapura Ward",
    category: "Water Supply",
    subject: "Drain overflow entering tech park approach lane",
    description:
      "Drain water is overflowing into the tech park approach lane in Mahadevapura and creating foul smell and slippery patches.",
    location: { label: "Mahadevapura Bridge Approach", lat: 12.9923, lng: 77.6996 },
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
    const reporter = reporters[item.reporter];
    const key = complaintKey(item);

    if (existingKeys.has(key)) {
      skipped += 1;
      continue;
    }

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
        photos: [],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Failed for "${item.subject}": ${data.message || response.statusText}`);
    }

    existingKeys.add(key);
    created += 1;
  }

  console.log(
    JSON.stringify(
      {
        totalPlanned: complaints.length,
        created,
        skipped,
      },
      null,
      2
    )
  );
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
