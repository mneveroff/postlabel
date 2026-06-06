import { usePDFHandler } from '@/utils/pdf-util';

export default function PrintTool() {
  const {
    pdfPages,
    selectedFiles,
    fileInputRef,
    isLoading,
    handleFileChange,
    handleFileDownload,
    handleFilePrinting,
    clearPdfPages,
  } = usePDFHandler();

  return (
    <section className="text-gray-600 body-font flex flex-col gap-4 flex-grow">
      <div className="container p-4 mx-auto space-y-4">
        <div
          className="flex flex-col xl:w-3/4 w-full bg-orange-100 text-orange-700 mx-auto p-4 rounded text-sm"
          role="alert"
        >
          <strong className="font-bold">Royal Mail Labels Warning</strong>
          <span className="block sm:inline">
            The tool does <strong>not</strong> support newest Royal Mail &quot;Label&quot; exports
            from web version where you can select which corner it goes to.{' '}
            <a className="text-blue-500" href="/about#royal-mail-formats">
              Learn more.
            </a>
          </span>
        </div>
        <div className="flex xl:w-3/4 w-full md:flex-row max-md:flex-col max-md:px-0 mx-auto md:space-x-4 md:space-y-0 space-y-4 items-stretch">
          <div className="flex mx-auto max-md:w-full flex-grow">
            <input
              ref={fileInputRef}
              id="files"
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleFileChange}
              className="w-full bg-gray-100 bg-opacity-50 rounded border border-gray-300 focus:border-blue-500 focus:bg-transparent focus:ring-2 focus:ring-blue-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
            />
            <button
              className={`ml-2 text-gray-700 ${pdfPages.length === 0 || selectedFiles == null || selectedFiles.length === 0 ? 'bg-gray-100' : 'bg-gray-300 hover:bg-gray-200'} focus:outline-none border-0 py-2 px-4 rounded text-lg justify-between items-center`}
              onClick={clearPdfPages}
              disabled={pdfPages.length === 0 || selectedFiles == null || selectedFiles.length === 0}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex flex-row gap-4 justify-center max-md:w-full m-0 p-0">
            <button
              className={`text-gray-700 ${pdfPages.length === 0 ? 'bg-gray-100' : 'bg-gray-300 focus:outline-none hover:bg-gray-200'} border-0 py-2 px-4 rounded text-lg`}
              onClick={() => handleFileDownload(true)}
              disabled={pdfPages.length === 0}
            >
              Download
            </button>
            <button
              className={`text-gray-700 ${pdfPages.length === 0 ? 'bg-gray-100' : 'bg-gray-300 focus:outline-none hover:bg-gray-200'} border-0 py-2 px-4 rounded text-lg`}
              onClick={() => handleFilePrinting(true)}
              disabled={pdfPages.length === 0}
            >
              Print
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-grow w-full mx-auto container p-4 overflow-y-auto items-center">
        {isLoading ? (
          <div className="mx-auto">
            <svg
              className="animate-spin h-32 w-32 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        ) : (
          <div className="grid mx-auto md:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-4">
            {pdfPages.length === 0 ? (
              <div className="flex justify-center items-center flex-col col-span-4">
                <img src="/hero-image.png" alt="Placeholder" className="flex" width={256} height={256} />
                <p className="mx-auto text-base leading-relaxed text-center">
                  Start by uploading some PDFs (drag-n-drop works too). 1MB max each, 5MB and 100
                  files max total.
                  <br />
                  <strong>A4</strong> single-page Royal Mail (both Domestic and International), Ebay
                  and ParcelForce are supported.
                </p>
              </div>
            ) : (
              pdfPages.map((canvas, index) => (
                <div key={index}>
                  <p className="mx-auto text-base leading-relaxed text-center">
                    {canvas.labelType} (L{index + 1})
                  </p>
                  <img
                    src={canvas.toDataURL()}
                    alt={`Label ${index + 1}, Type: ${canvas.labelType}`}
                  />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
}
