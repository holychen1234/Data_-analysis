import * as XLSX from "xlsx";

export interface ParsedData {
  headers: string[];
  rows: Record<string, unknown>[];
  summary: {
    totalRows: number;
    totalColumns: number;
    columnTypes: Record<string, string>;
  };
}

/**
 * Try reading the file as UTF-8 text first.
 * If the result contains replacement characters (meaning it's likely GBK/GB2312),
 * fall back to reading with the "gbk" TextDecoder.
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      // Check if UTF-8 decoding produced garbled output (replacement char U+FFFD)
      if (text.includes("\uFFFD")) {
        // Re-read as GBK
        const binaryReader = new FileReader();
        binaryReader.onload = () => {
          try {
            const decoder = new TextDecoder("gbk");
            const decoded = decoder.decode(binaryReader.result as ArrayBuffer);
            resolve(decoded);
          } catch {
            // If GBK decoding also fails, return original UTF-8 text
            resolve(text);
          }
        };
        binaryReader.onerror = () => reject(new Error("Failed to read file."));
        binaryReader.readAsArrayBuffer(file);
      } else {
        resolve(text);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file, "utf-8");
  });
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsArrayBuffer(file);
  });
}

function processWorkbook(workbook: XLSX.WorkBook): ParsedData {
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    raw: false,
    defval: "",
  });
  const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

  // Detect column types from raw data
  const rawJsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
  const columnTypes: Record<string, string> = {};
  for (const header of headers) {
    const sampleValues = rawJsonData
      .slice(0, 20)
      .map((row) => row[header])
      .filter((v) => v !== null && v !== undefined && v !== "");

    if (sampleValues.length === 0) {
      columnTypes[header] = "empty";
    } else if (sampleValues.every((v) => typeof v === "number")) {
      columnTypes[header] = "number";
    } else if (
      sampleValues.every(
        (v) => typeof v === "string" && !isNaN(Date.parse(v as string))
      )
    ) {
      columnTypes[header] = "date";
    } else {
      columnTypes[header] = "string";
    }
  }

  return {
    headers,
    rows: jsonData,
    summary: {
      totalRows: jsonData.length,
      totalColumns: headers.length,
      columnTypes,
    },
  };
}

export async function parseFile(file: File): Promise<ParsedData> {
  const ext = getFileExtension(file.name);

  try {
    if (ext === "csv") {
      // For CSV: read as text with proper encoding detection
      const text = await readFileAsText(file);
      const workbook = XLSX.read(text, { type: "string" });
      return processWorkbook(workbook);
    } else {
      // For Excel files: read as binary
      const buffer = await readFileAsArrayBuffer(file);
      const data = new Uint8Array(buffer);
      const workbook = XLSX.read(data, { type: "array" });
      return processWorkbook(workbook);
    }
  } catch {
    throw new Error("Failed to parse file. Please ensure it is a valid CSV or Excel file.");
  }
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export function isValidFileType(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["csv", "xlsx", "xls"].includes(ext);
}
