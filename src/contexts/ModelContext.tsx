import React, { createContext, useState, useContext, type ReactNode } from "react";

export type OpenRouterModel =
  | "nvidia/nemotron-3-ultra"
  | "ling-3.0-flash"
  | "nvidia/nemotron-3-super"
  | "cohere/north-mini-code"
  | "poolside/laguna-s-2.1"
  | "poolside/laguna-xs-2.1"
  | "nvidia/nemotron-3-nano-30b-a3b";

interface ModelContextType {
  selectedModel: OpenRouterModel;
  setSelectedModel: (model: OpenRouterModel) => void;
  availableModels: { id: OpenRouterModel; name: string; description: string }[];
}

const defaultModel: OpenRouterModel = "ling-3.0-flash";

const getDefaultModel = (): OpenRouterModel => {
  const envModel = import.meta.env.VITE_DEFAULT_MODEL as string | undefined;
  const validModels: OpenRouterModel[] = [
    "ling-3.0-flash",
    "nvidia/nemotron-3-ultra",
    "nvidia/nemotron-3-super",
    "cohere/north-mini-code",
    "poolside/laguna-s-2.1",
    "poolside/laguna-xs-2.1",
    "nvidia/nemotron-3-nano-30b-a3b",
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
      id: "ling-3.0-flash" as OpenRouterModel,
      name: "Ling 3.0 Flash",
      description: "Cepat dan akurat: model terbaik untuk chatbot sejarah yang responsif",
    },
    {
      id: "nvidia/nemotron-3-ultra" as OpenRouterModel,
      name: "NVIDIA Nemotron 3 Ultra",
      description: "Free high-performance open router model for advanced tasks",
    },
    {
      id: "nvidia/nemotron-3-super" as OpenRouterModel,
      name: "NVIDIA Nemotron 3 Super",
      description: "Free high-efficiency hybrid model for general purpose use",
    },
    {
      id: "cohere/north-mini-code" as OpenRouterModel,
      name: "Cohere North Mini Code",
      description: "Free code-focused model for programming and technical prompts",
    },
    {
      id: "poolside/laguna-s-2.1" as OpenRouterModel,
      name: "Poolside Laguna S 2.1",
      description: "Free agent model for code and reasoning workflows",
    },
    {
      id: "poolside/laguna-xs-2.1" as OpenRouterModel,
      name: "Poolside Laguna XS 2.1",
      description: "Free fast model with efficient token usage",
    },
    {
      id: "nvidia/nemotron-3-nano-30b-a3b" as OpenRouterModel,
      name: "NVIDIA Nemotron 3 Nano 30B A3B",
      description: "Free compact 30B model for low-latency tasks",
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
