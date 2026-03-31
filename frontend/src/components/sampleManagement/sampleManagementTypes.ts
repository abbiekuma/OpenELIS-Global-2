/**
 * Frontend DTO shapes for Sample Management REST responses.
 * Align with backend as the source of truth; extend when API evolves.
 */

export interface OrderedTest {
  analysisId: string;
  testName: string;
  status?: string;
  orderedDate?: string;
}

export interface SampleItem {
  id: string;
  externalId?: string;
  sampleType?: string;
  quantity?: number | string;
  unitOfMeasure?: string;
  remainingQuantity?: number | string;
  effectiveRemainingQuantity?: number | string;
  statusId?: string;
  isAliquot?: boolean;
  nestingLevel?: number;
  hasRemainingQuantity?: boolean;
  childAliquots?: unknown[];
  parentExternalId?: string;
  orderedTests?: OrderedTest[];
}

export interface SearchSamplesResponse {
  accessionNumber: string;
  sampleItems: SampleItem[];
  totalCount: number;
}

export interface SearchBannerState {
  message: string;
  kind?: "error" | "success" | "info" | "warning";
}

export interface AliquotCreationSuccessPayload {
  aliquotCount?: number;
  aliquots?: Array<{ externalId?: string }>;
  aliquot?: { externalId?: string };
}

export interface AddTestsPerSampleResult {
  skippedTestIds?: string[];
  addedTestIds?: string[];
  sampleItemExternalId?: string;
  sampleItemId?: string;
}

export interface AddTestsSuccessPayload {
  successCount: number;
  results: AddTestsPerSampleResult[];
}

/** Row model passed into Carbon DataTable (before Carbon adds `cells`). */
export interface SampleResultsTableRow {
  id: string;
  externalId: string;
  sampleType: string;
  quantity: string;
  remainingQuantity: string;
  statusId?: string;
  isAliquot: boolean;
  nestingLevel: number;
  hasRemainingQuantity: boolean; // normalized in table row builder
  childAliquotCount: number;
  parentExternalId?: string;
  orderedTests: OrderedTest[];
  testCount: number;
  tests: string;
}
