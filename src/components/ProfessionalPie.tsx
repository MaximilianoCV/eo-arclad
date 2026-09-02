import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface PieDataItem {
  name: string;
  value: number;
  color: string;
  percentage?: number;
}

interface Props {
  data: PieDataItem[];
  tooltipFormatter?: (value: number) => string;
  height?: number;
  /** "inside": solo el % dentro de la rebanada (para columnas angostas con leyenda abajo) */
  labels?: "full" | "inside";
}

const RADIAN = Math.PI / 180;

function renderLabelInside({ cx, cy, midAngle, innerRadius, outerRadius, percent }: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number }) {
  if (percent < 0.06) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN), y = cy + r * Math.sin(-midAngle * RADIAN);
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={700} style={{ textShadow: "0 1px 3px rgba(0,0,0,0.45)" }}>{`${Math.round(percent * 100)}%`}</text>;
}

function renderLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
  index: number;
}) {
  if (percent < 0.01) return null;

  // Label inside the slice
  const insideRadius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const ix = cx + insideRadius * Math.cos(-midAngle * RADIAN);
  const iy = cy + insideRadius * Math.sin(-midAngle * RADIAN);

  // Label outside with leader line
  const outerLabelRadius = outerRadius + 30;
  const ox = cx + outerLabelRadius * Math.cos(-midAngle * RADIAN);
  const oy = cy + outerLabelRadius * Math.sin(-midAngle * RADIAN);

  const lineEnd = outerRadius + 8;
  const lx = cx + lineEnd * Math.cos(-midAngle * RADIAN);
  const ly = cy + lineEnd * Math.sin(-midAngle * RADIAN);

  const textAnchor = ox > cx ? "start" : "end";
  const pctText = `${Math.round(percent * 100)}%`;

  return (
    <g>
      {/* Percentage inside the slice */}
      {percent >= 0.08 && (
        <text
          x={ix}
          y={iy}
          fill="white"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={18}
          fontWeight={700}
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
        >
          {pctText}
        </text>
      )}
      {/* Leader line */}
      <line x1={lx} y1={ly} x2={ox} y2={oy} stroke="hsl(var(--muted-foreground))" strokeWidth={1} opacity={0.5} />
      {/* Outside label */}
      <text x={ox + (ox > cx ? 4 : -4)} y={oy - 7} textAnchor={textAnchor} fill="hsl(var(--foreground))" fontSize={14} fontWeight={600}>
        {name}
      </text>
      {percent < 0.08 && (
        <text x={ox + (ox > cx ? 4 : -4)} y={oy + 10} textAnchor={textAnchor} fill="hsl(var(--muted-foreground))" fontSize={13}>
          {pctText}
        </text>
      )}
    </g>
  );
}

export default function ProfessionalPie({ data, tooltipFormatter, height = 380, labels = "full" }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        Sin datos para mostrar
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={labels === "inside" ? Math.min(height * 0.42, 130) : Math.min(height * 0.35, 130)}
          strokeWidth={2}
          stroke="hsl(var(--background))"
          label={labels === "inside" ? renderLabelInside : renderLabel}
          labelLine={false}
          isAnimationActive={false}
        >
          {data.map((entry, idx) => (
            <Cell key={idx} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={tooltipFormatter ? (v: number) => tooltipFormatter(v) : undefined}
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
