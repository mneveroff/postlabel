import { useState, useRef } from 'react';
import fileSaver from 'file-saver';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import { jsPDF } from 'jspdf';

import { Label, SegmentInformation, LabelType } from '@/models/Label';
import type { InformedCanvas } from '@/models/Label';
import { captureProductEvent, type LabelProcessingProperties } from '@/utils/analytics';

const { saveAs } = fileSaver;

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

const outputHorizontalMargin = 20;
const outputVerticalMargin = outputHorizontalMargin * 1.75;
const outputLabelWidth = 270.5;
const outputLabelHeight = 383.5;
const outputFormat = 'image/jpeg';
const outputQuality = 0.8;

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

function countLabelTypes(labels: InformedCanvas[]) {
  return {
    rm_count: labels.filter(
      (page) => page.labelType === LabelType.RM || page.labelType === LabelType.RMMobile
    ).length,
    rm_international_count: labels.filter(
      (page) =>
        page.labelType === LabelType.RMInternational ||
        page.labelType === LabelType.RMInternationalMobile
    ).length,
    ebay_count: labels.filter((page) => page.labelType === LabelType.Ebay).length,
    parcel_force_count: labels.filter((page) => page.labelType === LabelType.ParcelForce).length,
  };
}

function buildProcessingProperties(
  labels: InformedCanvas[],
  filesCount: number,
  pagesCount: number,
  payloadSizeBytes: number,
  durationMs: number,
  outcome: 'success' | 'failure'
): LabelProcessingProperties {
  return {
    files_count: filesCount,
    pages_count: pagesCount,
    labels_count: labels.length,
    payload_size_bytes: payloadSizeBytes,
    duration_ms: durationMs,
    outcome,
    ...countLabelTypes(labels),
  };
}

export function usePDFHandler() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [pdfPages, setPdfPages] = useState<InformedCanvas[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearPdfPages = () => {
    setPdfPages([]);
    setSelectedFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);
    const startedAt = performance.now();
    const files = e.target.files ? Array.from(e.target.files) : [];

    const nonPdfFiles = files.filter((file) => file.type !== 'application/pdf');
    if (nonPdfFiles.length > 0) {
      alert('Some files were not uploaded because they are not PDFs.');
      setIsLoading(false);
      return;
    }

    if (files.length > 100) {
      alert('You cannot upload more than 100 files at once.');
      setIsLoading(false);
      return;
    }

    const largeFiles = files.filter((file) => file.size > 1000000);
    if (largeFiles.length > 0) {
      alert('Some files were not uploaded because they exceed the 1MB size limit.');
      setIsLoading(false);
      return;
    }

    const totalSize = files.reduce((total, file) => total + file.size, 0);
    if (totalSize > 5000000) {
      alert('The total size of all files exceeds the 5MB limit.');
      setIsLoading(false);
      return;
    }

    const validFiles = files.filter(
      (file) => file.type === 'application/pdf' && file.size <= 1000000
    );

    const payloadSize = validFiles.reduce((total, file) => total + file.size, 0);

    if (validFiles.length === 0) {
      clearPdfPages();
      setIsLoading(false);
      alert('There were no valid files selected.');
      return;
    }

    setSelectedFiles(validFiles as unknown as FileList);

    try {
      await handleFileProcessing(validFiles as unknown as FileList, payloadSize, startedAt);
    } catch {
      captureProductEvent('label_processing_failed', {
        files_count: validFiles.length,
        pages_count: 0,
        labels_count: 0,
        payload_size_bytes: payloadSize,
        rm_count: 0,
        rm_international_count: 0,
        ebay_count: 0,
        parcel_force_count: 0,
        duration_ms: Math.round(performance.now() - startedAt),
        outcome: 'failure',
      });
      setIsLoading(false);
    }
  };

  const handleFileProcessing = async (
    passedFiles: FileList,
    payloadSize: number,
    startedAt: number
  ) => {
    let allPages = 0;

    const validFiles = Array.from(passedFiles || []).filter(
      (file) => file.type === 'application/pdf' && file.size <= 1000000
    );

    const allLabels = await Promise.all(
      Array.from(passedFiles || []).map(async (file: File) => {
        const fileReader = new FileReader();
        const labels: InformedCanvas[] = [];

        fileReader.readAsArrayBuffer(file);
        const result = await new Promise<ArrayBuffer>((resolve) => {
          fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
        });

        const pdf = await getDocument({ data: new Uint8Array(result) }).promise;
        const numPages = pdf.numPages;
        allPages += numPages;

        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();

          const label = new Label({ content });
          const newPages = await label.getPages(document, page);

          for (const newPage of newPages.pages) {
            labels.push(newPage);
          }
        }

        return labels;
      })
    );

    const flatLabels = allLabels.flat();

    captureProductEvent(
      'label_processing_completed',
      buildProcessingProperties(
        flatLabels,
        validFiles.length,
        allPages,
        payloadSize,
        Math.round(performance.now() - startedAt),
        'success'
      )
    );

    setPdfPages(flatLabels);
    setIsLoading(false);
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
    const startedAt = performance.now();
    const { blob, pagesCount } = await preparePDF(pdfPages, hasMargin);

    captureProductEvent(
      'label_pdf_printed',
      buildProcessingProperties(
        pdfPages,
        1,
        pagesCount,
        blob.size,
        Math.round(performance.now() - startedAt),
        'success'
      )
    );

    const blobURL = URL.createObjectURL(blob);

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    iframe.src = blobURL;

    iframe.onload = function () {
      setTimeout(function () {
        iframe.contentWindow?.print();
      }, 1);
    };
  };

  const handleFileDownload = async (hasMargin: boolean) => {
    const startedAt = performance.now();
    const { blob, pagesCount } = await preparePDF(pdfPages, hasMargin);

    captureProductEvent(
      'label_pdf_downloaded',
      buildProcessingProperties(
        pdfPages,
        1,
        pagesCount,
        blob.size,
        Math.round(performance.now() - startedAt),
        'success'
      )
    );

    saveAs(blob, `PostLabel - ${getCurrentDateTimeFormatted()}.pdf`);
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
