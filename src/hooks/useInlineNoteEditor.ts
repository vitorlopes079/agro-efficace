import { useState, useCallback } from "react";

type UseInlineNoteEditorProps = {
  initialValue: string;
  onSave: (value: string, onSuccess?: () => void) => Promise<void>;
};

export function useInlineNoteEditor({
  initialValue,
  onSave,
}: UseInlineNoteEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);

  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const cancelEditing = useCallback(() => {
    setValue(initialValue);
    setIsEditing(false);
  }, [initialValue]);

  const saveChanges = useCallback(async () => {
    await onSave(value, () => setIsEditing(false));
  }, [value, onSave]);

  const updateValue = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  const resetValue = useCallback((newInitialValue: string) => {
    setValue(newInitialValue);
  }, []);

  return {
    isEditing,
    value,
    startEditing,
    cancelEditing,
    saveChanges,
    updateValue,
    resetValue,
  };
}
