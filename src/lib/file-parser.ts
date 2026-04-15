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

export function parseFile(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
        const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

        // Detect column types
        const columnTypes: Record<string, string> = {};
        for (const header of headers) {
          const sampleValues = jsonData
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

        resolve({
          headers,
          rows: jsonData,
          summary: {
            totalRows: jsonData.length,
            totalColumns: headers.length,
            columnTypes,
          },
        });
      } catch (err) {
        reject(new Error("Failed to parse file. Please ensure it is a valid CSV or Excel file."));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsArrayBuffer(file);
  });
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export function isValidFileType(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ["csv", "xlsx", "xls"].includes(ext);
}
