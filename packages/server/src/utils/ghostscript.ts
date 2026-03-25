import { spawn } from 'child_process';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { createLogger } from './logger.js';

const log = createLogger('ghostscript');

/**
 * Ghostscript processing options.
 * When pruneInvisible is enabled, we use ghostscript to optimize PDF:
 * - Compress content
 * - Optimize for viewing
 * - Remove redundant objects
 */
export interface GhostscriptOptions {
  /**
   * Quality level: 'screen' (low) | 'ebook' (medium) | 'printer' (high) | 'prepress' (highest).
   * Default: 'ebook' for good balance of size and quality.
   */
  quality?: 'screen' | 'ebook' | 'printer' | 'prepress';
}

/**
 * Process PDF through Ghostscript using stdio pipes.
 * This is memory-efficient as it streams data through stdio rather than
 * creating temporary files.
 *
 * @param pdfBuffer - The input PDF as a Buffer
 * @param options - Processing options (quality level, etc.)
 * @returns Promise<Buffer> - The processed PDF
 * @throws Error if ghostscript is unavailable or processing fails
 */
export async function processPdfWithGhostscript(
  pdfBuffer: Buffer,
  options: GhostscriptOptions = {},
): Promise<Buffer> {
  const { quality = 'ebook' } = options;

  const gsArgs = [
    '-q', // Quiet mode
    '-dNOPAUSE', // Don't prompt for user input
    '-dBATCH', // Exit after processing
    '-dSAFER', // Safer mode (block file operations)
    '-dUseCropBox', // Use CropBox if available
    `-dPDFSETTINGS=/${quality}`, // Quality preset
    '-sDEVICE=pdfwrite', // Output device
    '-dDetectDuplicateImages', // Remove duplicate images
    '-dCompressFonts=true', // Compress fonts
    '-r150', // Resolution 150 DPI
    '-o', // Output file
    '-', // Write to stdout
    '-', // Read from stdin
  ];

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let outputBuffer = Buffer.alloc(0);
    let errorOutput = '';
    let settled = false;

    const safeReject = (err: Error) => {
      if (settled) return;
      settled = true;
      reject(err);
    };

    const safeResolve = (buffer: Buffer) => {
      if (settled) return;
      settled = true;
      resolve(buffer);
    };

    const gs = spawn('gs', gsArgs, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    gs.stdout.on('data', (chunk: Buffer) => {
      outputBuffer = Buffer.concat([outputBuffer, chunk]);
    });

    gs.stderr.on('data', (chunk: Buffer) => {
      errorOutput += chunk.toString();
    });

    gs.on('error', (err: Error) => {
      log.error(
        { err, stderr: errorOutput },
        'Ghostscript process error',
      );
      safeReject(new Error(`Ghostscript unavailable: ${err.message}`));
    });

    gs.stdin.on('error', (err: NodeJS.ErrnoException) => {
      // qpdf/gs may terminate early on invalid input/args; avoid unhandled EPIPE.
      if (err.code === 'EPIPE') {
        log.warn({ err, stderr: errorOutput }, 'Ghostscript stdin closed early (EPIPE)');
        return;
      }
      log.error({ err, stderr: errorOutput }, 'Ghostscript stdin error');
      safeReject(new Error(`Ghostscript stdin error: ${err.message}`));
    });

    gs.on('close', (code: number) => {
      const durationMs = Date.now() - startTime;

      if (code !== 0) {
        log.error(
          { code, stderr: errorOutput, durationMs },
          'Ghostscript processing failed',
        );
        safeReject(
          new Error(
            `Ghostscript failed with code ${code}: ${errorOutput}`,
          ),
        );
        return;
      }

      if (outputBuffer.length === 0) {
        log.error(
          { code, stderr: errorOutput, durationMs },
          'Ghostscript produced empty output',
        );
        safeReject(new Error('Ghostscript produced empty output'));
        return;
      }

      const inputSize = pdfBuffer.length;
      const outputSize = outputBuffer.length;
      const ratio = ((1 - outputSize / inputSize) * 100).toFixed(1);

      log.info(
        {
          inputBytes: inputSize,
          outputBytes: outputSize,
          compressionRatio: ratio + '%',
          quality,
          durationMs,
        },
        'PDF processed successfully',
      );

      safeResolve(outputBuffer);
    });

    // Write PDF to stdin and close
    gs.stdin.end(pdfBuffer);
  });
}

