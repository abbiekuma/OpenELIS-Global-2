import React, { useState, useMemo } from "react";
import {
  Grid,
  Column,
  Section,
  Heading,
  InlineNotification,
  Button,
  Tag,
} from "@carbon/react";
import { Add, Chemistry, CheckboxChecked, Printer } from "@carbon/icons-react";
import { FormattedMessage, useIntl } from "react-intl";
import PageBreadCrumb from "../common/PageBreadCrumb";
import SampleSearch from "./SampleSearch";
import SampleResultsTable from "./SampleResultsTable";
import CreateAliquotModal from "./CreateAliquotModal";
import AddTestsModal from "./AddTestsModal";
import config from "../../config.json";
import type {
  AddTestsSuccessPayload,
  AliquotCreationSuccessPayload,
  SampleItem,
  SearchBannerState,
  SearchSamplesResponse,
} from "./sampleManagementTypes";

interface BreadcrumbItem {
  label: string;
  link?: string;
}

interface AliquotStats {
  aliquots: SampleItem[];
  parents: SampleItem[];
  aliquotCount: number;
  parentCount: number;
  selectedAliquotCount: number;
  selectedParentCount: number;
}

/**
 * SampleManagement - Main container component for Sample Management feature.
 *
 * Related: Feature 001-sample-management, User Story 1, Task T035
 */
