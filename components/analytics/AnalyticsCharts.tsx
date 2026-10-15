"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from "recharts"

export interface MonthlyDatum {
  month: string
  donations?: number
  items?: number
}

export interface PieDatum {
  name: string
  value: number
  fill: string
}

export interface RequirementDatum {
  priority: string
  requested: number
  remaining: number
}

const PIE_COLORS = [
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
]

interface ChartsProps {
  donations: MonthlyDatum[]
  distributions: MonthlyDatum[]
  inventory: PieDatum[]
  requirements: RequirementDatum[]
}

export function AnalyticsCharts({
  donations,
  distributions,
  inventory,
  requirements,
}: ChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="glass border-white/50 shadow-lg rounded-2xl p-5">
        <div className="pb-3">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="12" width="4" height="9" rx="1" />
              <rect x="10" y="7" width="4" height="14" rx="1" />
              <rect x="17" y="3" width="4" height="18" rx="1" />
            </svg>
            Monthly Donations
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Number of donations submitted in the last 6 months
          </p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={donations}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip />
              <defs>
                <linearGradient id="emeraldGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
              <Bar
                dataKey="donations"
                fill="url(#emeraldGrad)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass border-white/50 shadow-lg rounded-2xl p-5">
        <div className="pb-3">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            Distribution Trend
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Items distributed per month (last 6 months)
          </p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={distributions}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="items"
                stroke="#0d9488"
                strokeWidth={3}
                dot={{ fill: "#14b8a6", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass border-white/50 shadow-lg rounded-2xl p-5">
        <div className="pb-3">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
            Inventory by Category
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Available stock distribution across top clothing categories
          </p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPie>
              <Pie
                data={inventory}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                paddingAngle={2}
                label={(entry) => entry.name}
              >
                {inventory.map((entry, i) => (
                  <Cell key={i} fill={entry.fill || PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPie>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass border-white/50 shadow-lg rounded-2xl p-5">
        <div className="pb-3">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            Requirements vs Remaining
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Active requirement requests grouped by priority
          </p>
        </div>
        <div className="h-64">
          {requirements.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              No active requirements yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={requirements}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="priority" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="requested"
                  name="Requested"
                  fill="#f59e0b"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="remaining"
                  name="Remaining"
                  fill="#ef4444"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
