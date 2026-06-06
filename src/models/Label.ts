import type { PDFPageProxy, TextContent } from 'pdfjs-dist';

export interface InformedCanvas extends HTMLCanvasElement {
    // Add your custom properties and methods here
    labelType?: string;
}

type LabelCoordinates = { x: number; y: number; width: number; height: number };
export enum LabelType {
    RM = 'RM',
    RMMobile = 'RM Mobile',
    RMInternational = 'RM International',
    RMInternationalMobile = 'RM International Mobile',
    Ebay = 'Ebay',
    ParcelForce = 'ParcelForce',
    Unknown = 'Unknown'
}

// This midnigght BS feels like such BS at this point
export interface LabelData {
    name?: LabelType;
    pdfScale?: number;
    coordinates?: LabelCoordinates;
    content?: TextContent;
}

export class SegmentInformation {
    x: number;
    y: number;
    width: number;
    height: number;

    constructor (x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height
    }
}

export interface CoordinateLabelData {
    imgNum: number;
    bytes: number;
    labelType: string;
}

const LabelCoordinates: { [key in LabelType]: { x: number, y: number, width: number, height: number } } = {
    [LabelType.RM]: { x: -13.5, y: -13.5, width: 270.5, height: 383.5 },
    [LabelType.RMMobile]: { x: -13.5, y: -13.5, width: 270.5, height: 383.5 },
    [LabelType.RMInternational]: { x: -13.5, y: -13.5, width: 270.5, height: 383.5 },
    [LabelType.RMInternationalMobile]: { x: -13.5, y: -13.5, width: 270.5, height: 383.5 },
    [LabelType.Ebay]: { x: -38, y: -42, width: 237, height: 364 },
    [LabelType.ParcelForce]: { x: -50, y: -50, width: 284, height: 420 },
    [LabelType.Unknown]: { x: 0, y: 0, width: 1000, height: 1000 },
  };

export class Label {
    name: LabelType;
    coordinates: LabelCoordinates;
    page?: PDFPageProxy;
    canvas?: InformedCanvas;
    readonly pdfScale: number;
  
    constructor(labelData: LabelData) {
        let combinedText = '';

        if (labelData.content && labelData.content.items) {
            combinedText = labelData.content.items.map(item => {
                if ('str' in item) {
                    return item.str;
                } else {
                    return '';
                }
            }).join(' ').replace(/\s+/g, ' '); // collapsing multiple whitespaces into one
        }

        this.pdfScale = labelData.pdfScale || 4;

        if (combinedText.includes('www.royalmail.com') || combinedText.includes('CUSTOMS DECLARATION')) {
            if (combinedText.includes('Print this label and customs document (if applicable)')) {
                this.name = LabelType.RMInternational;
            } else {
                this.name = LabelType.RMInternationalMobile;
            }
        } else if (combinedText.includes('*** Instructions *** Please attach to parcel.')) {
            this.name = LabelType.ParcelForce;
        } else if (combinedText.includes('Prepaid and printed from') || combinedText.includes('printed from eBay')) {
            this.name = LabelType.Ebay;
        } else if (combinedText.includes('Delivered By Postage Paid GB')) { 
            if (combinedText.includes('Print this label and customs document (if applicable)')) {
                this.name = LabelType.RM;
            } else {
                this.name = LabelType.RMMobile;
            }
        } else {
            this.name = LabelType.Unknown;
        }

        this.name = labelData.name || this.name;
        this.coordinates = LabelCoordinates[this.name];
    }

    async getPages(document: Document, page: PDFPageProxy): Promise<{ pages: InformedCanvas[]}> {
        const pages: InformedCanvas[] = [];

        this.page = page;
        this.canvas = document.createElement('canvas') as InformedCanvas;
        // Create a new viewport with the desired dimensions
        const croppedViewport = this.page.getViewport({ 
            scale: this.pdfScale, 
            dontFlip: false,
            offsetX: this.coordinates.x*this.pdfScale,
            offsetY: this.coordinates.y*this.pdfScale,
        });

        this.canvas.width = this.coordinates.width*this.pdfScale;
        this.canvas.height = this.coordinates.height*this.pdfScale;

        const context = this.canvas.getContext('2d');
        if (context) {
            await this.page.render({ canvasContext: context, viewport: croppedViewport }).promise;
            this.canvas.labelType = this.name;
        }

        pages.push(this.canvas);

        if (this.name === LabelType.RMInternational) {
            // resetting canvas to avoid overwriting work
            this.canvas = document.createElement('canvas') as InformedCanvas;
            const croppedViewport = this.page.getViewport({ 
                scale: this.pdfScale, 
                dontFlip: false,
                offsetX: this.coordinates.x*this.pdfScale*3-this.coordinates.width*this.pdfScale,
                offsetY: this.coordinates.y*this.pdfScale,
            });

            this.canvas.width = this.coordinates.width*this.pdfScale;
            this.canvas.height = this.coordinates.height*this.pdfScale;

            const context = this.canvas.getContext('2d');
            if (context) {
                await this.page.render({ canvasContext: context, viewport: croppedViewport }).promise;
                this.canvas.labelType = this.name;
            }

            pages.push(this.canvas)
        }

        return { pages };
    }
}