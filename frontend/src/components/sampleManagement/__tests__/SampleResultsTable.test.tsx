import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, jest, test } from "@jest/globals";
import "@testing-library/jest-dom";
import { IntlProvider } from "react-intl";
import messages from "../../../languages/en.json";

jest.mock("../../utils/Utils", () => ({
  postToOpenElisServerFullResponse: jest.fn(),
}));

import SampleResultsTable from "../SampleResultsTable";
import type { SampleItem } from "../sampleManagementTypes";

const msg = messages as Record<string, string>;

const renderWithIntl = (ui: React.ReactElement) =>
  render(
    <IntlProvider locale="en" messages={msg}>
      {ui}
    </IntlProvider>,
  );

describe("SampleResultsTable", () => {
  test("renders empty-state message when no results", () => {
    renderWithIntl(<SampleResultsTable sampleItems={[]} />);
    expect(
      screen.queryByText(msg["sample.management.table.noResults"]),
    ).not.toBeNull();
  });

  test("renders a row with sample external id", () => {
    const items: SampleItem[] = [
      {
        id: "1",
        externalId: "EXT-001",
        sampleType: "Blood",
        isAliquot: false,
        hasRemainingQuantity: true,
        orderedTests: [],
      },
    ];

    renderWithIntl(<SampleResultsTable sampleItems={items} />);
    expect(screen.queryByText("EXT-001")).not.toBeNull();
  });
});

