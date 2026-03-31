import React, { useMemo, useState, useCallback } from "react";
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableSelectRow,
  TableSelectAll,
  TableExpandRow,
  TableExpandedRow,
  TableExpandHeader,
  Tag,
  Button,
  InlineLoading,
} from "@carbon/react";
import { useIntl, FormattedMessage } from "react-intl";
import { Folder, Document, TrashCan, Chemistry } from "@carbon/icons-react";
import { postToOpenElisServerFullResponse } from "../utils/Utils";
import type {
  OrderedTest,
  SampleItem,
  SampleResultsTableRow,
} from "./sampleManagementTypes";

export interface SampleResultsTableProps {
  sampleItems?: SampleItem[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onTestRemoved?: (
    sampleItemId: string,
    analysisId: string,
    testName: string,
  ) => void;
}

/** Carbon-processed row shape used inside DataTable render prop. */
interface CarbonDataRow {
  id: string;
  cells: Array<{
    id: string;
    info: { header: string };
    value: React.ReactNode;
  }>;
}

function SampleResultsTable({
  sampleItems = [],
  onSelectionChange,
  onTestRemoved,
}: SampleResultsTableProps) {
  const intl = useIntl();

  const [cancellingTests, setCancellingTests] = useState<
    Record<string, boolean>
  >({});

  const headers = useMemo(
    () => [
      {
        key: "externalId",
        header: intl.formatMessage({
          id: "sample.management.table.header.externalId",
        }),
      },
      {
        key: "sampleType",
        header: intl.formatMessage({
          id: "sample.management.table.header.sampleType",
        }),
      },
      {
        key: "quantity",
        header: intl.formatMessage({
          id: "sample.management.table.header.quantity",
        }),
      },
      {
        key: "remainingQuantity",
        header: intl.formatMessage({
          id: "sample.management.table.header.remainingQuantity",
        }),
      },
      {
        key: "status",
        header: intl.formatMessage({
          id: "sample.management.table.header.status",
        }),
      },
      {
        key: "tests",
        header: intl.formatMessage({
          id: "sample.management.table.header.tests",
        }),
      },
      {
        key: "hierarchy",
        header: intl.formatMessage({
          id: "sample.management.table.header.hierarchy",
        }),
      },
    ],
    [intl],
  );

  const rows: SampleResultsTableRow[] = useMemo(() => {
    return sampleItems.map((item) => {
      const displayRemaining = item.effectiveRemainingQuantity;
      const testCount = item.orderedTests ? item.orderedTests.length : 0;

      return {
        id: item.id,
        externalId: item.externalId || "-",
        sampleType: item.sampleType || "-",
        quantity: item.quantity
          ? `${item.quantity} ${item.unitOfMeasure || ""}`
          : "-",
        remainingQuantity: displayRemaining
          ? `${displayRemaining} ${item.unitOfMeasure || ""}`
          : "-",
        statusId: item.statusId,
        isAliquot: Boolean(item.isAliquot),
        nestingLevel: item.nestingLevel || 0,
        hasRemainingQuantity: Boolean(item.hasRemainingQuantity),
        childAliquotCount: item.childAliquots ? item.childAliquots.length : 0,
        parentExternalId: item.parentExternalId,
        orderedTests: item.orderedTests || [],
        testCount: testCount,
        tests: testCount > 0 ? `${testCount}` : "-",
      };
    });
  }, [sampleItems]);

  const handleCancelTest = useCallback(
    (sampleItemId: string, analysisId: string, testName: string) => {
      setCancellingTests((prev) => ({ ...prev, [analysisId]: true }));

      const payload = JSON.stringify({
        analysisId: analysisId,
        sampleItemId: sampleItemId,
      });

      postToOpenElisServerFullResponse(
        "/rest/sample-management/cancel-test",
        payload,
        (response) => {
          setCancellingTests((prev) => ({ ...prev, [analysisId]: false }));

          if (response.ok) {
            if (onTestRemoved) {
              onTestRemoved(sampleItemId, analysisId, testName);
            }
          } else {
            console.error("Failed to cancel test");
          }
        },
      );
    },
    [onTestRemoved],
  );

  const renderStatusTag = (dataTableRow: CarbonDataRow) => {
    const originalRow = rows.find((r) => r.id === dataTableRow.id);
    if (!originalRow) return null;

    if (!originalRow.hasRemainingQuantity) {
      return (
        <Tag type="red">
          {intl.formatMessage({
            id: "sample.management.status.allVolumeDispensed",
          })}
        </Tag>
      );
    }

    return null;
  };

  const renderTestsCount = (dataTableRow: CarbonDataRow) => {
    const originalRow = rows.find((r) => r.id === dataTableRow.id);
    if (!originalRow) return null;

    if (originalRow.testCount > 0) {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Chemistry size={16} />
          <span>{originalRow.testCount}</span>
        </div>
      );
    }
    return <span style={{ color: "#6f6f6f" }}>-</span>;
  };

