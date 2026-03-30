import { useState, useCallback, useRef, type ChangeEvent } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { parseCsv, readFileAsText, validateRows } from "@/lib/csv-parse";
import { downloadCsv } from "@/lib/csv";
import {
  bulkImportUsers,
  bulkImportPosts,
  bulkImportAnnouncements,
  bulkImportBadges,
  bulkImportAdmins,
  type BulkResult,
} from "@/lib/services/bulk-import";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  Users,
  FileText,
  Megaphone,
  Award,
  Shield,
  Download,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  FileUp,
} from "lucide-react";

// ─── タブ定義 ────────────────────────────────────────

type TabId = "users" | "posts" | "announcements" | "badges" | "admins";

interface TabDef {
  id: TabId;
  label: string;
  icon: typeof Users;
  requiredFields: string[];
  csvTemplate: Record<string, string>[];
  description: string;
}

const TABS: TabDef[] = [
  {
    id: "users",
    label: "ユーザー",
    icon: Users,
    requiredFields: ["display_name"],
    csvTemplate: [
      { display_name: "田中太郎", bio: "よろしくお願いします", location_text: "渋谷区" },
      { display_name: "佐藤花子", bio: "", location_text: "新宿区" },
    ],
    description: "display_name（必須）、bio、location_text",
  },
  {
    id: "posts",
    label: "投稿",
    icon: FileText,
    requiredFields: ["title", "category"],
    csvTemplate: [
      { title: "桜が満開です", content: "公園の桜が見頃を迎えています。", category: "event", location_text: "代々木公園" },
      { title: "水道管工事のお知らせ", content: "3月中に工事を実施します。", category: "lifeline", location_text: "渋谷区1丁目" },
    ],
    description: "title（必須）、content、category（必須: lifeline/event/help）、location_text",
  },
  {
    id: "announcements",
    label: "お知らせ",
    icon: Megaphone,
    requiredFields: ["title", "body"],
    csvTemplate: [
      { title: "メンテナンスのお知らせ", body: "3月30日にメンテナンスを実施します。", target: "all", target_area: "" },
      { title: "渋谷区限定イベント", body: "地域交流会を開催します。", target: "area", target_area: "渋谷区" },
    ],
    description: "title（必須）、body（必須）、target（all/area）、target_area",
  },
  {
    id: "badges",
    label: "バッジ",
    icon: Award,
    requiredFields: ["user_id", "badge_type"],
    csvTemplate: [
      { user_id: "ユーザーUUID", badge_type: "resident", area_name: "渋谷区" },
      { user_id: "ユーザーUUID", badge_type: "face", area_name: "新宿区" },
    ],
    description: "user_id（必須）、badge_type（必須: resident/face/legend）、area_name",
  },
  {
    id: "admins",
    label: "管理者",
    icon: Shield,
    requiredFields: ["user_id", "role"],
    csvTemplate: [
      { user_id: "ユーザーUUID", role: "manager" },
      { user_id: "ユーザーUUID", role: "staff" },
    ],
    description: "user_id（必須）、role（必須: admin/manager/staff）",
  },
];

// ─── メインコンポーネント ────────────────────────────

