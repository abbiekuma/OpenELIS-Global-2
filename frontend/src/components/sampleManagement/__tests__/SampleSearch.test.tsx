import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, jest, test } from "@jest/globals";
import "@testing-library/jest-dom";
import { IntlProvider } from "react-intl";
import messages from "../../../languages/en.json";

jest.mock("../../utils/Utils", () => ({
  getFromOpenElisServer: jest.fn(),
}));

import { getFromOpenElisServer } from "../../utils/Utils";
import SampleSearch from "../SampleSearch";

const msg = messages as Record<string, string>;

const renderWithIntl = (ui: React.ReactElement) =>
  render(
    <IntlProvider locale="en" messages={msg}>
      {ui}
    </IntlProvider>,
  );

describe("SampleSearch", () => {
  test("calls search endpoint on button click and returns response", async () => {
    const onSearchResults = jest.fn();
    (getFromOpenElisServer as any).mockImplementation(
      (_endpoint: string, cb: (resp: unknown) => void) => {
        cb({
          accessionNumber: "A-1",
          totalCount: 1,
          sampleItems: [{ id: "1", isAliquot: false }],
        });
      },
    );

    renderWithIntl(
      <SampleSearch onSearchResults={onSearchResults} includeTests={true} />,
    );

    await userEvent.type(
      screen.getByLabelText(msg["sample.management.search.label"]),
      "A-1",
    );
    await userEvent.click(
      screen.getByRole("button", { name: msg["label.button.search"] }),
    );

    expect(getFromOpenElisServer).toHaveBeenCalledTimes(1);
    expect(
      (getFromOpenElisServer as any).mock.calls[0][0],
    ).toBe(
      "/rest/sample-management/search?accessionNumber=A-1&includeTests=true",
    );
    expect(onSearchResults).toHaveBeenCalledWith(
      expect.objectContaining({ accessionNumber: "A-1", totalCount: 1 }),
      null,
    );
  });

  test("submits search on Enter key", async () => {
    const onSearchResults = jest.fn();
    (getFromOpenElisServer as any).mockImplementation(
      (_endpoint: string, cb: (resp: unknown) => void) => cb(undefined),
    );

    renderWithIntl(<SampleSearch onSearchResults={onSearchResults} />);

    const input = screen.getByLabelText(msg["sample.management.search.label"]);
    await userEvent.type(input, "A-2{enter}");

    expect(getFromOpenElisServer).toHaveBeenCalledTimes(1);
    expect(
      (getFromOpenElisServer as any).mock.calls[0][0],
    ).toBe(
      "/rest/sample-management/search?accessionNumber=A-2&includeTests=false",
    );
    expect(onSearchResults).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        message: msg["sample.management.search.error.general"],
      }),
    );
  });
});