/**
 * Process PDF through qpdf using stdio pipes.
 * Equivalent to: qpdf --linearize --optimize-images input.pdf output_qpdf.pdf
 * but avoids temporary files by streaming through stdin/stdout.
 *
 * @param pdfBuffer - The input PDF as a Buffer
 * @returns Promise<Buffer> - The processed PDF
 * @throws Error if qpdf is unavailable or processing fails
 */
export async function processPdfWithQpdf(
  pdfBuffer: Buffer,
): Promise<Buffer> {
  // qpdf does not support reading PDF input from stdin.
  // Keep output streamed to stdout and only materialize a temporary input file.
  const tempDir = await mkdtemp(join(tmpdir(), 'crisprender-qpdf-'));
  const inputPath = join(tempDir, 'input.pdf');
  await writeFile(inputPath, pdfBuffer);

  const qpdfArgs = [
    inputPath,
    '--linearize',
    '--optimize-images',
    '-',
  ];

  try {
    return await new Promise((resolve, reject) => {
      const startTime = Date.now();
      let outputBuffer = Buffer.alloc(0);
      let errorOutput = '';
      let settled = false;

      const safeReject = (err: Error) => {
        if (settled) return;
        settled = true;
        reject(err);
      };

      const safeResolve = (buffer: Buffer) => {
        if (settled) return;
        settled = true;
        resolve(buffer);
      };

      const qpdf = spawn('qpdf', qpdfArgs, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      qpdf.stdout.on('data', (chunk: Buffer) => {
        outputBuffer = Buffer.concat([outputBuffer, chunk]);
      });

      qpdf.stderr.on('data', (chunk: Buffer) => {
        errorOutput += chunk.toString();
      });

      qpdf.on('error', (err: Error) => {
        log.error(
          { err, stderr: errorOutput },
          'qpdf process error',
        );
        safeReject(new Error(`qpdf unavailable: ${err.message}`));
      });

      qpdf.stdin.on('error', (err: NodeJS.ErrnoException) => {
        // stdin is unused by qpdf in this mode, but handle defensively.
        if (err.code === 'EPIPE') {
          log.warn({ err, stderr: errorOutput }, 'qpdf stdin closed early (EPIPE)');
          return;
        }
        log.error({ err, stderr: errorOutput }, 'qpdf stdin error');
        safeReject(new Error(`qpdf stdin error: ${err.message}`));
      });

      qpdf.on('close', (code: number) => {
        const durationMs = Date.now() - startTime;

        if (code !== 0) {
          log.error(
            { code, stderr: errorOutput, durationMs },
            'qpdf processing failed',
          );
          safeReject(
            new Error(
              `qpdf failed with code ${code}: ${errorOutput}`,
            ),
          );
          return;
        }

        if (outputBuffer.length === 0) {
          log.error(
            { code, stderr: errorOutput, durationMs },
            'qpdf produced empty output',
          );
          safeReject(new Error('qpdf produced empty output'));
          return;
        }

        const inputSize = pdfBuffer.length;
        const outputSize = outputBuffer.length;
        const ratio = ((1 - outputSize / inputSize) * 100).toFixed(1);

        log.info(
          {
            inputBytes: inputSize,
            outputBytes: outputSize,
            compressionRatio: ratio + '%',
            durationMs,
          },
          'PDF processed successfully with qpdf',
        );

        safeResolve(outputBuffer);
      });

      // No stdin input for qpdf: close immediately.
      qpdf.stdin.end();
    });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
