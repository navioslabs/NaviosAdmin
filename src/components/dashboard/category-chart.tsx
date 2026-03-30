import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CAT_CONFIG } from "@/constants/categories";
import { LayoutGrid } from "lucide-react";
import type { CategoryId } from "@/types";

interface CategoryData {
  category: string;
  count: number;
}

export function CategoryChart({ data }: { data: CategoryData[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const chartData = data.map((d) => ({
    ...d,
    label: CAT_CONFIG[d.category as CategoryId]?.label ?? d.category,
    color: CAT_CONFIG[d.category as CategoryId]?.color ?? "#888",
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <LayoutGrid className="size-4 text-primary" />
          <CardTitle>カテゴリ別</CardTitle>
        </div>
        <CardDescription>合計 {total.toLocaleString()} 件</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 12 }}
              width={90}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid var(--border)",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                background: "var(--card)",
              }}
            />
            <Bar dataKey="count" name="投稿数" radius={[0, 6, 6, 0]} barSize={24}>
              {chartData.map((entry) => (
                <Cell key={entry.category} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
