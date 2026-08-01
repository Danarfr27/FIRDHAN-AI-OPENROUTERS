import { useModel } from "@/contexts/ModelContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const ModelSelector = () => {
  const { selectedModel, setSelectedModel, availableModels } = useModel();

  return (
    <div className="flex flex-col gap-2 p-4 border rounded-lg bg-slate-50">
      <Label htmlFor="model-select" className="text-sm font-medium">
        AI Model
      </Label>
      <Select value={selectedModel} onValueChange={(value) => setSelectedModel(value as any)}>
        <SelectTrigger id="model-select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableModels.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex flex-col">
                <span>{model.name}</span>
                <span className="text-xs text-muted-foreground">{model.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-2">
        Current: <span className="font-semibold">{selectedModel}</span>
      </p>
    </div>
  );
};
