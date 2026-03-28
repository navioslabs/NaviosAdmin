import type { ReportReasonId, ReportStatus } from "@/types";

export const REPORT_REASON_LABELS: Record<ReportReasonId, string> = {
  spam: "スパム",
  inappropriate: "不適切なコンテンツ",
  misleading: "誤解を招く情報",
  harassment: "嫌がらせ",
  dangerous: "危険な情報",
  other: "その他",
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  pending: "未対応",
  resolved: "対応済み",
  dismissed: "却下",
};