export function BulkImportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>("users");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const tab = TABS.find((t) => t.id === activeTab)!;

  const resetState = () => {
    setRows([]);
    setFileName(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    resetState();
  };

  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setResult(null);

      try {
        const text = await readFileAsText(file);
        const parsed = parseCsv(text);
        if (parsed.length === 0) {
          toast("CSVにデータが含まれていません", "error");
          return;
        }
        setRows(parsed);
        setFileName(file.name);
        toast(`${parsed.length}件のデータを読み込みました`);
      } catch {
        toast("ファイルの読み込みに失敗しました", "error");
      }
    },
    [toast],
  );

  const handleDownloadTemplate = () => {
    downloadCsv(tab.csvTemplate, `${tab.id}_template.csv`);
  };

  const handleImport = useCallback(async () => {
    if (rows.length === 0 || !user) return;

    // バリデーション
    const validation = validateRows(rows, tab.requiredFields);
    if (!validation.valid) {
      const msgs = validation.errors.slice(0, 5).map((e) => `行${e.row}: ${e.message}`);
      toast(msgs.join("\n"), "error");
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      let res: BulkResult;

      switch (activeTab) {
        case "users":
          res = await bulkImportUsers(rows as never);
          break;
        case "posts":
          res = await bulkImportPosts(rows as never, user.id);
          break;
        case "announcements":
          res = await bulkImportAnnouncements(rows as never, user.id);
          break;
        case "badges":
          res = await bulkImportBadges(rows as never);
          break;
        case "admins":
          res = await bulkImportAdmins(rows as never);
          break;
        default:
          return;
      }

      setResult(res);
      if (res.success > 0) {
        toast(`${res.success}件の登録に成功しました`);
      }
      if (res.failed > 0) {
        toast(`${res.failed}件が失敗しました`, "warning");
      }
    } catch {
      toast("インポート中にエラーが発生しました", "error");
    } finally {
      setImporting(false);
    }
  }, [rows, user, activeTab, tab.requiredFields, toast]);

  const previewHeaders = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">一括登録</h1>
        <p className="text-sm text-muted-foreground mt-1">
          CSVファイルからデータを一括登録
        </p>
      </div>

      {/* タブ */}
      <div className="flex gap-1 rounded-lg border p-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === t.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <t.icon className="size-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* アップロードエリア */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="size-4 text-primary" />
              <CardTitle>{tab.label}の一括登録</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="mr-1 size-3.5" />
              テンプレートCSV
            </Button>
          </div>
          <CardDescription>
            カラム: {tab.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ドロップゾーン */}
          <div
            onClick={() => fileRef.current?.click()}
            className="relative cursor-pointer rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 transition-colors p-8 text-center"
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileUp className="mx-auto size-8 text-muted-foreground/50 mb-3" />
            {fileName ? (
              <div className="flex items-center justify-center gap-2">
                <Badge variant="secondary">{fileName}</Badge>
                <span className="text-sm text-muted-foreground">
                  {rows.length}件
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetState();
                  }}
                  className="rounded-md p-0.5 hover:bg-muted"
                >
                  <X className="size-3.5 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-muted-foreground">
                  CSVファイルをクリックして選択
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  UTF-8 エンコード推奨
                </p>
              </>
            )}
          </div>

          {/* プレビュー */}
          {rows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">
                  プレビュー（先頭{Math.min(rows.length, 10)}件 / 全{rows.length}件）
                </h3>
                {/* 必須フィールドチェック */}
                <div className="flex gap-1.5">
                  {tab.requiredFields.map((f) => {
                    const exists = previewHeaders.includes(f);
                    return (
                      <Badge
                        key={f}
                        variant="outline"
                        className={`text-[11px] ${
                          exists
                            ? "border-green-500/50 text-green-600 dark:text-green-400"
                            : "border-red-500/50 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {exists ? "✓" : "✗"} {f}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      {previewHeaders.map((h) => (
                        <TableHead key={h}>
                          <span
                            className={
                              tab.requiredFields.includes(h)
                                ? "font-semibold text-foreground"
                                : ""
                            }
                          >
                            {h}
                            {tab.requiredFields.includes(h) && (
                              <span className="text-destructive ml-0.5">*</span>
                            )}
                          </span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 10).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground text-xs">
                          {i + 1}
                        </TableCell>
                        {previewHeaders.map((h) => (
                          <TableCell
                            key={h}
                            className={`text-sm max-w-48 truncate ${
                              tab.requiredFields.includes(h) && !row[h]?.trim()
                                ? "bg-red-500/5 text-red-500"
                                : ""
                            }`}
                          >
                            {row[h] || (
                              <span className="text-muted-foreground/50 italic">
                                空
                              </span>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {rows.length > 10 && (
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  他 {rows.length - 10} 件...
                </p>
              )}
            </div>
          )}

          {/* 実行結果 */}
          {result && (
            <div
              className={`rounded-lg p-4 ${
                result.failed === 0
                  ? "bg-green-500/10 ring-1 ring-green-500/20"
                  : "bg-amber-500/10 ring-1 ring-amber-500/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {result.failed === 0 ? (
                  <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
                )}
                <span className="text-sm font-semibold">インポート完了</span>
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-green-600 dark:text-green-400">
                  成功: {result.success}件
                </span>
                {result.failed > 0 && (
                  <span className="text-red-600 dark:text-red-400">
                    失敗: {result.failed}件
                  </span>
                )}
              </div>
              {result.errors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {result.errors.slice(0, 5).map((err, i) => (
                    <p key={i} className="text-xs text-red-600 dark:text-red-400">
                      {err}
                    </p>
                  ))}
                  {result.errors.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      他 {result.errors.length - 5} 件のエラー...
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 実行ボタン */}
          <div className="flex items-center justify-end gap-2 pt-2">
            {rows.length > 0 && (
              <Button variant="outline" onClick={resetState}>
                クリア
              </Button>
            )}
            <Button
              onClick={handleImport}
              disabled={rows.length === 0 || importing}
            >
              {importing ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  インポート中...
                </>
              ) : (
                <>
                  <Upload className="mr-1.5 size-4" />
                  {rows.length}件をインポート
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
