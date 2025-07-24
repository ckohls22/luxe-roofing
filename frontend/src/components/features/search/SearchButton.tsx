// components/SearchButton.tsx
import React from "react";
import { Button } from "@/components/ui";
import { Search } from "lucide-react";

interface SearchButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled: boolean;
}

export const SearchButton: React.FC<SearchButtonProps> = ({ onClick, disabled }) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="absolute right-2 h-10 w-10 mt-1 bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-400 hover:to-orange-500 transition-all duration-300 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Search address"
    >
      <Search size={20} />
    </Button>
  );
};
