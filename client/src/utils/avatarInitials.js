export function getAvatarInitials(value, fallback = "S") {
  const text = String(value || "").trim();
  if (!text) return fallback;
  const chars = Array.from(text);
  const firstChar = chars.find((char) => String(char || "").trim().length > 0) || chars[0] || "";
  return firstChar || fallback;
}
