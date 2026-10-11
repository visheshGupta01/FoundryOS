import type { PDFGenerationOptions } from "./document.contracts.js";

function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapLine(text: string, maxChars: number = 75): string[] {
  if (text.length <= maxChars) return [text];
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + (currentLine ? " " : "") + word).length > maxChars) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine += (currentLine ? " " : "") + word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export function generatePdfBuffer(options: PDFGenerationOptions): Buffer {
  const { title, subtitle, author = "FoundryOS AI", content, sections } = options;

  const rawLines: string[] = [];
  rawLines.push(`=== ${title.toUpperCase()} ===`);
  if (subtitle) rawLines.push(`Subtitle: ${subtitle}`);
  rawLines.push(`Author: ${author} | Generated: ${new Date().toISOString().split("T")[0]}`);
  rawLines.push("------------------------------------------------------------------");
  rawLines.push("");

  if (content) {
    const cleanContent = content.replace(/\r\n/g, "\n");
    for (const paragraph of cleanContent.split("\n\n")) {
      const trimmed = paragraph.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith("#")) {
        const headingText = trimmed.replace(/^#+\s*/, "");
        rawLines.push("");
        rawLines.push(`SECTION: ${headingText.toUpperCase()}`);
        rawLines.push("..................................................................");
      } else {
        const wrapped = wrapLine(trimmed, 80);
        rawLines.push(...wrapped);
        rawLines.push("");
      }
    }
  }

  if (sections && sections.length > 0) {
    for (const sec of sections) {
      rawLines.push("");
      rawLines.push(`--- ${sec.heading.toUpperCase()} ---`);
      const wrapped = wrapLine(sec.body, 80);
      rawLines.push(...wrapped);
      if (sec.bullets && sec.bullets.length > 0) {
        for (const bullet of sec.bullets) {
          const wrappedBullet = wrapLine(`• ${bullet}`, 78);
          rawLines.push(...wrappedBullet);
        }
      }
      rawLines.push("");
    }
  }

  const lineHeight = 14;
  const startY = 740;
  const maxY = 50;

  const pages: string[][] = [[]];
  let currentPage = 0;
  let currentY = startY;

  for (const line of rawLines) {
    if (currentY < maxY) {
      pages.push([]);
      currentPage++;
      currentY = startY;
    }
    const page = pages[currentPage];
    if (page) {
      page.push(line);
    }
    currentY -= lineHeight;
  }

  const pdfObjects: string[] = [];
  const pageObjNums: number[] = [];
  const contentObjNums: number[] = [];

  for (let i = 0; i < pages.length; i++) {
    const pageLines = pages[i] || [];
    let streamText = "BT /F1 10 Tf 40 750 Td 14 TL\n";

    for (const line of pageLines) {
      if (line.startsWith("===")) {
        streamText += `/F2 16 Tf (${escapePdfText(line)}) Tj T* /F1 10 Tf\n`;
      } else if (line.startsWith("SECTION:") || line.startsWith("---")) {
        streamText += `/F2 12 Tf (${escapePdfText(line)}) Tj T* /F1 10 Tf\n`;
      } else {
        streamText += `(${escapePdfText(line)}) Tj T*\n`;
      }
    }
    streamText += "ET";

    const contentObj = `${pdfObjects.length + 3} 0 obj\n<< /Length ${Buffer.byteLength(streamText)} >>\nstream\n${streamText}\nendstream\nendobj`;
    contentObjNums.push(pdfObjects.length + 3);
    pdfObjects.push(contentObj);

    const pageObj = `${pdfObjects.length + 3} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObjNums[i]} 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> >>\nendobj`;
    pageObjNums.push(pdfObjects.length + 3);
    pdfObjects.push(pageObj);
  }

  const catalogObj = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`;
  const pagesKidsStr = pageObjNums.map((n) => `${n} 0 R`).join(" ");
  const pagesObj = `2 0 obj\n<< /Type /Pages /Kids [${pagesKidsStr}] /Count ${pageObjNums.length} >>\nendobj`;

  const allObjects = [catalogObj, pagesObj, ...pdfObjects];

  let pdfOutput = `%PDF-1.4\n`;
  const offsets: number[] = [0];

  for (const obj of allObjects) {
    offsets.push(Buffer.byteLength(pdfOutput));
    pdfOutput += `${obj}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdfOutput);
  pdfOutput += `xref\n0 ${allObjects.length + 1}\n0000000000 65535 f \n`;

  for (let i = 1; i <= allObjects.length; i++) {
    const offsetStr = String(offsets[i]).padStart(10, "0");
    pdfOutput += `${offsetStr} 00000 n \n`;
  }

  pdfOutput += `trailer\n<< /Size ${allObjects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdfOutput, "utf-8");
}
