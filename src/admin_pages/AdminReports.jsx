import { useState, useCallback } from "react";
import { IoBarChartOutline } from "react-icons/io5";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import Button from "../components/shared/Button";
import PageHeading from "../components/shared/PageHeading";
import { fetchReportsDashboard } from "../utils/reports-api";

const money = (v) =>
  `₦${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const pct = (v) => `${Number(v || 0).toFixed(1)}%`;

function currentMonthRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

const defaultRange = currentMonthRange();

export default function AdminReportsPage() {
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadReport = useCallback(async () => {
    if (!from || !to) return;
    try {
      setLoading(true);
      setError(null);
      const result = await fetchReportsDashboard(from, to);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  const summary = data?.summary || {};
  const paymentMethods = data?.paymentMethods || [];
  const revenueByRoomType = data?.revenueByRoomType || [];
  const occupancy = data?.occupancy || [];
  const period = data?.period;

  const totalPaymentsCollected = paymentMethods.reduce((sum, m) => sum + (m.total || 0), 0);

  return (
    <div data-component="AdminReports" className="px-[4rem] max-sm:px-[1rem] py-[4rem] flex flex-col items-start gap-[3rem]">
      <PageHeading icon={IoBarChartOutline}>Reports</PageHeading>

      {/* Date range picker */}
      <div className="bg-white rounded-xl border border-[color:var(--text-color)]/10 p-6 flex flex-wrap gap-4 items-end w-full">
        <div className="flex flex-col gap-2">
          <label className="text-xl font-semibold text-[color:var(--text-color)]/60">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-[color:var(--text-color)]/25 rounded-lg px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--emphasis)]"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xl font-semibold text-[color:var(--text-color)]/60">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border border-[color:var(--text-color)]/25 rounded-lg px-4 py-3 text-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--emphasis)]"
          />
        </div>
        <Button
          onClick={loadReport}
          disabled={loading}
          variant="emphasis"
          className={`text-xl! ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? "Loading..." : "Generate Report"}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xl w-full">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-20 w-full">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {!loading && data && (
        <div className="w-full flex flex-col gap-[2.5rem]">
          {period && (
            <p className="text-2xl text-[color:var(--text-color)]/60">
              Showing data for <strong className="text-[color:var(--black)]">{period.from}</strong> to{" "}
              <strong className="text-[color:var(--black)]">{period.to}</strong> ({period.days} day{period.days !== 1 ? "s" : ""})
            </p>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard label="Total Billed" value={money(summary.total_billed)} sub="charged to folios" />
            <SummaryCard label="Payments Received" value={money(totalPaymentsCollected)} sub="collected this period" accent />
            <SummaryCard label="Outstanding" value={money(summary.total_outstanding)} sub="balance still owed" warn={Number(summary.total_outstanding) > 0} />
            <SummaryCard label="Completed Stays" value={summary.completed_stays ?? "—"} sub={`of ${summary.total_stays ?? 0} total`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by room type */}
            <div className="bg-white rounded-xl border border-[color:var(--text-color)]/10 overflow-hidden">
              <div className="px-6 py-5 border-b border-[color:var(--text-color)]/10">
                <h2 className="text-3xl font-bold text-[color:var(--black)]">Revenue by Room Type</h2>
                <p className="text-xl text-[color:var(--text-color)]/50 mt-1">Reservations with check-in in selected period</p>
              </div>
              {revenueByRoomType.length === 0 ? (
                <p className="text-2xl text-[color:var(--text-color)]/50 px-6 py-8">No data for this period.</p>
              ) : (
                <table className="w-full text-2xl">
                  <thead>
                    <tr className="border-b border-[color:var(--text-color)]/10">
                      <th className="px-6 py-3 text-left text-xl font-semibold text-[color:var(--text-color)]/60 uppercase tracking-wide">Room Type</th>
                      <th className="px-6 py-3 text-right text-xl font-semibold text-[color:var(--text-color)]/60 uppercase tracking-wide">Stays</th>
                      <th className="px-6 py-3 text-right text-xl font-semibold text-[color:var(--text-color)]/60 uppercase tracking-wide">Revenue</th>
                      <th className="px-6 py-3 text-right text-xl font-semibold text-[color:var(--text-color)]/60 uppercase tracking-wide">Avg / Stay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueByRoomType.map((row, i) => (
                      <tr key={i} className="border-b border-[color:var(--text-color)]/10 hover:bg-black/2 transition-colors">
                        <td className="px-6 py-4 font-medium text-[color:var(--black)]">{row.room_type_name}</td>
                        <td className="px-6 py-4 text-right text-[color:var(--text-color)]/70">{row.total_stays}</td>
                        <td className="px-6 py-4 text-right font-semibold text-[color:var(--black)]">{money(row.total_revenue)}</td>
                        <td className="px-6 py-4 text-right text-[color:var(--text-color)]/70">{money(row.avg_rate_per_stay)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Payment methods */}
            <div className="bg-white rounded-xl border border-[color:var(--text-color)]/10 overflow-hidden">
              <div className="px-6 py-5 border-b border-[color:var(--text-color)]/10">
                <h2 className="text-3xl font-bold text-[color:var(--black)]">Payments by Method</h2>
                <p className="text-xl text-[color:var(--text-color)]/50 mt-1">Payments received in selected period</p>
              </div>
              {paymentMethods.length === 0 ? (
                <p className="text-2xl text-[color:var(--text-color)]/50 px-6 py-8">No payments recorded in this period.</p>
              ) : (
                <table className="w-full text-2xl">
                  <thead>
                    <tr className="border-b border-[color:var(--text-color)]/10">
                      <th className="px-6 py-3 text-left text-xl font-semibold text-[color:var(--text-color)]/60 uppercase tracking-wide">Method</th>
                      <th className="px-6 py-3 text-right text-xl font-semibold text-[color:var(--text-color)]/60 uppercase tracking-wide">Count</th>
                      <th className="px-6 py-3 text-right text-xl font-semibold text-[color:var(--text-color)]/60 uppercase tracking-wide">Total</th>
                      <th className="px-6 py-3 text-right text-xl font-semibold text-[color:var(--text-color)]/60 uppercase tracking-wide">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentMethods.map((row, i) => (
                      <tr key={i} className="border-b border-[color:var(--text-color)]/10 hover:bg-black/2 transition-colors">
                        <td className="px-6 py-4 font-medium text-[color:var(--black)] capitalize">{row.payment_method}</td>
                        <td className="px-6 py-4 text-right text-[color:var(--text-color)]/70">{row.count}</td>
                        <td className="px-6 py-4 text-right font-semibold text-[color:var(--black)]">{money(row.total)}</td>
                        <td className="px-6 py-4 text-right text-[color:var(--text-color)]/60">
                          {totalPaymentsCollected > 0 ? pct((row.total / totalPaymentsCollected) * 100) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-[color:var(--text-color)]/15">
                    <tr className="bg-[color:var(--text-color)]/3">
                      <td className="px-6 py-4 font-bold text-[color:var(--black)]">Total</td>
                      <td className="px-6 py-4 text-right font-semibold text-[color:var(--text-color)]/70">
                        {paymentMethods.reduce((s, r) => s + r.count, 0)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-[color:var(--black)]">{money(totalPaymentsCollected)}</td>
                      <td className="px-6 py-4 text-right text-[color:var(--text-color)]/50">100%</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>

          {/* Occupancy */}
          <div className="bg-white rounded-xl border border-[color:var(--text-color)]/10 overflow-hidden">
            <div className="px-6 py-5 border-b border-[color:var(--text-color)]/10">
              <h2 className="text-3xl font-bold text-[color:var(--black)]">Occupancy by Room Type</h2>
              <p className="text-xl text-[color:var(--text-color)]/50 mt-1">Room nights occupied vs available across the selected period</p>
            </div>
            {occupancy.length === 0 ? (
              <p className="text-2xl text-[color:var(--text-color)]/50 px-6 py-8">No data for this period.</p>
            ) : (
              <table className="w-full text-2xl">
                <thead>
                  <tr className="border-b border-[color:var(--text-color)]/10">
                    <th className="px-6 py-3 text-left text-xl font-semibold text-[color:var(--text-color)]/60 uppercase tracking-wide">Room Type</th>
                    <th className="px-6 py-3 text-right text-xl font-semibold text-[color:var(--text-color)]/60 uppercase tracking-wide">Capacity</th>
                    <th className="px-6 py-3 text-right text-xl font-semibold text-[color:var(--text-color)]/60 uppercase tracking-wide">Avail. Nights</th>
                    <th className="px-6 py-3 text-right text-xl font-semibold text-[color:var(--text-color)]/60 uppercase tracking-wide">Occupied</th>
                    <th className="px-6 py-3 text-right text-xl font-semibold text-[color:var(--text-color)]/60 uppercase tracking-wide">Occ. %</th>
                  </tr>
                </thead>
                <tbody>
                  {occupancy.map((row, i) => (
                    <tr key={i} className="border-b border-[color:var(--text-color)]/10 hover:bg-black/2 transition-colors">
                      <td className="px-6 py-4 font-medium text-[color:var(--black)]">{row.room_type_name}</td>
                      <td className="px-6 py-4 text-right text-[color:var(--text-color)]/70">{row.max_capacity}</td>
                      <td className="px-6 py-4 text-right text-[color:var(--text-color)]/70">{row.available_room_nights}</td>
                      <td className="px-6 py-4 text-right text-[color:var(--text-color)]/70">{Number(row.occupied_room_nights).toFixed(1)}</td>
                      <td className="px-6 py-4 text-right">
                        <OccupancyBadge value={row.occupancy_pct} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {!loading && !data && !error && (
        <div className="text-center py-20 text-[color:var(--text-color)]/40 text-2xl w-full">
          Select a date range and click <strong>Generate Report</strong> to view results.
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub, accent, warn }) {
  return (
    <div className={`rounded-xl border p-6 ${accent ? "bg-[color:var(--emphasis)] border-transparent text-white" : warn ? "bg-white border-orange-200" : "bg-white border-[color:var(--text-color)]/10"}`}>
      <p className={`text-xl font-semibold uppercase tracking-wide mb-2 ${accent ? "text-white/70" : "text-[color:var(--text-color)]/50"}`}>
        {label}
      </p>
      <p className={`text-4xl font-bold ${accent ? "text-white" : warn ? "text-orange-600" : "text-[color:var(--black)]"}`}>
        {value}
      </p>
      {sub && (
        <p className={`text-xl mt-1 ${accent ? "text-white/60" : "text-[color:var(--text-color)]/40"}`}>{sub}</p>
      )}
    </div>
  );
}

function OccupancyBadge({ value }) {
  const v = Number(value || 0);
  const color = v >= 80 ? "bg-green-100 text-green-700" : v >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xl font-bold ${color}`}>
      {pct(v)}
    </span>
  );
}
