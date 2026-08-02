import React, { createContext, useState, useContext, type ReactNode } from "react";

export type OpenRouterModel =
  | "poolside/laguna-s-2.1"
  | "poolside/laguna-xs-2.1";

interface ModelContextType {
  selectedModel: OpenRouterModel;
  setSelectedModel: (model: OpenRouterModel) => void;
  availableModels: { id: OpenRouterModel; name: string; description: string }[];
}

const defaultModel: OpenRouterModel = "poolside/laguna-s-2.1";

const getDefaultModel = (): OpenRouterModel => {
  const envModel = import.meta.env.VITE_DEFAULT_MODEL as string | undefined;
  const validModels: OpenRouterModel[] = [
    "poolside/laguna-s-2.1",
    "poolside/laguna-xs-2.1",
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
      id: "poolside/laguna-s-2.1" as OpenRouterModel,
      name: "Poolside Laguna S 2.1",
      description: "Model valid dan tersedia untuk OpenRouter; cepat dan stabil.",
    },
    {
      id: "poolside/laguna-xs-2.1" as OpenRouterModel,
      name: "Poolside Laguna XS 2.1",
      description: "Model cepat, ringan, dan tersedia di OpenRouter.",
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
