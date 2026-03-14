export const parseApiResponse = async (response, fallbackMessage) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  if (!response.ok) {
    throw new Error(fallbackMessage);
  }

  if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
    throw new Error(fallbackMessage);
  }

  return text ? { message: text } : {};
};
