import { useRef, useState } from 'react';
import fileSaver from 'file-saver';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import { jsPDF } from 'jspdf';

import { Label, SegmentInformation } from '@/models/Label';
import type { InformedCanvas } from '@/models/Label';
import {
  buildLabelSourceCounts,
  captureProductEvent,
  captureProductException,
  createOperationContext,
  getDetectedLabelSources,
  getEmptyLabelSourceCounts,
  getErrorCode,
  getErrorType,
  getLabelSourceCountTotal,
  getOperationDurationMs,
  getSizeBucket,
  getSizeMbRounded,
  type FailureStage,
  type OperationContext,
  type ProductEventName,
  type ProductEventProperties,
  type ProductOperation,
  type ProductOutcome,
  type RejectReason,
} from '@/utils/analytics';

const { saveAs } = fileSaver;

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const outputHorizontalMargin = 20;
const outputVerticalMargin = outputHorizontalMargin * 1.75;
const outputLabelWidth = 270.5;
const outputLabelHeight = 383.5;
const outputFormat = 'image/jpeg';
const outputQuality = 0.8;

type ProcessingSnapshot = {
  filesCount: number;
  acceptedFilesCount: number;
  rejectedFilesCount: number;
  inputPagesCount: number;
  payloadSizeBytes: number;
};

type WorkflowError = Error & {
  failureStage?: FailureStage;
};

const emptyProcessingSnapshot: ProcessingSnapshot = {
  filesCount: 0,
  acceptedFilesCount: 0,
  rejectedFilesCount: 0,
  inputPagesCount: 0,
  payloadSizeBytes: 0,
};

