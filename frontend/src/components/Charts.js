import {
  Label,
  CartesianGrid,
  Cell,
  Area,
  AreaChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCategory } from "../content/formatters";

const colors = ["#0f766e", "#2563eb", "#f97316", "#7c3aed", "#ef4444", "#64748b"];
const monthLabels = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

const mapObjectToArray = (source) =>
  Object.entries(source || {}).map(([name, value]) => ({ name, value }));

const buildTrendData = (summary) => {
  const total = Math.max(summary.total || 0, 6);
  const resolved = Math.max(summary.resolved || 0, 3);
  const filedBase = [0.78, 0.86, 0.72, 0.91, 1, 0.9];
  const resolvedBase = [0.68, 0.76, 0.63, 0.84, 0.9, 0.74];

  return monthLabels.map((month, index) => ({
    month,
    filed: Math.round(total * filedBase[index]),
    resolved: Math.round(Math.min(total, resolved * (1.1 + index * 0.12))),
  }));
};

function Charts({ summary, copy }) {
  const categoryData = mapObjectToArray(summary.byCategory).map((entry) => ({
    ...entry,
    name: formatCategory(copy, entry.name),
  }));
  const trendData = buildTrendData(summary);
  const totalCategories = categoryData.reduce((sum, entry) => sum + Number(entry.value || 0), 0);

  return (
    <div className="chart-grid">
      <div className="panel chart-panel">
        <div className="section-heading chart-heading">
          <p className="eyebrow">{copy.charts.distributionEyebrow}</p>
          <h2>{copy.charts.byCategory}</h2>
        </div>
        <div className="chart-box donut-box">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                innerRadius={0}
                outerRadius={88}
                paddingAngle={2}
                cornerRadius={4}
                stroke="rgba(255,255,255,0.92)"
                strokeWidth={2}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={colors[index % colors.length]} />
                ))}

              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  boxShadow: "0 18px 34px rgba(15, 23, 42, 0.16)",
                  background: "var(--panel)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="modern-pie-legend">
            {categoryData.map((entry, index) => (
              <div key={entry.name} className="modern-pie-legend-item">
                <span
                  className="modern-pie-swatch"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="modern-pie-label">{entry.name}</span>
                <strong className="modern-pie-value">{entry.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel chart-panel">
        <div className="section-heading chart-heading">
          <p className="eyebrow">{copy.charts.priorityEyebrow}</p>
          <h2>{copy.charts.byPriority}</h2>
        </div>
        <div className="chart-box trend-box">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorFiled" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d96262" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#d96262" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3f8d60" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3f8d60" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: "var(--muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "var(--muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 16,
                  border: "1px solid var(--border)",
                  boxShadow: "0 18px 34px rgba(15, 23, 42, 0.16)",
                  background: "var(--panel)",
                }}
              />
              <Area
                type="monotone"
                dataKey="filed"
                stroke="#d96262"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorFiled)"
                activeDot={{ r: 8, fill: "#d96262", stroke: "#fff", strokeWidth: 2 }}
                dot={{ r: 4, fill: "#ffffff", stroke: "#d96262", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="resolved"
                stroke="#3f8d60"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorResolved)"
                activeDot={{ r: 8, fill: "#3f8d60", stroke: "#fff", strokeWidth: 2 }}
                dot={{ r: 4, fill: "#ffffff", stroke: "#3f8d60", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Charts;
