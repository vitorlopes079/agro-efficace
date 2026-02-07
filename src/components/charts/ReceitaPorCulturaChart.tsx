// src/components/charts/ReceitaPorCulturaChart.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface ReceitaCultura {
  cultura: string;
  valor: number;
  porcentagem: number;
}

interface ReceitaPorCulturaChartProps {
  data: ReceitaCultura[];
}

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6"];

export function ReceitaPorCulturaChart({ data }: ReceitaPorCulturaChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Receita por Cultura</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props) => {
                const RADIAN = Math.PI / 180;
                const radius = (props.outerRadius || 0) + 25;
                const x =
                  (props.cx || 0) +
                  radius * Math.cos(-(props.midAngle || 0) * RADIAN);
                const y =
                  (props.cy || 0) +
                  radius * Math.sin(-(props.midAngle || 0) * RADIAN);

                return (
                  <text
                    x={x}
                    y={y}
                    fill="#a1a1aa"
                    textAnchor={x > (props.cx || 0) ? "start" : "end"}
                    dominantBaseline="central"
                    style={{ fontSize: "11px", fontWeight: 500 }}
                  >
                    {`${props.payload.cultura} ${props.payload.porcentagem}%`}
                  </text>
                );
              }}
              outerRadius={90}
              fill="#8884d8"
              dataKey="valor"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "12px",
              }}
              formatter={(value) => `R$ ${Number(value).toLocaleString()}`}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Legenda manual */}
        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {data.map((item, index) => (
            <div key={item.cultura} className="flex items-center gap-2">
              <div
                className="h-3 w-3 flex-shrink-0 rounded-full"
                style={{ backgroundColor: COLORS[index] }}
              />
              <span className="text-xs text-zinc-400">
                {item.cultura}: R$ {(item.valor / 1000).toFixed(0)}k
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
