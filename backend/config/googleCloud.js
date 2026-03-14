const crypto = require("crypto");
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

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || fileEnv.GOOGLE_CLOUD_PROJECT_ID;
const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL || fileEnv.GOOGLE_CLOUD_CLIENT_EMAIL;
const privateKeyRaw =
  process.env.GOOGLE_CLOUD_PRIVATE_KEY || fileEnv.GOOGLE_CLOUD_PRIVATE_KEY;
const privateKey = privateKeyRaw ? privateKeyRaw.replace(/\\n/g, "\n") : null;

let tokenCache = {
  accessToken: null,
  expiresAt: 0,
};

const assertConfigured = () => {
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Google Cloud speech/translation is not configured. Set GOOGLE_CLOUD_PROJECT_ID, GOOGLE_CLOUD_CLIENT_EMAIL, and GOOGLE_CLOUD_PRIVATE_KEY in backend/.env."
    );
  }
};

const base64UrlEncode = (value) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const createSignedJwt = () => {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/cloud-platform",
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();

  const signature = signer
    .sign(privateKey, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${unsignedToken}.${signature}`;
};

const getAccessToken = async () => {
  assertConfigured();

  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt - 60000) {
    return tokenCache.accessToken;
  }

  const assertion = createSignedJwt();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || data.error || "Unable to get Google access token.");
  }

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
  };

  return tokenCache.accessToken;
};

const getEncodingFromMimeType = (mimeType) => {
  const normalized = String(mimeType || "").toLowerCase();

  if (normalized.includes("webm")) {
    return "WEBM_OPUS";
  }

  if (normalized.includes("ogg")) {
    return "OGG_OPUS";
  }

  if (normalized.includes("wav")) {
    return "LINEAR16";
  }

  throw new Error(`Unsupported audio mime type: ${mimeType}`);
};

const transcribeSpeech = async ({ audioBase64, mimeType, languageCode }) => {
  const accessToken = await getAccessToken();
  const response = await fetch("https://speech.googleapis.com/v1p1beta1/speech:recognize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      config: {
        encoding: getEncodingFromMimeType(mimeType),
        languageCode,
        enableAutomaticPunctuation: true,
        model: "latest_long",
      },
      audio: {
        content: audioBase64,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Speech transcription failed.");
  }

  const transcript = (data.results || [])
    .flatMap((result) => result.alternatives || [])
    .map((alternative) => alternative.transcript)
    .join(" ")
    .trim();

  if (!transcript) {
    throw new Error("No speech was detected in the recording.");
  }

  return transcript;
};

const translateText = async ({ text, sourceLanguageCode, targetLanguageCode }) => {
  if (!text || sourceLanguageCode === targetLanguageCode) {
    return text;
  }

  const accessToken = await getAccessToken();
  const response = await fetch(
    `https://translation.googleapis.com/v3/projects/${projectId}/locations/global:translateText`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [text],
        mimeType: "text/plain",
        sourceLanguageCode,
        targetLanguageCode,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Text translation failed.");
  }

  return data.translations?.[0]?.translatedText || text;
};

module.exports = {
  transcribeSpeech,
  translateText,
};
