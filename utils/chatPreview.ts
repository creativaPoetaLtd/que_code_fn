import type { MessageType } from "@/types/chat.types";

const mediaPreviewLabels: Partial<Record<MessageType, string>> = {
  image: "Image",
  video: "Video",
  audio: "Audio",
  document: "File",
  file: "File",
};

export const isMediaPreviewType = (messageType?: string | null) =>
  messageType === "image" ||
  messageType === "video" ||
  messageType === "audio" ||
  messageType === "document" ||
  messageType === "file";

export const getChatPreviewText = ({
  content,
  messageType,
}: {
  content?: string | null;
  messageType?: MessageType | string | null;
}) => {
  if (isMediaPreviewType(messageType)) {
    return mediaPreviewLabels[messageType as MessageType] || "File";
  }

  return content || "";
};
