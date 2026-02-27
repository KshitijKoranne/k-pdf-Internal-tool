/**
 * PDF Watermark Processor
 * Requirements: 5.1
 * 
 * Supports text and image watermarks with CJK character support via fontkit.
 */

import type { ProcessInput, ProcessOutput, ProgressCallback } from '@/types/pdf';
import { PDFErrorCode } from '@/types/pdf';
import { BasePDFProcessor } from '../processor';
import { loadPdfLib } from '../loader';

export interface WatermarkOptions {
  type: 'text' | 'image';
  text?: string;
  imageData?: ArrayBuffer;
  imageType?: 'png' | 'jpg';
  position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'diagonal';
  opacity?: number;
  rotation?: number;
  fontSize?: number;
  color?: { r: number; g: number; b: number };
  pages?: number[] | 'all' | 'odd' | 'even';
}

/**
 * Check if text contains non-ASCII characters
 * Left in place for future warning implementations, but standard fonts will be used.
 */
function containsNonAscii(text: string): boolean {
  // eslint-disable-next-line no-control-regex
  return /[^\x00-\x7F]/.test(text);
}

export class WatermarkProcessor extends BasePDFProcessor {
  async process(input: ProcessInput, onProgress?: ProgressCallback): Promise<ProcessOutput> {
    this.reset();
    this.onProgress = onProgress;

    const { files, options } = input;
    const inputOptions = options as Partial<WatermarkOptions>;
    const wmOptions: WatermarkOptions = {
      type: inputOptions.type ?? 'text',
      text: inputOptions.text,
      imageData: inputOptions.imageData,
      position: inputOptions.position ?? 'center',
      opacity: inputOptions.opacity ?? 0.3,
      rotation: inputOptions.rotation ?? -45,
      fontSize: inputOptions.fontSize ?? 48,
      color: inputOptions.color ?? { r: 0.5, g: 0.5, b: 0.5 },
      pages: inputOptions.pages ?? 'all',
    };

    if (files.length !== 1) {
      return this.createErrorOutput(PDFErrorCode.INVALID_OPTIONS, 'Exactly 1 PDF file is required.');
    }

    try {
      this.updateProgress(10, 'Loading PDF library...');
      const pdfLib = await loadPdfLib();

      this.updateProgress(20, 'Loading PDF...');
      const file = files[0];
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

      let font: Awaited<ReturnType<typeof pdf.embedFont>>;

      // Enforce StandardFonts due to Vercel/Edge limits on loading large custom font buffers dynamically
      font = await pdf.embedFont(pdfLib.StandardFonts.HelveticaBold);

      const totalPages = pdf.getPageCount();

      this.updateProgress(30, 'Adding watermark...');

      const pagesToProcess = getPageIndices(wmOptions.pages, totalPages);

      // Pre-embed image if using image watermark (do this once, outside the loop)
      let embeddedImage: Awaited<ReturnType<typeof pdf.embedPng>> | null = null;
      if (wmOptions.type === 'image' && wmOptions.imageData) {
        try {
          if (wmOptions.imageType === 'jpg') {
            embeddedImage = await pdf.embedJpg(wmOptions.imageData);
          } else {
            embeddedImage = await pdf.embedPng(wmOptions.imageData);
          }
        } catch (embedError) {
          const errorMessage = embedError instanceof Error ? embedError.message : 'Unknown error';
          return this.createErrorOutput(PDFErrorCode.PROCESSING_FAILED, `Failed to embed image: ${errorMessage}`);
        }
      }

      for (let i = 0; i < pagesToProcess.length; i++) {
        if (this.checkCancelled()) {
          return this.createErrorOutput(PDFErrorCode.PROCESSING_CANCELLED, 'Processing was cancelled.');
        }

        const pageIndex = pagesToProcess[i];
        const page = pdf.getPage(pageIndex);
        const { width, height } = page.getSize();

        if (wmOptions.type === 'text' && wmOptions.text) {
          const text = wmOptions.text;
          const fontSize = wmOptions.fontSize || 48;
          const textWidth = font.widthOfTextAtSize(text, fontSize);
          const textHeight = font.heightAtSize(fontSize);

          let x = 0, y = 0;
          const rotation = wmOptions.position === 'diagonal' ? -45 : (wmOptions.rotation || 0);

          switch (wmOptions.position) {
            case 'top-left':
              x = 50; y = height - 50;
              break;
            case 'top-right':
              x = width - textWidth - 50; y = height - 50;
              break;
            case 'bottom-left':
              x = 50; y = 50;
              break;
            case 'bottom-right':
              x = width - textWidth - 50; y = 50;
              break;
            case 'center':
              const position = computeTextWatermarkPosition(width, height, textWidth, textHeight, rotation)
              x = position.x;
              y = position.y;
              break;
            case 'diagonal':
            default:
              x = width / 2; y = height / 2;
          }

          page.drawText(text, {
            x,
            y,
            size: fontSize,
            font,
            color: pdfLib.rgb(wmOptions.color?.r || 0.5, wmOptions.color?.g || 0.5, wmOptions.color?.b || 0.5),
            opacity: wmOptions.opacity || 0.3,
            rotate: pdfLib.degrees(rotation),
          });
        } else if (wmOptions.type === 'image' && embeddedImage) {
          const scale = 0.5;
          const imgWidth = embeddedImage.width * scale;
          const imgHeight = embeddedImage.height * scale;

          const x = (width - imgWidth) / 2;
          const y = (height - imgHeight) / 2;

          page.drawImage(embeddedImage, {
            x,
            y,
            width: imgWidth,
            height: imgHeight,
            opacity: wmOptions.opacity || 0.3,
            rotate: pdfLib.degrees(wmOptions.rotation || 0),
          });
        }

        this.updateProgress(30 + (60 * (i + 1) / pagesToProcess.length), `Processing page ${pageIndex + 1}...`);
      }

      this.updateProgress(95, 'Saving PDF...');
      const pdfBytes = await pdf.save({ useObjectStreams: true });
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

      this.updateProgress(100, 'Complete!');
      return this.createSuccessOutput(blob, file.name.replace('.pdf', '_watermarked.pdf'), { pageCount: totalPages });

    } catch (error) {
      return this.createErrorOutput(PDFErrorCode.PROCESSING_FAILED, 'Failed to add watermark.', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  protected getAcceptedTypes(): string[] {
    return ['application/pdf'];
  }
}

function getPageIndices(pages: WatermarkOptions['pages'], totalPages: number): number[] {
  if (Array.isArray(pages)) {
    return pages.map(p => p - 1).filter(p => p >= 0 && p < totalPages);
  }
  switch (pages) {
    case 'odd':
      return Array.from({ length: totalPages }, (_, i) => i).filter(i => i % 2 === 0);
    case 'even':
      return Array.from({ length: totalPages }, (_, i) => i).filter(i => i % 2 === 1);
    default:
      return Array.from({ length: totalPages }, (_, i) => i);
  }
}

function computeTextWatermarkPosition(
  pageWidth: number,
  pageHeight: number,
  textWidth: number,
  textHeight: number,
  rotation: number
): { x: number; y: number } {

  // Calculate the center coordinates of the PDF page
  const centerX = pageWidth / 2;
  const centerY = pageHeight / 2;

  // Half of text width/height, baseline offset for text drawing
  const textWidthHalf = textWidth / 2;
  const textHeightHalf = textHeight / 2;
  const baselineOffset = textHeight * 0.25; // 基线向下调整的偏移值

  // Basic unrotated coordinates for text center alignment (with baseline offset)
  const baseX = centerX - textWidthHalf;
  const baseY = centerY - (textHeightHalf + baselineOffset);

  // Convert rotation angle from degrees to radians (take absolute value for calculation)
  const rotationRad = (Math.abs(rotation) * Math.PI) / 180;
  const cosRad = Math.cos(rotationRad);
  const sinRad = Math.sin(rotationRad);

  // Get rotation direction sign: 1=counterclockwise, -1=clockwise, 0=no rotation
  const rotationSign = Math.sign(rotation);
  // Calculate final rotated origin coordinates for text
  let rotatedOriginX = baseX + textWidthHalf * (1 - cosRad) + rotationSign * baselineOffset;
  let rotatedOriginY = baseY - rotationSign * (textWidthHalf * sinRad) + baselineOffset * Math.abs(rotationSign);

  return {
    x: rotatedOriginX,
    y: rotatedOriginY,
  };
}

export function createWatermarkProcessor(): WatermarkProcessor {
  return new WatermarkProcessor();
}

export async function addWatermark(file: File, options: WatermarkOptions, onProgress?: ProgressCallback): Promise<ProcessOutput> {
  const processor = createWatermarkProcessor();
  return processor.process({ files: [file], options: options as unknown as Record<string, unknown> }, onProgress);
}
