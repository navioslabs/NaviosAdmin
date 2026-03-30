import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface TrendData {
  date: string;
  posts: number;
  talks: number;
}

export function PostsTrendChart({ data }: { data: TrendData[] }) {
  const total = data.reduce((sum, d) => sum + d.posts + d.talks, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" />
          <CardTitle>投稿数推移</CardTitle>
        </div>
        <CardDescription>
          過去30日間 ・ 合計 {total.toLocaleString()} 件
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gradPosts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00D4A1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#00D4A1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradTalks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickFormatter={(v: string) => v.slice(5)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
            <Tooltip
              labelFormatter={(v) => String(v)}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid var(--border)",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                background: "var(--card)",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="posts"
              name="投稿"
              stroke="#00D4A1"
              strokeWidth={2}
              fill="url(#gradPosts)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="talks"
              name="ひとこと"
              stroke="#8B5CF6"
              strokeWidth={2}
              fill="url(#gradTalks)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
