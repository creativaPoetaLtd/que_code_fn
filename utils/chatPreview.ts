import type { MessageType } from "@/types/chat.types";
import { parseMessageContent } from "@/utils/messageUtils";

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
  deletedAt,
}: {
  content?: string | null;
  messageType?: MessageType | string | null;
  deletedAt?: string | null;
}) => {
  if (deletedAt) return "This message was deleted";

  if (isMediaPreviewType(messageType)) {
    return mediaPreviewLabels[messageType as MessageType] || "File";
  }

  if (!content) return "";
  if (messageType === "money" || messageType === "escrow") {
    return parseMessageContent(content, messageType);
  }

  // Action cards are sent as text — summarise them instead of showing raw JSON
  if ((!messageType || messageType === "text") && content.startsWith("{")) {
    return parseMessageContent(content, "text");
  }

  return content;
};
