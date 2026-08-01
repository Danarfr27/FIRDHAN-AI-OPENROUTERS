import { useState, useCallback, useRef } from "react";
import { useModel } from "@/contexts/ModelContext";
import { BACKEND_ENDPOINT } from "../../js/config.js";

interface Message {
  role: "user" | "assistant";
  content: string;
  mediaName?: string;
  mediaType?: string;
  mediaBase64?: string;
}

interface ChatPayload {
  model: string;
  mode: "chat" | "image-to-text";
  contexts: string[];
  messages: Array<{ role: string; content: string }>;
  fileBase64?: string;
  files?: Array<{ name: string; data: string }>;
}

interface ChatResponse {
  text: string;
}

interface ImageResponse {
  image: string;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useGemini = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequestAt, setLastRequestAt] = useState<number | null>(null);
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [backoffCount, setBackoffCount] = useState(0);
  const cooldownRef = useRef<{ timeoutId: number | null; until: number | null }>({ timeoutId: null, until: null });
  const { selectedModel } = useModel();

  const sendChatRequest = useCallback(async (payload: ChatPayload) => {
    await delay(700);

    const response = await fetch(BACKEND_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data: ChatResponse | { error?: unknown; message?: unknown } | null = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // Ignore invalid JSON; the raw text will be used below.
    }

    if (!response.ok) {
      const detail = data && typeof data === "object"
        ? (typeof (data as { error?: unknown }).error === "string"
            ? (data as { error: string }).error
            : typeof (data as { message?: unknown }).message === "string"
              ? (data as { message: string }).message
              : text)
        : text;
      throw new Error(`Chat request failed: ${response.status} ${detail}`);
    }

    if (!data || typeof (data as ChatResponse).text !== "string" || !(data as ChatResponse).text.trim()) {
      throw new Error("Chat response was empty.");
    }

    return (data as ChatResponse).text;
  }, []);

  const sendImageRequest = useCallback(async (prompt: string, size: string) => {
    await delay(700);

    const response = await fetch("/api/image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, size }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Image request failed: ${response.status} ${text}`);
    }

    const data = (await response.json()) as ImageResponse;
    return data.image;
  }, []);

  const startCooldown = useCallback((seconds: number) => {
    setSubmitDisabled(true);
    if (cooldownRef.current.timeoutId) {
      window.clearTimeout(cooldownRef.current.timeoutId);
    }
    const until = Date.now() + seconds * 1000;
    cooldownRef.current.until = until;
    cooldownRef.current.timeoutId = window.setTimeout(() => {
      setSubmitDisabled(false);
      cooldownRef.current.timeoutId = null;
      cooldownRef.current.until = null;
    }, seconds * 1000);
  }, []);

  const makeRequest = useCallback(
    async (requestFn: () => Promise<string>) => {
      if (submitDisabled) {
        throw new Error("Submit is temporarily disabled. Please wait.");
      }

      const now = Date.now();
      if (lastRequestAt && now - lastRequestAt < 1500) {
        const nextBackoff = Math.min(5, backoffCount + 1);
        setBackoffCount(nextBackoff);
        startCooldown(2 + nextBackoff);
        throw new Error("Please wait a moment before sending another request.");
      }

      setLastRequestAt(now);
      setSubmitDisabled(true);
      setLoading(true);
      setError(null);
      setBackoffCount(0);

      try {
        const result = await requestFn();
        return result;
      } catch (err) {
        const nextBackoff = Math.min(5, backoffCount + 1);
        setBackoffCount(nextBackoff);
        startCooldown(3 + nextBackoff);
        throw err;
      } finally {
        setLoading(false);
        const cooldownRemaining = cooldownRef.current.until ? cooldownRef.current.until - Date.now() : 0;
        if (!cooldownRemaining || cooldownRemaining <= 0) {
          startCooldown(0.7);
        }
      }
    },
    [backoffCount, lastRequestAt, startCooldown, submitDisabled],
  );

  const sendMessage = useCallback(
    async (
      userMessage: string,
      fileData?: { name: string; type: string; base64: string },
      contexts: string[] = [],
      mode: "chat" | "image-to-text" = "chat",
    ) => {
      const updatedMessages: Message[] = [
        ...messages,
        {
          role: "user",
          content: userMessage,
          ...(fileData
            ? {
                mediaName: fileData.name,
                mediaType: fileData.type,
                mediaBase64: fileData.base64,
              }
            : {}),
        },
      ];
      setMessages(updatedMessages);

      const payload: ChatPayload = {
        model: selectedModel,
        mode,
        contexts,
        messages: updatedMessages.map((msg) => ({ role: msg.role, content: msg.content })),
        fileBase64: mode === "image-to-text" ? fileData?.base64 : undefined,
        files: fileData ? [{ name: fileData.name, data: fileData.base64 }] : undefined,
      };

      try {
        const result = await makeRequest(() => sendChatRequest(payload));
        setMessages((prev) => [...prev, { role: "assistant", content: result }] as Message[]);
        setError(null);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message.");
        throw err;
      }
    },
    [messages, makeRequest, selectedModel, sendChatRequest],
  );

  const generateImage = useCallback(
    async (prompt: string, size = "1024x1024") => {
      const result = await makeRequest(() => sendImageRequest(prompt, size));
      return result;
    },
    [makeRequest, sendImageRequest],
  );

  const imageToText = useCallback(
    async (
      fileData: { name: string; type: string; base64: string },
      contexts: string[] = [],
    ) => {
      const result = await makeRequest(() =>
        sendChatRequest({
          model: selectedModel,
          mode: "image-to-text",
          contexts,
          messages: [{ role: "user", content: "Extract text from the attached image." }],
          fileBase64: fileData.base64,
        }),
      );
      return result;
    },
    [makeRequest, selectedModel, sendChatRequest],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    generateImage,
    imageToText,
    clearMessages,
    submitDisabled,
  };
};