function getCurrentDateTimeFormatted(): string {
  const currentDate = new Date();

  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const hours = String(currentDate.getHours()).padStart(2, '0');
  const minutes = String(currentDate.getMinutes()).padStart(2, '0');
  const seconds = String(currentDate.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function toWorkflowError(error: unknown, failureStage: FailureStage): WorkflowError {
  if (error instanceof Error) {
    const workflowError = error as WorkflowError;
    workflowError.failureStage ??= failureStage;
    return workflowError;
  }

  const workflowError = new Error('PDF workflow failed') as WorkflowError;
  workflowError.failureStage = failureStage;
  return workflowError;
}

async function runWorkflowStep<T>(
  failureStage: FailureStage,
  action: () => Promise<T>
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    throw toWorkflowError(error, failureStage);
  }
}

function getFailureStage(error: unknown, fallback: FailureStage): FailureStage {
  if (error instanceof Error && 'failureStage' in error) {
    return (error as WorkflowError).failureStage ?? fallback;
  }

  return fallback;
}

function buildWorkflowProperties({
  context,
  durationMs,
  labels,
  operation,
  outcome,
  snapshot,
  outputPagesCount,
  outputSizeBytes,
  rejectReason,
  failureStage,
  error,
}: {
  context: OperationContext;
  durationMs: number;
  labels: InformedCanvas[];
  operation: ProductOperation;
  outcome: ProductOutcome;
  snapshot: ProcessingSnapshot;
  outputPagesCount: number;
  outputSizeBytes?: number;
  rejectReason?: RejectReason;
  failureStage?: FailureStage;
  error?: unknown;
}): ProductEventProperties {
  const labelSourceCounts = labels.length
    ? buildLabelSourceCounts(labels.map((label) => label.labelType))
    : getEmptyLabelSourceCounts();

  return {
    operation,
    outcome,
    files_count: snapshot.filesCount,
    accepted_files_count: snapshot.acceptedFilesCount,
    rejected_files_count: snapshot.rejectedFilesCount,
    input_pages_count: snapshot.inputPagesCount,
    output_pages_count: outputPagesCount,
    labels_count: labels.length,
    label_source_counts: labelSourceCounts,
    label_sources_detected: getDetectedLabelSources(labelSourceCounts),
    label_source_count_total: getLabelSourceCountTotal(labelSourceCounts),
    payload_size_bucket: getSizeBucket(snapshot.payloadSizeBytes),
    payload_size_mb_rounded: getSizeMbRounded(snapshot.payloadSizeBytes),
    output_size_bucket: outputSizeBytes === undefined ? undefined : getSizeBucket(outputSizeBytes),
    output_size_mb_rounded:
      outputSizeBytes === undefined ? undefined : getSizeMbRounded(outputSizeBytes),
    duration_ms: durationMs,
    event_id: context.event_id,
    trace_id: context.trace_id,
    reject_reason: rejectReason,
    failure_stage: failureStage,
    error_type: error === undefined ? undefined : getErrorType(error),
    error_code: error === undefined ? undefined : getErrorCode(error),
  };
}

function captureWorkflowFailure(
  eventName: ProductEventName,
  properties: ProductEventProperties,
  error: unknown
): void {
  captureProductEvent(eventName, properties);
  captureProductException(error, {
    operation: properties.operation,
    outcome: properties.outcome,
    event_id: properties.event_id,
    trace_id: properties.trace_id,
    duration_ms: properties.duration_ms,
    failure_stage: properties.failure_stage,
    error_type: properties.error_type,
    error_code: properties.error_code,
  });
}

function buildValidationSnapshot(
  files: File[],
  rejectedFilesCount: number,
  payloadSizeBytes: number
): ProcessingSnapshot {
  return {
    filesCount: files.length,
    acceptedFilesCount: 0,
    rejectedFilesCount,
    inputPagesCount: 0,
    payloadSizeBytes,
  };
}

export function usePDFHandler() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [pdfPages, setPdfPages] = useState<InformedCanvas[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastProcessingSnapshotRef = useRef<ProcessingSnapshot>(emptyProcessingSnapshot);

  const clearPdfPages = () => {
    setPdfPages([]);
    setSelectedFiles(null);
    lastProcessingSnapshotRef.current = emptyProcessingSnapshot;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);
    const context = createOperationContext();
    const files = e.target.files ? Array.from(e.target.files) : [];
    const totalSize = files.reduce((total, file) => total + file.size, 0);

    const captureValidationReject = (rejectReason: RejectReason, rejectedFilesCount: number) => {
      captureProductEvent(
        'label_file_rejected',
        buildWorkflowProperties({
          context,
          durationMs: getOperationDurationMs(context),
          labels: [],
          operation: 'validate_files',
          outcome: 'rejected',
          snapshot: buildValidationSnapshot(files, rejectedFilesCount, totalSize),
          outputPagesCount: 0,
          rejectReason,
        })
      );
    };

    const nonPdfFiles = files.filter((file) => file.type !== 'application/pdf');
    if (nonPdfFiles.length > 0) {
      captureValidationReject('non_pdf_file', nonPdfFiles.length);
      alert('Some files were not uploaded because they are not PDFs.');
      setIsLoading(false);
      return;
    }

    if (files.length > 100) {
      captureValidationReject('too_many_files', files.length);
      alert('You cannot upload more than 100 files at once.');
      setIsLoading(false);
      return;
    }

    const largeFiles = files.filter((file) => file.size > 1000000);
    if (largeFiles.length > 0) {
      captureValidationReject('file_too_large', largeFiles.length);
      alert('Some files were not uploaded because they exceed the 1MB size limit.');
      setIsLoading(false);
      return;
    }

    if (totalSize > 5000000) {
      captureValidationReject('payload_too_large', files.length);
      alert('The total size of all files exceeds the 5MB limit.');
      setIsLoading(false);
      return;
    }

    const validFiles = files.filter(
      (file) => file.type === 'application/pdf' && file.size <= 1000000
    );

    const payloadSizeBytes = validFiles.reduce((total, file) => total + file.size, 0);

    if (validFiles.length === 0) {
      captureValidationReject('no_valid_files', files.length);
      clearPdfPages();
      setIsLoading(false);
      alert('There were no valid files selected.');
      return;
    }

    setSelectedFiles(validFiles as unknown as FileList);
    lastProcessingSnapshotRef.current = {
      filesCount: files.length,
      acceptedFilesCount: validFiles.length,
      rejectedFilesCount: files.length - validFiles.length,
      inputPagesCount: 0,
      payloadSizeBytes,
    };

    try {
      await handleFileProcessing(validFiles, payloadSizeBytes, context);
    } catch (error) {
      const durationMs = getOperationDurationMs(context);
      const snapshot = lastProcessingSnapshotRef.current;

      captureWorkflowFailure(
        'label_processing_failed',
        buildWorkflowProperties({
          context,
          durationMs,
          labels: [],
          operation: 'process_labels',
          outcome: 'failure',
          snapshot,
          outputPagesCount: 0,
          failureStage: getFailureStage(error, 'parse_pdf'),
          error,
        }),
        error
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileProcessing = async (
    validFiles: File[],
    payloadSizeBytes: number,
    context: OperationContext
  ) => {
    let allPages = 0;

    const allLabels = await Promise.all(
      validFiles.map(async (file: File) => {
        const labels: InformedCanvas[] = [];

        const result = await runWorkflowStep('read_file', async () => {
          const fileReader = new FileReader();

          return await new Promise<ArrayBuffer>((resolve, reject) => {
            fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
            fileReader.onerror = () => reject(fileReader.error ?? new Error('File read failed'));
            fileReader.readAsArrayBuffer(file);
          });
        });

        const pdf = await runWorkflowStep(
          'parse_pdf',
          async () => await getDocument({ data: new Uint8Array(result) }).promise
        );
        const numPages = pdf.numPages;
        allPages += numPages;
        lastProcessingSnapshotRef.current = {
          ...lastProcessingSnapshotRef.current,
          inputPagesCount: allPages,
        };

        for (let i = 1; i <= numPages; i++) {
          const page = await runWorkflowStep('parse_pdf', async () => await pdf.getPage(i));
          const content = await runWorkflowStep(
            'classify_label',
            async () => await page.getTextContent()
          );

          const label = await runWorkflowStep(
            'classify_label',
            async () => new Label({ content })
          );
          const newPages = await runWorkflowStep(
            'render_label',
            async () => await label.getPages(document, page)
          );

          for (const newPage of newPages.pages) {
            labels.push(newPage);
          }
        }

        return labels;
      })
    );

    const flatLabels = allLabels.flat();
    const snapshot: ProcessingSnapshot = {
      filesCount: validFiles.length,
      acceptedFilesCount: validFiles.length,
      rejectedFilesCount: 0,
      inputPagesCount: allPages,
      payloadSizeBytes,
    };

    captureProductEvent(
      'label_processing_completed',
      buildWorkflowProperties({
        context,
        durationMs: getOperationDurationMs(context),
        labels: flatLabels,
        operation: 'process_labels',
        outcome: 'success',
        snapshot,
        outputPagesCount: flatLabels.length,
      })
    );

    lastProcessingSnapshotRef.current = snapshot;
    setPdfPages(flatLabels);
  };

  async function preparePDF(labels: InformedCanvas[], hasMargin: boolean) {
    const doc = new jsPDF({ unit: 'pt' });
    let imagesOnAPage = 0;
    let allPages = 1;

    labels.forEach((canvas, index) => {
      const imgData = canvas.toDataURL(outputFormat, outputQuality);

      const coordinate: SegmentInformation = {
        x: outputHorizontalMargin,
        y: outputVerticalMargin,
        width: outputLabelWidth,
        height: outputLabelHeight,
      };

      if (index !== 0 && index % 4 === 0) {
        doc.addPage();
        allPages++;
        imagesOnAPage = 0;
      }

      if (hasMargin) {
        switch (imagesOnAPage) {
          case 0:
            coordinate.x = outputHorizontalMargin;
            coordinate.y = outputVerticalMargin;
            break;
          case 1:
            coordinate.x =
              doc.internal.pageSize.getWidth() - outputHorizontalMargin - outputLabelWidth;
            coordinate.y = outputVerticalMargin;
            break;
          case 2:
            coordinate.x = outputHorizontalMargin;
            coordinate.y =
              doc.internal.pageSize.getHeight() - outputVerticalMargin - outputLabelHeight;
            break;
          case 3:
            coordinate.x =
              doc.internal.pageSize.getWidth() - outputHorizontalMargin - outputLabelWidth;
            coordinate.y =
              doc.internal.pageSize.getHeight() - outputVerticalMargin - outputLabelHeight;
            break;
        }
      } else {
        coordinate.width = doc.internal.pageSize.getWidth() / 2 - outputHorizontalMargin / 2;
        coordinate.height = doc.internal.pageSize.getHeight() / 2 - outputVerticalMargin / 2;

        switch (imagesOnAPage) {
          case 0:
            coordinate.x = 0 + outputHorizontalMargin / 8;
            coordinate.y = 0 + outputHorizontalMargin;
            break;
          case 1:
            coordinate.x =
              doc.internal.pageSize.getWidth() / 2 +
              outputHorizontalMargin / 2 -
              outputHorizontalMargin / 8;
            coordinate.y = 0 + outputHorizontalMargin;
            break;
          case 2:
            coordinate.x = 0 + outputHorizontalMargin / 8;
            coordinate.y = doc.internal.pageSize.getHeight() / 2 + outputVerticalMargin / 2;
            break;
          case 3:
            coordinate.x =
              doc.internal.pageSize.getWidth() / 2 +
              outputHorizontalMargin / 2 -
              outputHorizontalMargin / 8;
            coordinate.y = doc.internal.pageSize.getHeight() / 2 + outputVerticalMargin / 2;
            break;
        }
      }

      doc.addImage(imgData, coordinate.x, coordinate.y, coordinate.width, coordinate.height);
      imagesOnAPage++;
    });

    const uint8Array = doc.output('arraybuffer');
    return {
      blob: new Blob([uint8Array], { type: 'application/pdf' }),
      pagesCount: allPages,
    };
  }

  const handleFilePrinting = async (hasMargin: boolean) => {
    const context = createOperationContext();
    const snapshot = lastProcessingSnapshotRef.current;
    let failureStage: FailureStage = 'compose_pdf';

    try {
      const { blob, pagesCount } = await runWorkflowStep(
        'compose_pdf',
        async () => await preparePDF(pdfPages, hasMargin)
      );
      const blobURL = URL.createObjectURL(blob);

      failureStage = 'print_pdf';
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      iframe.src = blobURL;

      iframe.onload = function () {
        setTimeout(function () {
          iframe.contentWindow?.print();
        }, 1);
      };

      captureProductEvent(
        'label_pdf_printed',
        buildWorkflowProperties({
          context,
          durationMs: getOperationDurationMs(context),
          labels: pdfPages,
          operation: 'print_pdf',
          outcome: 'success',
          snapshot,
          outputPagesCount: pagesCount,
          outputSizeBytes: blob.size,
        })
      );
    } catch (error) {
      captureWorkflowFailure(
        'label_pdf_print_failed',
        buildWorkflowProperties({
          context,
          durationMs: getOperationDurationMs(context),
          labels: pdfPages,
          operation: 'print_pdf',
          outcome: 'failure',
          snapshot,
          outputPagesCount: 0,
          failureStage: getFailureStage(error, failureStage),
          error,
        }),
        error
      );
    }
  };

  const handleFileDownload = async (hasMargin: boolean) => {
    const context = createOperationContext();
    const snapshot = lastProcessingSnapshotRef.current;
    let failureStage: FailureStage = 'compose_pdf';

    try {
      const { blob, pagesCount } = await runWorkflowStep(
        'compose_pdf',
        async () => await preparePDF(pdfPages, hasMargin)
      );

      failureStage = 'download_pdf';
      saveAs(blob, `PostLabel - ${getCurrentDateTimeFormatted()}.pdf`);

      captureProductEvent(
        'label_pdf_downloaded',
        buildWorkflowProperties({
          context,
          durationMs: getOperationDurationMs(context),
          labels: pdfPages,
          operation: 'download_pdf',
          outcome: 'success',
          snapshot,
          outputPagesCount: pagesCount,
          outputSizeBytes: blob.size,
        })
      );
    } catch (error) {
      captureWorkflowFailure(
        'label_pdf_download_failed',
        buildWorkflowProperties({
          context,
          durationMs: getOperationDurationMs(context),
          labels: pdfPages,
          operation: 'download_pdf',
          outcome: 'failure',
          snapshot,
          outputPagesCount: 0,
          failureStage: getFailureStage(error, failureStage),
          error,
        }),
        error
      );
    }
  };

  return {
    selectedFiles,
    pdfPages,
    fileInputRef,
    isLoading,
    handleFileChange,
    handleFileDownload,
    handleFilePrinting,
    clearPdfPages,
  };
}
