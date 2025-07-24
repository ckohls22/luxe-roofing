// components/SearchBoxError.tsx
import React from "react";
import { Alert } from "@/components/ui";

interface SearchBoxErrorProps {
  error: string;
}

export const SearchBoxError: React.FC<SearchBoxErrorProps> = ({ error }) => {
  return (
    <Alert variant="destructive" id="search-error">
      {error}
    </Alert>
  );
};