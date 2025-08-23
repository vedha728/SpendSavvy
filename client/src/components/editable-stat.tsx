import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Edit3 } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface EditableStatProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
  onUpdate: (amount: number) => Promise<void>;
  suffix?: string;
  testId?: string;
}

export default function EditableStat({ 
  label, 
  value, 
  icon, 
  colorClass, 
  onUpdate, 
  suffix = "",
  testId 
}: EditableStatProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: onUpdate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/analytics/stats"] });
      setIsEditing(false);
      toast({
        title: "Updated successfully",
        description: `${label} has been updated!`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const amount = parseFloat(inputValue);
    if (isNaN(amount) || amount < 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number.",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate(amount);
  };

  const handleCancel = () => {
    setInputValue(value.toString());
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div 
      className="bg-surface rounded-xl shadow-sm p-6 border border-gray-100 group hover:shadow-md transition-shadow" 
      data-testid={testId}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-text-secondary text-sm font-medium">{label}</p>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                data-testid={`button-edit-${testId}`}
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <span className="text-xl font-bold text-text-primary mr-1">₹</span>
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-xl font-bold text-text-primary border-0 p-0 h-auto focus-visible:ring-0 bg-transparent w-20"
                  type="number"
                  min="0"
                  autoFocus
                  data-testid={`input-edit-${testId}`}
                />
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="p-1 h-6 w-6 text-green-600 hover:text-green-700"
                  data-testid={`button-save-${testId}`}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                  className="p-1 h-6 w-6 text-red-600 hover:text-red-700"
                  data-testid={`button-cancel-${testId}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-2xl font-bold text-text-primary hover:text-primary transition-colors text-left"
              data-testid={`text-${testId}`}
            >
              ₹{value.toFixed(0)}{suffix}
            </button>
          )}
        </div>
        <div className={`w-12 h-12 ${colorClass} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}