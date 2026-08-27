import React, { createContext, useState, useContext, type ReactNode } from "react";

export type OpenRouterModel =
  | "google/gemma-4-26b-a4b-it:free";

interface ModelContextType {
  selectedModel: OpenRouterModel;
  setSelectedModel: (model: OpenRouterModel) => void;
  availableModels: { id: OpenRouterModel; name: string; description: string }[];
}

const defaultModel: OpenRouterModel = "google/gemma-4-26b-a4b-it:free";

const getDefaultModel = (): OpenRouterModel => {
  const envModel = import.meta.env.VITE_DEFAULT_MODEL as string | undefined;
  const validModels: OpenRouterModel[] = [
    "google/gemma-4-26b-a4b-it:free",
  ];

  if (envModel && validModels.includes(envModel as OpenRouterModel)) {
    return envModel as OpenRouterModel;
  }
  return defaultModel;
};

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const ModelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedModel, setSelectedModelState] = useState<OpenRouterModel>(getDefaultModel());

  const availableModels = [
    {
      id: "google/gemma-4-26b-a4b-it:free" as OpenRouterModel,
      name: "Google Gemma 4 26B A4B IT",
      description: "Model instruksi untuk analisis dan pengujian keamanan.",
    },
  ];

  React.useEffect(() => {
    const saved = localStorage.getItem("selectedModel");
    if (saved && availableModels.some((m) => m.id === saved)) {
      setSelectedModelState(saved as OpenRouterModel);
    }
  }, []);

  const setSelectedModel = (model: OpenRouterModel) => {
    setSelectedModelState(model);
    localStorage.setItem("selectedModel", model);
  };

  return (
    <ModelContext.Provider
      value={{
        selectedModel,
        setSelectedModel,
        availableModels,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = () => {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error("useModel must be used within ModelProvider");
  }
  return context;
};
