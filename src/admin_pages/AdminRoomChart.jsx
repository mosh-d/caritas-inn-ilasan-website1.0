import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { IoAppsOutline, IoChevronBack, IoChevronForward } from "react-icons/io5";
import PageHeading from "../components/shared/PageHeading";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { btn } from "../components/shared/ui";
import { fetchRoomChart } from "../utils/reservations-pms-api";

const DAYS_VISIBLE = 14;
const DAY_MS = 86400000;

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const addDays = (d, n) => new Date(d.getTime() + n * DAY_MS);
const isoDate = (d) => addDays(d, 0).toISOString().split("T")[0];
const dayIndexOf = (date, windowStart) => Math.round((startOfDay(new Date(date)) - windowStart) / DAY_MS);

const BAR_STYLES = {
  hold: "bg-amber-400 text-amber-950",
  confirmed: "bg-blue-500 text-white",
  active: "bg-green-600 text-white",
};

const dateLabel = (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export default function AdminRoomChartPage() {
  const navigate = useNavigate();
  const [windowStart, setWindowStart] = useState(() => startOfDay(new Date()));
  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const windowEnd = useMemo(() => addDays(windowStart, DAYS_VISIBLE), [windowStart]);
  const days = useMemo(() => Array.from({ length: DAYS_VISIBLE }, (_, i) => addDays(windowStart, i)), [windowStart]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchRoomChart(isoDate(windowStart), isoDate(windowEnd));
      setChart(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load room chart.");
    } finally {
      setLoading(false);
    }
  }, [windowStart, windowEnd]);

  useEffect(() => { load(); }, [load]);

  // Flatten room types into a single row list: a header row per type, one
  // row per numbered room, and an "Unassigned" row per type if it has any
  // bookings without a specific room picked yet.
  const rows = useMemo(() => {
    if (!chart) return [];
    const out = [];
    for (const rt of chart.room_types) {
      out.push({ kind: "header", key: `h-${rt.room_type_id}`, label: rt.room_type_name, count: rt.rooms.length });
      for (const room of rt.rooms) {
        out.push({ kind: "room", key: `r-${rt.room_type_id}-${room.room_inventory_id}`, label: room.room_number, bars: room.bars });
      }
      if (rt.unassigned.length > 0) {
        out.push({ kind: "unassigned", key: `u-${rt.room_type_id}`, label: "Unassigned", bars: rt.unassigned });
      }
    }
    return out;
  }, [chart]);

  const gridTemplateColumns = `10rem repeat(${DAYS_VISIBLE}, minmax(4.5rem, 1fr))`;

  return (
    <div data-component="AdminRoomChart" className="px-[4rem] max-sm:px-[1rem] py-[4rem] flex flex-col items-start gap-[3rem]">
      <div className="w-full flex justify-between items-center max-sm:flex-col max-sm:items-start max-sm:gap-4">
        <PageHeading icon={IoAppsOutline}>Room Chart</PageHeading>

        <div className="flex items-center gap-3">
          <button onClick={() => setWindowStart((d) => addDays(d, -DAYS_VISIBLE))} className={`${btn.secondary} flex items-center gap-1`}>
            <IoChevronBack size={18} /> Previous
          </button>
          <button onClick={() => setWindowStart(startOfDay(new Date()))} className={btn.secondary}>Today</button>
          <button onClick={() => setWindowStart((d) => addDays(d, DAYS_VISIBLE))} className={`${btn.secondary} flex items-center gap-1`}>
            Next <IoChevronForward size={18} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6 text-lg">
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-amber-400 inline-block" /> Hold</span>
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-blue-500 inline-block" /> Confirmed</span>
        <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-green-600 inline-block" /> In-House</span>
      </div>

      {loading ? (
        <div className="w-full flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <p className="text-red-600 text-xl">{error}</p>
      ) : rows.length === 0 ? (
        <p className="text-xl text-[color:var(--text-color)]/50 py-16 w-full text-center">
          No room types have numbered rooms yet — the chart fills in once room numbers are assigned on the Rooms page.
        </p>
      ) : (
        <div className="w-full bg-white rounded-xl border border-[color:var(--text-color)]/10 overflow-x-auto">
          <div className="grid" style={{ gridTemplateColumns, minWidth: `${10 + DAYS_VISIBLE * 4.5}rem` }}>
            {/* Date header row */}
            <div className="sticky left-0 bg-white z-10 border-b border-r border-[color:var(--text-color)]/10 px-3 py-2" />
            {days.map((d) => (
              <div
                key={isoDate(d)}
                className={`text-center text-sm font-semibold border-b border-[color:var(--text-color)]/10 px-1 py-2 ${
                  isoDate(d) === isoDate(new Date()) ? "bg-[color:var(--emphasis)]/10 text-[color:var(--emphasis)]" : "text-[color:var(--text-color)]/60"
                }`}
              >
                {dateLabel(d)}
              </div>
            ))}

            {/* Body rows */}
            {rows.map((row) =>
              row.kind === "header" ? (
                <div
                  key={row.key}
                  className="col-span-full bg-[color:var(--text-color)]/5 px-3 py-2 text-lg font-bold text-[color:var(--black)] border-b border-[color:var(--text-color)]/10"
                >
                  {row.label} <span className="text-base font-normal text-[color:var(--text-color)]/50">({row.count} room{row.count === 1 ? "" : "s"})</span>
                </div>
              ) : (
                <RoomRow
                  key={row.key}
                  label={row.label}
                  bars={row.bars}
                  windowStart={windowStart}
                  isUnassigned={row.kind === "unassigned"}
                  onSelectBar={() => navigate("/admin/reservations")}
                />
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RoomRow({ label, bars, windowStart, isUnassigned, onSelectBar }) {
  return (
    <>
      <div
        className={`sticky left-0 z-10 border-b border-r border-[color:var(--text-color)]/10 px-3 py-3 text-lg font-medium flex items-center ${
          isUnassigned ? "bg-gray-50 text-[color:var(--text-color)]/50 italic" : "bg-white text-[color:var(--black)]"
        }`}
      >
        {label}
      </div>
      <div
        className="relative grid grid-cols-subgrid border-b border-[color:var(--text-color)]/10"
        style={{ gridColumn: `2 / -1`, minHeight: "3rem" }}
      >
        {bars.map((bar, i) => {
          const startCol = Math.max(0, dayIndexOf(bar.check_in, windowStart));
          const endCol = Math.min(DAYS_VISIBLE, dayIndexOf(bar.check_out, windowStart));
          if (endCol <= startCol) return null;
          return (
            <button
              key={`${bar.reservation_id}-${i}`}
              onClick={onSelectBar}
              title={`${bar.guest_name} · ${new Date(bar.check_in).toLocaleDateString()} → ${new Date(bar.check_out).toLocaleDateString()}${bar.rooms_needed ? ` · ${bar.rooms_needed} room(s) needed` : ""}`}
              className={`m-1 px-2 rounded-md text-sm font-semibold truncate text-left cursor-pointer transition-opacity hover:opacity-80 ${BAR_STYLES[bar.status] || "bg-gray-400 text-white"}`}
              style={{ gridColumn: `${startCol + 1} / ${endCol + 1}` }}
            >
              {bar.guest_name}
            </button>
          );
        })}
      </div>
    </>
  );
}
