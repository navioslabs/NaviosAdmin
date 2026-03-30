import { supabase } from "@/lib/supabase";

export interface AppSettings {
  id: string;
  app_name: string;
  support_email: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  terms_url: string;
  privacy_url: string;
  min_app_version: string;
  updated_at: string;
}

const DEFAULTS: Omit<AppSettings, "id" | "updated_at"> = {
  app_name: "Navios",
  support_email: "support@navioslabs.com",
  maintenance_mode: false,
  maintenance_message: "メンテナンス中です。しばらくお待ちください。",
  terms_url: "https://navioslabs.com/terms",
  privacy_url: "https://navioslabs.com/privacy",
  min_app_version: "1.0.0",
};

/** アプリ設定を取得 */
export async function fetchAppSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .limit(1)
    .single();

  if (error) {
    // テーブルがない or レコードがない場合はデフォルト値を返す
    return {
      id: "default",
      ...DEFAULTS,
      updated_at: new Date().toISOString(),
    };
  }
  return data as AppSettings;
}

/** アプリ設定を更新（upsert） */
export async function updateAppSettings(
  settings: Partial<Omit<AppSettings, "id" | "updated_at">>,
): Promise<void> {
  const { error } = await supabase
    .from("app_settings")
    .upsert({
      id: "default",
      ...settings,
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
}