  const renderHierarchyIndicator = (dataTableRow: CarbonDataRow) => {
    const originalRow = rows.find((r) => r.id === dataTableRow.id);
    if (!originalRow) return null;

    const nestingIndent = originalRow.nestingLevel * 16;

    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        {originalRow.nestingLevel > 0 && (
          <span
            style={{ marginLeft: `${nestingIndent}px`, marginRight: "4px" }}
          >
            {"└─"}
          </span>
        )}
        {originalRow.childAliquotCount > 0 ? (
          <Folder size={16} style={{ marginRight: "4px" }} />
        ) : (
          <Document size={16} style={{ marginRight: "4px" }} />
        )}
        {originalRow.isAliquot && originalRow.parentExternalId && (
          <span
            style={{ fontSize: "0.75rem", color: "#6f6f6f", marginLeft: "4px" }}
          >
            {intl.formatMessage(
              { id: "sample.management.hierarchy.aliquotOf" },
              { parent: originalRow.parentExternalId },
            )}
          </span>
        )}
        {originalRow.childAliquotCount > 0 && (
          <span
            style={{ fontSize: "0.75rem", color: "#6f6f6f", marginLeft: "4px" }}
          >
            ({originalRow.childAliquotCount}{" "}
            {intl.formatMessage({
              id: "sample.management.hierarchy.aliquots",
            })}
            )
          </span>
        )}
      </div>
    );
  };

  const renderExpandedContent = (row: CarbonDataRow) => {
    const originalRow = rows.find((r) => r.id === row.id);
    if (!originalRow || originalRow.orderedTests.length === 0) {
      return (
        <div
          style={{
            padding: "1rem",
            color: "#6f6f6f",
            fontStyle: "italic",
          }}
        >
          <FormattedMessage id="sample.management.table.noTests" />
        </div>
      );
    }

    return (
      <div style={{ padding: "1rem" }}>
        <div
          style={{
            fontWeight: "600",
            marginBottom: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Chemistry size={20} />
          <FormattedMessage
            id="sample.management.table.orderedTests"
            values={{ count: originalRow.orderedTests.length }}
          />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "0.5rem",
          }}
        >
          {originalRow.orderedTests.map((test: OrderedTest) => (
            <div
              key={test.analysisId}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.5rem 0.75rem",
                backgroundColor: "#f4f4f4",
                borderRadius: "4px",
                border: "1px solid #e0e0e0",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "500" }}>{test.testName}</div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#6f6f6f",
                    display: "flex",
                    gap: "0.75rem",
                    marginTop: "0.25rem",
                  }}
                >
                  {test.status && (
                    <Tag type={getTestStatusType(test.status)} size="sm">
                      {test.status}
                    </Tag>
                  )}
                  {test.orderedDate && (
                    <span>
                      <FormattedMessage id="sample.management.table.orderedDate" />
                      : {new Date(test.orderedDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ marginLeft: "0.5rem" }}>
                {cancellingTests[test.analysisId] ? (
                  <InlineLoading
                    description={intl.formatMessage({
                      id: "sample.management.table.cancelling",
                    })}
                    status="active"
                  />
                ) : (
                  <Button
                    kind="ghost"
                    size="sm"
                    renderIcon={TrashCan}
                    iconDescription={intl.formatMessage({
                      id: "sample.management.table.cancelTest",
                    })}
                    hasIconOnly
                    onClick={() =>
                      handleCancelTest(row.id, test.analysisId, test.testName)
                    }
                    disabled={!canCancelTest(test.status)}
                    tooltipPosition="left"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getTestStatusType = (
    status: string,
  ):
    | "red"
    | "magenta"
    | "purple"
    | "blue"
    | "cyan"
    | "teal"
    | "green"
    | "gray"
    | "cool-gray"
    | "warm-gray"
    | "high-contrast"
    | "outline" => {
    const statusLower = status.toLowerCase();
    if (
      statusLower.includes("complete") ||
      statusLower.includes("final") ||
      statusLower.includes("validated")
    ) {
      return "green";
    }
    if (
      statusLower.includes("cancel") ||
      statusLower.includes("rejected") ||
      statusLower.includes("void")
    ) {
      return "red";
    }
    if (statusLower.includes("pending") || statusLower.includes("waiting")) {
      return "blue";
    }
    if (statusLower.includes("in progress") || statusLower.includes("active")) {
      return "cyan";
    }
    return "gray";
  };

  const canCancelTest = (status?: string) => {
    if (!status) return true;
    const statusLower = status.toLowerCase();
    return !(
      statusLower.includes("complete") ||
      statusLower.includes("final") ||
      statusLower.includes("validated") ||
      statusLower.includes("cancel") ||
      statusLower.includes("rejected") ||
      statusLower.includes("void")
    );
  };

  if (sampleItems.length === 0) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "#6f6f6f",
        }}
      >
        {intl.formatMessage({ id: "sample.management.table.noResults" })}
      </div>
    );
  }

  return (
    <DataTable
      rows={rows}
      headers={headers}
      isSortable
      render={({
        rows: carbonRows,
        headers: carbonHeaders,
        getHeaderProps,
        getRowProps,
        getSelectionProps,
        getTableProps,
        getExpandHeaderProps,
        selectedRows,
        selectRow,
      }) => {
        const notifySelectionChange = (newSelectedRows: CarbonDataRow[]) => {
          if (onSelectionChange) {
            onSelectionChange(newSelectedRows.map((r) => r.id));
          }
        };

        return (
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                <TableExpandHeader
                  aria-label="expand row"
                  {...getExpandHeaderProps()}
                />
                <TableSelectAll
                  {...getSelectionProps()}
                  onSelect={() => {
                    if (selectedRows.length === carbonRows.length) {
                      carbonRows.forEach((row) => {
                        if (selectedRows.some((r) => r.id === row.id)) {
                          selectRow(row.id);
                        }
                      });
                      notifySelectionChange([]);
                    } else {
                      carbonRows.forEach((row) => {
                        if (!selectedRows.some((r) => r.id === row.id)) {
                          selectRow(row.id);
                        }
                      });
                      notifySelectionChange(carbonRows as CarbonDataRow[]);
                    }
                  }}
                />
                {carbonHeaders.map((header) => (
                  <TableHeader key={header.key} {...getHeaderProps({ header })}>
                    {header.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {carbonRows.map((row) => {
                const originalRow = sampleItems.find(
                  (item) => item.id === row.id,
                );
                const isAliquotRow = originalRow?.isAliquot;
                const hasTests =
                  originalRow?.orderedTests &&
                  originalRow.orderedTests.length > 0;

                const typedRow = row as CarbonDataRow;

                return (
                  <React.Fragment key={row.id}>
                    <TableExpandRow
                      {...getRowProps({ row })}
                      style={{
                        borderLeft: isAliquotRow ? "3px solid #0f62fe" : "none",
                        backgroundColor: isAliquotRow ? "#f0f7ff" : "inherit",
                      }}
                    >
                      <TableSelectRow
                        {...getSelectionProps({ row })}
                        onSelect={() => {
                          selectRow(row.id);
                          const isCurrentlySelected = selectedRows.some(
                            (r) => r.id === row.id,
                          );
                          const newSelection = isCurrentlySelected
                            ? selectedRows.filter((r) => r.id !== row.id)
                            : [...selectedRows, row];
                          notifySelectionChange(
                            newSelection as CarbonDataRow[],
                          );
                        }}
                      />
                      {typedRow.cells.map((cell) => (
                        <TableCell key={cell.id}>
                          {cell.info.header === "status"
                            ? renderStatusTag(typedRow)
                            : cell.info.header === "hierarchy"
                              ? renderHierarchyIndicator(typedRow)
                              : cell.info.header === "tests"
                                ? renderTestsCount(typedRow)
                                : cell.value}
                        </TableCell>
                      ))}
                    </TableExpandRow>
                    <TableExpandedRow
                      colSpan={carbonHeaders.length + 2}
                      className="sample-expanded-row"
                      style={{
                        backgroundColor: hasTests ? "#fafafa" : "#fff",
                      }}
                    >
                      {renderExpandedContent(typedRow)}
                    </TableExpandedRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        );
      }}
    />
  );
}

export default SampleResultsTable;