export default function SampleManagement() {
  const intl = useIntl();

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "home.label", link: "/" },
    { label: "menu.genericSample" },
    { label: "banner.menu.sampleManagement" },
  ];

  const [searchResponse, setSearchResponse] =
    useState<SearchSamplesResponse | null>(null);
  const [searchError, setSearchError] = useState<SearchBannerState | null>(
    null,
  );
  const [selectedSampleIds, setSelectedSampleIds] = useState<string[]>([]);

  const [isAliquotModalOpen, setIsAliquotModalOpen] = useState(false);

  const [isAddTestsModalOpen, setIsAddTestsModalOpen] = useState(false);

  const selectedSample: SampleItem | null =
    selectedSampleIds.length === 1
      ? searchResponse?.sampleItems?.find(
          (item) => item.id === selectedSampleIds[0],
        ) ?? null
      : null;

  const aliquotStats: AliquotStats = useMemo(() => {
    if (!searchResponse?.sampleItems) {
      return {
        aliquots: [],
        parents: [],
        aliquotCount: 0,
        parentCount: 0,
        selectedAliquotCount: 0,
        selectedParentCount: 0,
      };
    }

    const aliquots = searchResponse.sampleItems.filter(
      (item) => item.isAliquot,
    );
    const parents = searchResponse.sampleItems.filter(
      (item) => !item.isAliquot,
    );

    const selectedAliquots = selectedSampleIds.filter((id) =>
      aliquots.some((a) => a.id === id),
    );
    const selectedParents = selectedSampleIds.filter((id) =>
      parents.some((p) => p.id === id),
    );

    return {
      aliquots,
      parents,
      aliquotCount: aliquots.length,
      parentCount: parents.length,
      selectedAliquotCount: selectedAliquots.length,
      selectedParentCount: selectedParents.length,
    };
  }, [searchResponse?.sampleItems, selectedSampleIds]);

  const handleSelectAllAliquots = () => {
    const aliquotIds = aliquotStats.aliquots.map((a) => a.id);
    setSelectedSampleIds(aliquotIds);
  };

  const handleSelectAllParents = () => {
    const parentIds = aliquotStats.parents.map((p) => p.id);
    setSelectedSampleIds(parentIds);
  };

  const handleClearSelection = () => {
    setSelectedSampleIds([]);
  };

  const handleSearchResults = (
    response: SearchSamplesResponse | null,
    error: SearchBannerState | null,
  ) => {
    setSearchResponse(response);
    setSearchError(error);

    setSelectedSampleIds([]);
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedSampleIds(selectedIds);
  };

  const handleDismissError = () => {
    setSearchError(null);
  };

  const handleOpenAliquotModal = () => {
    setIsAliquotModalOpen(true);
  };

  const handleCloseAliquotModal = () => {
    setIsAliquotModalOpen(false);
  };

  const handleAliquotSuccess = (response: AliquotCreationSuccessPayload) => {
    if (searchResponse && searchResponse.accessionNumber) {
      handleSearchResults(null, null);

      const aliquotCount = response.aliquotCount || 1;
      let message: string;
      if (aliquotCount > 1) {
        const externalIds = (response.aliquots || [])
          .map((a) => a.externalId)
          .join(", ");
        message = intl.formatMessage(
          { id: "sample.management.aliquot.successMultiple" },
          { count: aliquotCount, externalIds: externalIds },
        );
      } else {
        message = intl.formatMessage(
          { id: "sample.management.aliquot.success" },
          { externalId: response.aliquot?.externalId ?? "" },
        );
      }

      setSearchError({
        message: message,
        kind: "success",
      });
    }
  };

  const handleOpenAddTestsModal = () => {
    setIsAddTestsModalOpen(true);
  };

  const handleCloseAddTestsModal = () => {
    setIsAddTestsModalOpen(false);
  };

  const handleAddTestsSuccess = (response: AddTestsSuccessPayload) => {
    const totalSkipped = response.results.reduce(
      (sum, r) => sum + (r.skippedTestIds ? r.skippedTestIds.length : 0),
      0,
    );

    const hasDetailedResults = response.results && response.results.length > 1;

    let detailedBreakdown = "";
    if (hasDetailedResults) {
      const sampleResults = response.results.map((result) => {
        const addedCount = result.addedTestIds ? result.addedTestIds.length : 0;
        const skippedCount = result.skippedTestIds
          ? result.skippedTestIds.length
          : 0;

        const displayId = result.sampleItemExternalId || result.sampleItemId;

        if (skippedCount > 0) {
          return intl.formatMessage(
            { id: "sample.management.addTests.resultItem.withSkipped" },
            { sampleId: displayId, added: addedCount, skipped: skippedCount },
          );
        } else {
          return intl.formatMessage(
            { id: "sample.management.addTests.resultItem" },
            { sampleId: displayId, added: addedCount },
          );
        }
      });

      detailedBreakdown = sampleResults.join("; ");
    }

    let message: string;
    if (hasDetailedResults) {
      if (totalSkipped > 0) {
        message = intl.formatMessage(
          { id: "sample.management.addTests.successDetailedWithSkipped" },
          {
            added: response.successCount,
            skipped: totalSkipped,
            samples: response.results.length,
            details: detailedBreakdown,
          },
        );
      } else {
        message = intl.formatMessage(
          { id: "sample.management.addTests.successDetailed" },
          {
            count: response.successCount,
            samples: response.results.length,
            details: detailedBreakdown,
          },
        );
      }
    } else {
      if (totalSkipped > 0) {
        message = intl.formatMessage(
          { id: "sample.management.addTests.successWithSkipped" },
          { added: response.successCount, skipped: totalSkipped },
        );
      } else {
        message = intl.formatMessage(
          { id: "sample.management.addTests.success" },
          { count: response.successCount },
        );
      }
    }

    setSearchError({
      message: message,
      kind: "success",
    });

    setSelectedSampleIds([]);
  };

  const handlePrintBarCode = () => {
    if (searchResponse && searchResponse.accessionNumber) {
      const barcodesPdf =
        config.serverBaseUrl +
        `/LabelMakerServlet?labNo=${searchResponse.accessionNumber}`;
      window.open(barcodesPdf);
    }
  };

  const handleTestRemoved = (
    sampleItemId: string,
    analysisId: string,
    testName: string,
  ) => {
    if (searchResponse && searchResponse.sampleItems) {
      const updatedSampleItems = searchResponse.sampleItems.map((item) => {
        if (item.id === sampleItemId) {
          return {
            ...item,
            orderedTests: (item.orderedTests || []).filter(
              (test) => test.analysisId !== analysisId,
            ),
          };
        }
        return item;
      });

      setSearchResponse({
        ...searchResponse,
        sampleItems: updatedSampleItems,
      });
    }

    setSearchError({
      message: intl.formatMessage(
        { id: "sample.management.cancelTest.success" },
        { testName: testName },
      ),
      kind: "success",
    });
  };

  return (
    <>
      <PageBreadCrumb breadcrumbs={breadcrumbs} />

      <Grid fullWidth={true}>
        <Column lg={16} md={8} sm={4}>
          <Section>
            <Heading>
              <FormattedMessage
                id="sample.management.title"
                defaultMessage="Sample Management"
              />
            </Heading>
          </Section>
        </Column>
      </Grid>

      <div className="orderLegendBody">
        {searchError && (
          <Grid fullWidth={true}>
            <Column lg={16} md={8} sm={4}>
              <InlineNotification
                kind={searchError.kind || "error"}
                title={intl.formatMessage({
                  id:
                    searchError.kind === "success"
                      ? "sample.management.success.title"
                      : "sample.management.error.title",
                })}
                subtitle={searchError.message}
                onClose={handleDismissError}
              />
            </Column>
          </Grid>
        )}

        <Grid fullWidth={true}>
          <Column lg={16} md={8} sm={4}>
            <Section>
              <Heading>
                <FormattedMessage
                  id="sample.management.search.title"
                  defaultMessage="Search Samples"
                />
              </Heading>
            </Section>
          </Column>
        </Grid>

        <Grid fullWidth={true}>
          <Column lg={16} md={8} sm={4}>
            <SampleSearch
              onSearchResults={handleSearchResults}
              includeTests={true}
            />
          </Column>
        </Grid>

        {searchResponse &&
          searchResponse.sampleItems &&
          searchResponse.sampleItems.length > 0 && (
            <Grid fullWidth={true}>
              <Column lg={16} md={8} sm={4}>
                <div
                  style={{
                    marginTop: "1rem",
                    marginBottom: "1rem",
                    padding: "0.75rem",
                    backgroundColor: "#f4f4f4",
                    borderRadius: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "1.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>
                        <strong>
                          <FormattedMessage id="sample.management.results.accessionNumber" />
                          :
                        </strong>{" "}
                        {searchResponse.accessionNumber}
                      </span>
                      <span>
                        <strong>
                          <FormattedMessage id="sample.management.results.totalCount" />
                          :
                        </strong>{" "}
                        {searchResponse.totalCount}{" "}
                        {searchResponse.totalCount === 1 ? (
                          <FormattedMessage id="sample.management.results.item" />
                        ) : (
                          <FormattedMessage id="sample.management.results.items" />
                        )}
                      </span>
                      {aliquotStats.aliquotCount > 0 && (
                        <span>
                          <Tag type="blue" size="sm">
                            {aliquotStats.aliquotCount}{" "}
                            <FormattedMessage id="sample.management.results.aliquots" />
                          </Tag>
                        </span>
                      )}
                      {selectedSampleIds.length > 0 && (
                        <span>
                          <strong>
                            <FormattedMessage id="sample.management.results.selected" />
                            :
                          </strong>{" "}
                          {selectedSampleIds.length}
                          {aliquotStats.selectedAliquotCount > 0 && (
                            <span
                              style={{
                                marginLeft: "0.25rem",
                                color: "#0f62fe",
                              }}
                            >
                              ({aliquotStats.selectedAliquotCount}{" "}
                              <FormattedMessage id="sample.management.results.aliquotsSelected" />
                              )
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {aliquotStats.aliquotCount > 0 && (
                        <Button
                          kind="ghost"
                          size="sm"
                          renderIcon={CheckboxChecked}
                          onClick={handleSelectAllAliquots}
                          disabled={
                            aliquotStats.selectedAliquotCount ===
                            aliquotStats.aliquotCount
                          }
                        >
                          <FormattedMessage id="sample.management.action.selectAllAliquots" />
                        </Button>
                      )}
                      {aliquotStats.parentCount > 0 &&
                        aliquotStats.aliquotCount > 0 && (
                          <Button
                            kind="ghost"
                            size="sm"
                            onClick={handleSelectAllParents}
                            disabled={
                              aliquotStats.selectedParentCount ===
                              aliquotStats.parentCount
                            }
                          >
                            <FormattedMessage id="sample.management.action.selectAllParents" />
                          </Button>
                        )}
                      {selectedSampleIds.length > 0 && (
                        <Button
                          kind="ghost"
                          size="sm"
                          onClick={handleClearSelection}
                        >
                          <FormattedMessage id="sample.management.action.clearSelection" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Column>
            </Grid>
          )}

        {searchResponse &&
          searchResponse.sampleItems &&
          searchResponse.sampleItems.length === 0 && (
            <Grid fullWidth={true}>
              <Column lg={16} md={8} sm={4}>
                <InlineNotification
                  kind="info"
                  title={intl.formatMessage({
                    id: "sample.management.noResults.title",
                  })}
                  subtitle={intl.formatMessage(
                    { id: "sample.management.noResults.subtitle" },
                    { accessionNumber: searchResponse.accessionNumber },
                  )}
                  hideCloseButton
                />
              </Column>
            </Grid>
          )}

        {searchResponse &&
          searchResponse.sampleItems &&
          searchResponse.sampleItems.length > 0 &&
          selectedSampleIds.length > 0 && (
            <Grid fullWidth={true}>
              <Column lg={16} md={8} sm={4}>
                <div
                  style={{
                    marginTop: "1rem",
                    marginBottom: "1rem",
                    display: "flex",
                    gap: "1rem",
                  }}
                >
                  {selectedSampleIds.length === 1 && selectedSample && (
                    <Button
                      kind="primary"
                      renderIcon={Add}
                      onClick={handleOpenAliquotModal}
                      disabled={!selectedSample.hasRemainingQuantity}
                    >
                      <FormattedMessage
                        id="sample.management.action.createAliquot"
                        defaultMessage="Create Aliquot"
                      />
                    </Button>
                  )}

                  <Button
                    kind="secondary"
                    renderIcon={Chemistry}
                    onClick={handleOpenAddTestsModal}
                  >
                    <FormattedMessage
                      id="sample.management.addTests.button"
                      defaultMessage="Add Tests"
                    />
                  </Button>

                  <Button
                    kind="tertiary"
                    renderIcon={Printer}
                    onClick={handlePrintBarCode}
                  >
                    <FormattedMessage id="print.barcode" />
                  </Button>
                </div>
              </Column>
            </Grid>
          )}

        {searchResponse &&
          searchResponse.sampleItems &&
          searchResponse.sampleItems.length > 0 && (
            <>
              <Grid fullWidth={true}>
                <Column lg={16} md={8} sm={4}>
                  <Section>
                    <Heading>
                      <FormattedMessage
                        id="sample.management.results.title"
                        defaultMessage="Sample Items"
                      />
                    </Heading>
                  </Section>
                </Column>
              </Grid>

              <Grid fullWidth={true}>
                <Column lg={16} md={8} sm={4}>
                  <SampleResultsTable
                    sampleItems={searchResponse.sampleItems}
                    onSelectionChange={handleSelectionChange}
                    onTestRemoved={handleTestRemoved}
                  />
                </Column>
              </Grid>
            </>
          )}
      </div>

      {selectedSample && (
        <CreateAliquotModal
          open={isAliquotModalOpen}
          onClose={handleCloseAliquotModal}
          parentSample={selectedSample}
          onSuccess={handleAliquotSuccess}
        />
      )}

      <AddTestsModal
        open={isAddTestsModalOpen}
        onClose={handleCloseAddTestsModal}
        selectedSampleIds={selectedSampleIds}
        selectedSamples={
          searchResponse?.sampleItems?.filter((item) =>
            selectedSampleIds.includes(item.id),
          ) || []
        }
        onSuccess={handleAddTestsSuccess}
      />
    </>
  );
}
