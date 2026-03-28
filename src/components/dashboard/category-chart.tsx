import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CAT_CONFIG } from "@/constants/categories";
import type { CategoryId } from "@/types";

interface CategoryData {
  category: string;
  count: number;
}

export function CategoryChart({ data }: { data: CategoryData[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: CAT_CONFIG[d.category as CategoryId]?.label ?? d.category,
    color: CAT_CONFIG[d.category as CategoryId]?.color ?? "#888",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>カテゴリ別投稿数</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 12 }}
              width={90}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid var(--border)",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="count" name="投稿数" radius={[0, 4, 4, 0]}>
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
