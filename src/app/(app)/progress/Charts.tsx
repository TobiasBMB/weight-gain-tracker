"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type ChartDay = {
  day: string;
  calories: number | null;
  protein: number | null;
  weight: number | null;
  stress: number | null;
  skin: number | null;
  sleep: number | null;
  hips: number | null;
  chest: number | null;
  arm: number | null;
};

const BLUE = "#7cc0f2";
const ROSE = "#f27ba6";
const MUTED_BAR = "#2e3b57";
const GRID = "#1e2840";
const SOFT = "#c9d1e0";

const tick = { fontSize: 11, fill: "#94a0b8" };
const tooltip = {
  contentStyle: { background: "#1a2338", border: "1px solid #26314a", borderRadius: 12, color: "#f1f4f9" },
  labelStyle: { color: "#c9d1e0" },
  cursor: { fill: "rgba(124,192,242,0.08)", stroke: "#26314a" },
};
const shortDay = (d: string) => `${Number(d.slice(8))}/${Number(d.slice(5, 7))}`;

export function Charts({ data, calorieTarget, proteinTarget }: { data: ChartDay[]; calorieTarget: number | null; proteinTarget: number | null }) {
  const hasWeight = data.some((d) => d.weight !== null);
  const hasFood = data.some((d) => d.calories !== null);
  const hasMood = data.some((d) => d.stress !== null || d.skin !== null || d.sleep !== null);
  const hasMeasure = data.some((d) => d.hips !== null || d.chest !== null || d.arm !== null);

  if (!hasWeight && !hasFood && !hasMood) {
    return <p className="card text-soft">Charts appear here once you start logging food and check-ins.</p>;
  }

  return (
    <>
      {hasWeight && (
        <ChartCard title="Weight (kg)">
          <LineChart data={data}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="day" tickFormatter={shortDay} tick={tick} minTickGap={20} />
            <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={tick} width={36} />
            <Tooltip {...tooltip} labelFormatter={(d) => shortDay(String(d))} />
            <Line type="monotone" dataKey="weight" name="Weight" stroke={BLUE} strokeWidth={2.5} dot={{ r: 3, fill: BLUE }} connectNulls />
          </LineChart>
        </ChartCard>
      )}

      {hasFood && (
        <ChartCard title="Calories per day">
          <BarChart data={data}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="day" tickFormatter={shortDay} tick={tick} minTickGap={20} />
            <YAxis tick={tick} width={40} />
            <Tooltip {...tooltip} labelFormatter={(d) => shortDay(String(d))} />
            {calorieTarget && <ReferenceLine y={calorieTarget} stroke={SOFT} strokeDasharray="4 4" label={{ value: "target", fill: SOFT, fontSize: 11, position: "insideTopRight" }} />}
            <Bar dataKey="calories" name="Calories" radius={[6, 6, 0, 0]}>
              {data.map((d) => (
                <Cell key={d.day} fill={calorieTarget && (d.calories ?? 0) >= calorieTarget * 0.95 ? BLUE : MUTED_BAR} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>
      )}

      {hasFood && (
        <ChartCard title="Protein per day (g)">
          <BarChart data={data}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="day" tickFormatter={shortDay} tick={tick} minTickGap={20} />
            <YAxis tick={tick} width={36} />
            <Tooltip {...tooltip} labelFormatter={(d) => shortDay(String(d))} />
            {proteinTarget && <ReferenceLine y={proteinTarget} stroke={SOFT} strokeDasharray="4 4" />}
            <Bar dataKey="protein" name="Protein (g)" fill={ROSE} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>
      )}

      {hasMood && (
        <ChartCard title="Stress, skin and sleep">
          <LineChart data={data}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="day" tickFormatter={shortDay} tick={tick} minTickGap={20} />
            <YAxis yAxisId="score" domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={tick} width={24} />
            <YAxis yAxisId="hours" orientation="right" domain={[0, 12]} tick={tick} width={24} />
            <Tooltip {...tooltip} labelFormatter={(d) => shortDay(String(d))} />
            <Legend wrapperStyle={{ fontSize: 12, color: SOFT }} />
            <Line yAxisId="score" dataKey="stress" name="Stress (1–5)" stroke={ROSE} strokeWidth={2} dot={{ r: 2 }} connectNulls />
            <Line yAxisId="score" dataKey="skin" name="Skin (5 = clear)" stroke={BLUE} strokeWidth={2} dot={{ r: 2 }} connectNulls />
            <Line yAxisId="hours" dataKey="sleep" name="Sleep (h)" stroke={SOFT} strokeWidth={2} strokeDasharray="4 3" dot={{ r: 2 }} connectNulls />
          </LineChart>
        </ChartCard>
      )}

      {hasMeasure && (
        <ChartCard title="Measurements (cm)">
          <LineChart data={data}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="day" tickFormatter={shortDay} tick={tick} minTickGap={20} />
            <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={tick} width={36} />
            <Tooltip {...tooltip} labelFormatter={(d) => shortDay(String(d))} />
            <Legend wrapperStyle={{ fontSize: 12, color: SOFT }} />
            <Line dataKey="hips" name="Hips" stroke={ROSE} strokeWidth={2} connectNulls />
            <Line dataKey="chest" name="Chest" stroke={BLUE} strokeWidth={2} connectNulls />
            <Line dataKey="arm" name="Arm" stroke={SOFT} strokeWidth={2} connectNulls />
          </LineChart>
        </ChartCard>
      )}
    </>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <section className="card">
      <h2 className="mb-3 text-[17px] font-bold">{title}</h2>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </section>
  );
}
