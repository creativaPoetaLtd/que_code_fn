export const isPlaceholderAvatar = (src?: string | null) => {
  if (!src) return true;
  return src.includes("/placeholder.svg") || src.includes("placeholder.svg");
};

export const getInitials = (name?: string | null) => {
  const parts = (name || "User").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
};
