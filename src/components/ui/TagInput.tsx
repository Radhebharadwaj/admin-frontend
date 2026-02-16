import React, { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagInput({ value = [], onChange, placeholder = "Add a tag..." }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (tag: string) => {
    const trimmed = tag.replace(/\s+/g, ' ').trim();
    if (!trimmed) return;
    
    if (trimmed.length > 20) {
      // Ignore words longer than 20 characters
      return;
    }

    if (value.length >= 5) {
      // Tag limit reached
      return;
    }

    // Case-insensitive duplicate check
    const isDuplicate = value.some((v) => v.toLowerCase() === trimmed.toLowerCase());
    
    if (!isDuplicate) {
      onChange([...value, trimmed]);
    }
    setInputValue("");
  };

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-3 py-2 flex flex-wrap items-center gap-2 transition-all focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50">
      {value.map((tag, index) => (
        <span
          key={index}
          className="bg-indigo-500/10 text-indigo-400 rounded-md px-2 py-1 text-sm flex items-center gap-1 font-medium"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(index)}
            className="hover:text-indigo-300 transition-colors focus:outline-none"
            aria-label={`Remove ${tag}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}
      {value.length < 5 && (
        <input
          type="text"
          className="flex-1 min-w-[120px] bg-transparent text-white text-sm focus:outline-none placeholder-zinc-600 py-1"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(inputValue)}
          placeholder={value.length === 0 ? placeholder : ""}
          maxLength={25}
        />
      )}
    </div>
  );
}
