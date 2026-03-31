import React, { useState, useCallback, useRef, useEffect } from "react";
import { Search, Loading, Button } from "@carbon/react";
import { Search as SearchIcon } from "@carbon/icons-react";
import { useIntl } from "react-intl";
import { getFromOpenElisServer } from "../utils/Utils";
import type {
  SearchBannerState,
  SearchSamplesResponse,
} from "./sampleManagementTypes";

export interface SampleSearchProps {
  onSearchResults: (
    response: SearchSamplesResponse | null,
    error: SearchBannerState | null,
  ) => void;
  includeTests?: boolean;
}

/**
 * SampleSearch - Search component for finding sample items by accession number.
 *
 * Related: Feature 001-sample-management, User Story 1, Task T033
 */
function SampleSearch({
  onSearchResults,
  includeTests = false,
}: SampleSearchProps) {
  const intl = useIntl();
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const performSearch = useCallback(
    (accessionNumber: string) => {
      if (!accessionNumber || accessionNumber.trim() === "") {
        onSearchResults(null, null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const endpoint = `/rest/sample-management/search?accessionNumber=${encodeURIComponent(
        accessionNumber.trim(),
      )}&includeTests=${includeTests}`;

      getFromOpenElisServer(endpoint, (response: unknown) => {
        setIsLoading(false);

        if (response) {
          onSearchResults(response as SearchSamplesResponse, null);
        } else {
          onSearchResults(null, {
            message: intl.formatMessage({
              id: "sample.management.search.error.general",
            }),
          });
        }
      });
    },
    [includeTests, onSearchResults, intl],
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setSearchValue(newValue);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  };

  const handleSearchSubmit = () => {
    performSearch(searchValue);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearchSubmit();
    }
  };

  const handleClearSearch = () => {
    setSearchValue("");
    setIsLoading(false);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    onSearchResults(null, null);
  };

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
      <div style={{ position: "relative", flex: 1 }}>
        <Search
          id="sample-search-input"
          labelText={intl.formatMessage({
            id: "sample.management.search.label",
          })}
          placeholder={intl.formatMessage({
            id: "sample.management.search.placeholder",
          })}
          value={searchValue}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          onClear={handleClearSearch}
          disabled={isLoading}
          size="lg"
        />
        {isLoading && (
          <div
            style={{
              position: "absolute",
              right: "40px",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <Loading
              small
              withOverlay={false}
              description={intl.formatMessage({
                id: "sample.management.search.loading",
              })}
            />
          </div>
        )}
      </div>
      <Button
        kind="primary"
        renderIcon={SearchIcon}
        onClick={handleSearchSubmit}
        disabled={isLoading || !searchValue.trim()}
        style={{ minHeight: "48px" }}
      >
        {intl.formatMessage({ id: "label.button.search" })}
      </Button>
    </div>
  );
}

export default SampleSearch;
