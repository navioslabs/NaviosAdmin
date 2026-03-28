import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TrendData {
  date: string;
  posts: number;
  talks: number;
}

export function PostsTrendChart({ data }: { data: TrendData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>投稿数推移（過去30日）</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              labelFormatter={(v) => String(v)}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid var(--border)",
                fontSize: "12px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="posts"
              name="投稿"
              stroke="hsl(220, 70%, 50%)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="talks"
              name="ひとこと"
              stroke="hsl(150, 60%, 45%)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
