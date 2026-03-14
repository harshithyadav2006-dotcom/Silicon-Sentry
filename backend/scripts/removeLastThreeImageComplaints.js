const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");

const parseEnvFile = () => {
  if (!fs.existsSync(envPath)) {
    return {};
  }

  return fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .reduce((acc, line) => {
      if (line.trim().startsWith("#")) {
        return acc;
      }

      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) {
        return acc;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      if (key && process.env[key] == null) {
        acc[key] = value;
      }

      return acc;
    }, {});
};

const fileEnv = parseEnvFile();
const supabaseUrl = process.env.SUPABASE_URL || fileEnv.SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY;
const storageBucket =
  process.env.SUPABASE_STORAGE_BUCKET || fileEnv.SUPABASE_STORAGE_BUCKET || "complaint-photos";

const targets = [
  "Dark stretch under Hebbal service lane bridge",
  "Garbage spill beside Jayanagar shopping complex",
  "Pothole patch near ITPL main gate",
];

const headers = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  "Content-Type": "application/json",
};

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    headers,
    ...options,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || data?.error || response.statusText);
  }

  return data;
};

const run = async () => {
  const selectUrl = new URL(`${supabaseUrl}/rest/v1/complaints`);
  selectUrl.searchParams.set("select", "id,subject,photos");
  selectUrl.searchParams.set("subject", `in.(${targets.map((item) => `"${item}"`).join(",")})`);

  const complaints = await request(selectUrl.toString(), {
    method: "GET",
  });

  let removedComplaints = 0;
  let removedObjects = 0;

  for (const complaint of complaints) {
    const objectPaths = (complaint.photos || [])
      .map((photo) => photo?.path)
      .filter(Boolean);

    if (objectPaths.length > 0) {
      await request(`${supabaseUrl}/storage/v1/object/${storageBucket}`, {
        method: "DELETE",
        body: JSON.stringify({
          prefixes: objectPaths,
        }),
      });
      removedObjects += objectPaths.length;
    }

    const deleteUrl = new URL(`${supabaseUrl}/rest/v1/complaints`);
    deleteUrl.searchParams.set("id", `eq.${complaint.id}`);

    await request(deleteUrl.toString(), {
      method: "DELETE",
      headers: {
        ...headers,
        Prefer: "return=minimal",
      },
    });

    removedComplaints += 1;
  }

  console.log(
    JSON.stringify(
      {
        targeted: targets.length,
        removedComplaints,
        removedObjects,
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
