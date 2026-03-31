import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

    const input = screen.getByRole("searchbox", {
      name: msg["sample.management.search.label"],
    });

    await userEvent.type(
      input,
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

    const input = screen.getByRole("searchbox", {
      name: msg["sample.management.search.label"],
    });
    await userEvent.type(input, "A-2");
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", charCode: 13 });

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

