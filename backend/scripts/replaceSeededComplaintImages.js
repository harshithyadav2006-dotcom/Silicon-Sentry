const {
  select,
  update,
  uploadComplaintPhoto,
  createSignedComplaintPhotoUrl,
} = require("../config/supabase");

const realImageMap = [
  {
    subject: "Pothole patch near ITPL main gate",
    fileName: "pothole-real.jpg",
    sourceUrl:
      "https://upload.wikimedia.org/wikipedia/commons/3/35/Pothole_on_local_Road_in_County_Monaghan.jpg",
    sourceAttribution:
      "Wikimedia Commons: Pothole on local Road in County Monaghan.jpg (CC0 1.0)",
  },
  {
    subject: "Garbage spill beside Jayanagar shopping complex",
    fileName: "garbage-real.jpg",
    sourceUrl:
      "https://upload.wikimedia.org/wikipedia/commons/b/bb/Overflowing_Hamburg_street_garbage_bin.jpg",
    sourceAttribution:
      "Wikimedia Commons: Overflowing Hamburg street garbage bin.jpg (public domain)",
  },
  {
    subject: "Dark stretch under Hebbal service lane bridge",
    fileName: "streetlight-real.jpg",
    sourceUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/53/Night_Street_Light.jpg",
    sourceAttribution:
      "Wikimedia Commons: Night Street Light.jpg (CC0 1.0)",
  },
];

const mimeToDataUrl = async (url) => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Codex complaint image updater/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch source image: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return `data:${contentType};base64,${base64}`;
};

const run = async () => {
  const complaints = await select("complaints", {
    select: "id,subject,photos",
  });

  let updated = 0;
  let skipped = 0;

  for (const item of realImageMap) {
    const complaint = complaints.find((entry) => entry.subject === item.subject);

    if (!complaint) {
      skipped += 1;
      continue;
    }

    const dataUrl = await mimeToDataUrl(item.sourceUrl);
    const uploaded = await uploadComplaintPhoto({
      complaintId: complaint.id,
      fileName: item.fileName,
      dataUrl,
      index: 0,
    });

    const signedUrl = await createSignedComplaintPhotoUrl(uploaded.path);

    await update(
      "complaints",
      {
        photos: [
          {
            id: `photo-${complaint.id}-real`,
            name: item.fileName,
            path: uploaded.path,
            url: signedUrl,
            attribution: item.sourceAttribution,
          },
        ],
      },
      {
        id: `eq.${complaint.id}`,
        select: "id,subject",
      }
    );

    updated += 1;
  }

  console.log(JSON.stringify({ planned: realImageMap.length, updated, skipped }, null, 2));
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
