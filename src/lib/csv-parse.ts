/** CSVテキストをオブジェクト配列にパース */
export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? "";
    }
    rows.push(row);
  }

  return rows;
}

/** CSVの1行をパース（ダブルクォート対応） */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}

/** ファイルをテキストとして読み込み */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
    reader.readAsText(file, "UTF-8");
  });
}

/** バリデーション結果 */
export interface ValidationResult {
  valid: boolean;
  errors: { row: number; field: string; message: string }[];
}

/** 必須フィールドのバリデーション */
export function validateRows(
  rows: Record<string, string>[],
  requiredFields: string[],
): ValidationResult {
  const errors: ValidationResult["errors"] = [];

  for (let i = 0; i < rows.length; i++) {
    for (const field of requiredFields) {
      if (!rows[i][field]?.trim()) {
        errors.push({
          row: i + 1,
          field,
          message: `${field} は必須です`,
        });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
