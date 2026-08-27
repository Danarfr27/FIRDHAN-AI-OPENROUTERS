import { useState, useRef, useEffect } from "react";
import { useGemini } from "@/hooks/useGemini";
import { useAuth } from "@/contexts/AuthContext";
import { ModelSelector } from "@/components/ModelSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";

type ChatMode = "chat" | "text-to-image" | "image-to-text";

// Helper to extract text from uploaded files
const extractTextFromFile = async (file: File): Promise<string> => {
  const fileType = file.type;
  
  if (fileType.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(`[IMAGE: ${file.name}] Size: ${base64.length} chars. Ready for OCR.`);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  if (fileType === 'application/pdf') {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(`[PDF: ${file.name}] Size: ${file.size} bytes. Content will be extracted on server.`);
      };
      reader.readAsArrayBuffer(file);
    });
  }
  
  if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(`[WORD: ${file.name}] Size: ${file.size} bytes. Content will be extracted on server.`);
      };
      reader.readAsText(file);
    });
  }

  if (fileType.startsWith('text/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        resolve(text.substring(0, 2000));
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  return `[FILE: ${file.name}] Type: ${fileType}`;
};

export const GeminiChat = () => {
  const { messages, loading, error, sendMessage, generateImage, imageToText, clearMessages, submitDisabled } = useGemini();
  const { user, logout } = useAuth();
  const [mode, setMode] = useState<ChatMode>("chat");
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [contexts, setContexts] = useState<string[]>([]);
  const [currentContext, setCurrentContext] = useState("");
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState("1024x1024");
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitInFlightRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, imageResult]);

  const readFileAsBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          resolve(result.split(",")[1] || "");
        } else {
          reject(new Error("Unable to read file"));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const handleAddContext = () => {
    const trimmedContext = currentContext.trim();
    if (!trimmedContext) return;
    setContexts((current) => [...current, trimmedContext]);
    setCurrentContext("");
  };

  const handleContextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddContext();
    }
  };

  const handleRemoveContext = (index: number) => {
    setContexts((current) => current.filter((_, idx) => idx !== index));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsProcessingFile(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const extractedText = await extractTextFromFile(file);
        setContexts(prev => [...prev, extractedText]);
      }
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSendMessage = async (
    e?: React.FormEvent | React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>,
  ) => {
    e?.preventDefault();

    if (submitInFlightRef.current || loading || !inputValue.trim()) return;

    const userInput = inputValue.trim();
    submitInFlightRef.current = true;

    try {
      if (mode === "text-to-image") {
        const result = await generateImage(userInput, imageSize);
        setImageResult(result);
        setInputValue("");
        return;
      }

      const fileData = selectedFile
        ? {
            name: selectedFile.name,
            type: selectedFile.type,
            base64: await readFileAsBase64(selectedFile),
          }
        : undefined;

      if (mode === "image-to-text" && !fileData) {
        throw new Error("Please upload an image first for image-to-text mode.");
      }

      if (mode === "image-to-text") {
        await imageToText(fileData as { name: string; type: string; base64: string }, contexts);
        setImageResult(null);
        setInputValue("");
        return;
      }

      await sendMessage(userInput, fileData, contexts, "chat");
      setImageResult(null);
      setInputValue("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      submitInFlightRef.current = false;
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage(e);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="border-b bg-white p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gemma 4 31B IT Chat</h1>
          <p className="text-sm text-muted-foreground">Welcome, {user?.name}</p>
        </div>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        <div className="w-64 flex flex-col gap-4">
          <ModelSelector />
          <Card>
            <CardHeader>
              <CardTitle>Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(["chat", "text-to-image", "image-to-text"] as ChatMode[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                    mode === option ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800"
                  }`}
                  onClick={() => setMode(option)}
                >
                  {option === "chat" ? "Chat" : option === "text-to-image" ? "Text to Image" : "Image to Text"}
                </button>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Add Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.gif,.webp"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessingFile}
              />
              <Input
                value={currentContext}
                onChange={(e) => setCurrentContext(e.target.value)}
                onKeyDown={handleContextKeyDown}
                placeholder="Custom system context..."
              />
              <div className="flex gap-2">
                <Button type="button" onClick={handleAddContext} className="flex-1">
                  Add Context
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingFile}
                  className="flex-1"
                  title="Upload PDF, Word, Image"
                >
                  {isProcessingFile ? "Processing..." : "Upload File"}
                </Button>
              </div>
              {contexts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Contexts ({contexts.length}):
                  </div>
                  {contexts.map((context, index) => (
                    <div key={index} className="flex items-center justify-between rounded-md border px-3 py-2 text-xs">
                      <span className="truncate">{context.substring(0, 50)}...</span>
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveContext(index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>Chat</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
              <ScrollArea className="flex-1 pr-4 border rounded-md p-4">
                <div className="space-y-4">
                  {messages.length === 0 && !imageResult && (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Start a conversation...
                    </div>
                  )}

                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === "user"
                            ? "bg-blue-500 text-white rounded-br-none"
                            : "bg-gray-200 text-gray-900 rounded-bl-none"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}

                  {imageResult && mode === "text-to-image" && (
                    <div className="flex justify-center">
                      <img src={imageResult} alt="Generated" className="max-h-[360px] rounded-md border" />
                    </div>
                  )}

                  {loading && (
                    <div className="flex items-center gap-2">
                      <Spinner className="w-4 h-4" />
                      <span className="text-sm text-muted-foreground">
                        Thinking...
                      </span>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
                      Error: {error}
                    </div>
                  )}

                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              <form onSubmit={(e) => void handleSendMessage(e)} className="flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder={
                      mode === "chat"
                        ? "Type your message..."
                        : mode === "text-to-image"
                        ? "Describe the image to generate..."
                        : "Upload an image to extract text..."
                    }
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={
                      loading ||
                      submitDisabled ||
                      (!inputValue.trim() && mode !== "image-to-text") ||
                      (mode === "image-to-text" && !selectedFile)
                    }
                  >
                    {loading ? "Processing..." : mode === "text-to-image" ? "Generate" : "Send"}
                  </Button>
                </div>

                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      type="file"
                      accept={mode === "image-to-text" ? "image/*" : "image/*,video/*,audio/*"}
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setSelectedFile(file);
                      }}
                    />
                    <span className="inline-flex cursor-pointer rounded-md border border-border px-3 py-2 text-xs transition hover:bg-slate-900/70">
                      Upload Media
                    </span>
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    {selectedFile && (
                      <span className="text-xs text-muted-foreground">{selectedFile.name}</span>
                    )}
                    {mode === "text-to-image" && (
                      <select
                        value={imageSize}
                        onChange={(e) => setImageSize(e.target.value)}
                        className="rounded-md border border-border bg-slate-900 px-2 py-1 text-xs text-white"
                      >
                        <option value="512x512">512x512</option>
                        <option value="768x768">768x768</option>
                        <option value="1024x1024">1024x1024</option>
                      </select>
                    )}
                        {messages.length > 0 && (
                      <Button variant="outline" onClick={clearMessages}>
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
                {submitDisabled && !loading && (
                  <div className="text-xs text-yellow-600">Please wait a moment before submitting again.</div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
