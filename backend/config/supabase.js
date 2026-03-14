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
const signedUrlExpiresIn = Number(
  process.env.SUPABASE_SIGNED_URL_EXPIRES_IN ||
    fileEnv.SUPABASE_SIGNED_URL_EXPIRES_IN ||
    3600
);

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase configuration is missing in backend/.env");
}

const buildUrl = (table, query = {}) => {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
};

const request = async (table, { method = "GET", query, body, headers = {} } = {}) => {
  const response = await fetch(buildUrl(table, query), {
    method,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message || data?.error || response.statusText;
    throw new Error(message);
  }

  return data;
};

const select = (table, query = {}, headers = {}) => request(table, { method: "GET", query, headers });

const insert = (table, body) =>
  request(table, {
    method: "POST",
    body,
    headers: {
      Prefer: "return=representation",
    },
  });

const update = (table, body, query = {}) =>
  request(table, {
    method: "PATCH",
    query,
    body,
    headers: {
      Prefer: "return=representation",
    },
  });

const sanitizeFileName = (value) =>
  String(value || "photo")
    .replace(/[^a-zA-Z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const parseDataUrl = (dataUrl) => {
  const match = String(dataUrl || "").match(/^data:(.+?);base64,(.+)$/);

  if (!match) {
    throw new Error("Invalid image payload.");
  }

  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
};

const uploadComplaintPhoto = async ({ complaintId, fileName, dataUrl, index = 0 }) => {
  const { contentType, buffer } = parseDataUrl(dataUrl);
  const safeName = sanitizeFileName(fileName || `photo-${index + 1}`);
  const objectPath = `complaints/${complaintId}/${Date.now()}-${index}-${safeName}`;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${storageBucket}/${objectPath}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": contentType,
      "x-upsert": "false",
    },
    body: buffer,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message || data?.error || response.statusText;
    throw new Error(message);
  }

  return {
    path: objectPath,
  };
};

const createSignedComplaintPhotoUrl = async (objectPath, expiresIn = signedUrlExpiresIn) => {
  const encodedPath = String(objectPath || "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const signUrl = `${supabaseUrl}/storage/v1/object/sign/${storageBucket}/${encodedPath}`;
  const response = await fetch(signUrl, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expiresIn,
    }),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message || data?.error || response.statusText;
    throw new Error(message);
  }

  const signedPath = data?.signedURL || data?.signedUrl;

  if (!signedPath) {
    throw new Error("Supabase did not return a signed URL.");
  }

  return signedPath.startsWith("http") ? signedPath : `${supabaseUrl}/storage/v1${signedPath}`;
};

module.exports = {
  select,
  insert,
  update,
  uploadComplaintPhoto,
  createSignedComplaintPhotoUrl,
};
