import { useState, useEffect, useCallback } from "react";
import { IoClose, IoLogInOutline } from "react-icons/io5";
import Modal from "../components/shared/Modal";
import PageHeading from "../components/shared/PageHeading";
import StatusBadge from "../components/shared/StatusBadge";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { btn, field, table } from "../components/shared/ui";
import { fetchCheckInList } from "../utils/front-office-api";
import {
  checkInReservation,
  assignRoom,
  checkAvailability,
  createAdminReservation,
  confirmReservation,
} from "../utils/reservations-pms-api";

const BRANCH_ID = 4;
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A";
const todayISO = () => new Date().toISOString().split("T")[0];
const tomorrowISO = () => new Date(Date.now() + 86400000).toISOString().split("T")[0];
const fmtCurrency = (amount, symbol = "₦") => `${symbol}${Number(amount || 0).toLocaleString()}`;

const EMPTY_WALK_IN = { checkOut: "", roomsBooked: 1, roomTypeId: "", guestName: "", phone: "", email: "", roomNumber: "" };

export default function AdminCheckInsPage() {
  const [tab, setTab] = useState("arrivals");

  // --- Arrivals tab ---
  const [date, setDate] = useState(todayISO());
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [selected, setSelected] = useState(null);
  const [roomNumber, setRoomNumber] = useState("");
  const [processing, setProcessing] = useState(false);

  // --- Walk-in tab ---
  const [walkIn, setWalkIn] = useState(EMPTY_WALK_IN);
  const [availability, setAvailability] = useState(null);
  const [availLoading, setAvailLoading] = useState(false);
  const [walkInProcessing, setWalkInProcessing] = useState(false);
  const [walkInSuccess, setWalkInSuccess] = useState(null);
  const [walkInError, setWalkInError] = useState(null);

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchCheckInList(date);
      setReservations(Array.isArray(result) ? result : []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load check-in list.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { loadList(); }, [loadList]);

  const openCheckIn = (reservation) => {
    setSelected(reservation);
    setRoomNumber((reservation.room_assignments && reservation.room_assignments[0]?.room_number) || "");
  };

  const handleCheckIn = async () => {
    if (!selected) return;
    try {
      setProcessing(true);
      if (roomNumber.trim()) await assignRoom(selected.id, [roomNumber.trim()]);
      await checkInReservation(selected.id);
      setSuccessMessage(`${selected.guest_name} checked in.`);
      setTimeout(() => setSuccessMessage(""), 5000);
      setSelected(null);
      setRoomNumber("");
      loadList();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to check in.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckAvailability = async () => {
    if (!walkIn.checkOut) return;
    setAvailLoading(true);
    setAvailability(null);
    setWalkInError(null);
    try {
      const result = await checkAvailability(BRANCH_ID, todayISO(), walkIn.checkOut);
      setAvailability(result);
    } catch (err) {
      setWalkInError(err.response?.data?.message || "Could not load availability.");
    } finally {
      setAvailLoading(false);
    }
  };

  const handleWalkIn = async (e) => {
    e.preventDefault();
    if (!walkIn.roomTypeId || !walkIn.guestName.trim() || !walkIn.phone.trim() || !walkIn.email.trim() || !walkIn.checkOut) {
      setWalkInError("Guest name, phone, email, room type, and check-out date are required.");
      return;
    }
    setWalkInProcessing(true);
    setWalkInError(null);
    try {
      const hold = await createAdminReservation({
        branch_id: BRANCH_ID,
        room_type_id: Number(walkIn.roomTypeId),
        guest_name: walkIn.guestName.trim(),
        phone_number: walkIn.phone.trim(),
        guest_email: walkIn.email.trim(),
        check_in: todayISO(),
        check_out: walkIn.checkOut,
        rooms_booked: Number(walkIn.roomsBooked),
        source: "walk_in",
        booking_channel: "direct",
      });

      const internalId = hold.internal_id;
      const bookingRef = hold.reservation_id;

      await confirmReservation(internalId);
      await checkInReservation(internalId);
      if (walkIn.roomNumber.trim()) await assignRoom(internalId, [walkIn.roomNumber.trim()]);

      setWalkInSuccess({ bookingRef, guestName: walkIn.guestName.trim() });
      setWalkIn(EMPTY_WALK_IN);
      setAvailability(null);
    } catch (err) {
      setWalkInError(err.response?.data?.message || "Walk-in check-in failed. Please try again.");
    } finally {
      setWalkInProcessing(false);
    }
  };

  const resetWalkIn = () => {
    setWalkInSuccess(null);
    setWalkInError(null);
    setWalkIn(EMPTY_WALK_IN);
    setAvailability(null);
  };

  const availableTypes = availability
    ? availability.room_types.filter((rt) => rt.available_rooms >= Number(walkIn.roomsBooked))
    : [];

  return (
    <>
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-xl z-50 flex items-center gap-4 shadow-lg">
          <span className="text-xl font-bold">{successMessage}</span>
          <button onClick={() => setSuccessMessage("")} className="text-green-700 hover:text-green-900 cursor-pointer">
            <IoClose size={24} />
          </button>
        </div>
      )}

      <div data-component="AdminCheckIns" className="px-[4rem] max-sm:px-[1rem] py-[4rem] flex flex-col items-start gap-[3rem]">
        <PageHeading icon={IoLogInOutline}>Check-Ins</PageHeading>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-[color:var(--text-color)]/20 w-full">
          {[
            { key: "arrivals", label: "Expected Arrivals" },
            { key: "walkin", label: "Walk-In" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-8 py-3 text-xl font-bold transition-colors border-b-2 -mb-px cursor-pointer ${
                tab === key
                  ? "border-[color:var(--emphasis)] text-[color:var(--emphasis)]"
                  : "border-transparent text-[color:var(--text-color)]/60 hover:text-[color:var(--text-color)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* EXPECTED ARRIVALS */}
        {tab === "arrivals" && (
          <>
            <div className="w-full flex justify-end">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`${field.input} w-auto text-xl!`}
              />
            </div>
            <div className={table.card}>
              <div className={table.scroll}>
                <table className={table.el}>
                  <thead>
                    <tr className={table.headRow}>
                      <th className={table.th}>Guest</th>
                      <th className={`${table.th} hidden md:table-cell`}>Room Type</th>
                      <th className={`${table.th} hidden md:table-cell`}>Check-Out</th>
                      <th className={table.th}>Status</th>
                      <th className={table.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="5" className="px-8 py-10 text-center text-xl"><LoadingSpinner /></td></tr>
                    ) : error ? (
                      <tr><td colSpan="5" className="px-8 py-10 text-center text-red-600 text-xl">{error}</td></tr>
                    ) : reservations.length === 0 ? (
                      <tr><td colSpan="5" className="px-8 py-10 text-center text-xl text-[color:var(--text-color)]/50">No expected arrivals for this date.</td></tr>
                    ) : (
                      reservations.map((r) => (
                        <tr key={r.id} className={table.row}>
                          <td className={`${table.td} font-medium`}>{r.guest_name}</td>
                          <td className={`${table.td} hidden md:table-cell`}>{r.room_type?.name || "N/A"}</td>
                          <td className={`${table.td} hidden md:table-cell`}>{formatDate(r.check_out)}</td>
                          <td className={table.td}><StatusBadge status={r.status} /></td>
                          <td className={table.td}>
                            <div className={table.actions}>
                              <button
                                onClick={() => r.status === "confirmed" && openCheckIn(r)}
                                disabled={r.status !== "confirmed"}
                                title={r.status === "hold" ? "Awaiting payment — confirm reservation first" : ""}
                                className={btn.rowPrimary}
                              >
                                Check In
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* WALK-IN */}
        {tab === "walkin" && (
          <div className="w-full max-w-3xl">
            {walkInSuccess ? (
              <div className="flex flex-col items-center gap-6 py-16 text-center bg-white rounded-xl border border-[color:var(--text-color)]/10 w-full">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-5xl font-bold">✓</div>
                <h2 className="text-4xl font-secondary font-bold text-[color:var(--black)]">{walkInSuccess.guestName}</h2>
                <p className="text-2xl text-[color:var(--text-color)]/70">
                  Checked in · Booking Ref: <strong className="text-[color:var(--black)]">{walkInSuccess.bookingRef}</strong>
                </p>
                <p className="text-xl text-[color:var(--text-color)]/50">Guest profile and folio have been created.</p>
                <button onClick={resetWalkIn} className={`${btn.primary} mt-4`}>New Walk-In</button>
              </div>
            ) : (
              <form onSubmit={handleWalkIn} className="flex flex-col gap-8 bg-white rounded-xl border border-[color:var(--text-color)]/10 p-8">
                {walkInError && (
                  <p className="text-red-600 text-xl bg-red-50 border border-red-200 rounded-lg px-4 py-3">{walkInError}</p>
                )}

                {/* Date + rooms row */}
                <div className="flex gap-4 flex-wrap items-end">
                  <div className="flex flex-col gap-2">
                    <label className={field.label}>
                      Check-Out Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      min={tomorrowISO()}
                      value={walkIn.checkOut}
                      onChange={(e) => {
                        setWalkIn((p) => ({ ...p, checkOut: e.target.value, roomTypeId: "" }));
                        setAvailability(null);
                      }}
                      className={field.input}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={field.label}>Rooms</label>
                    <input
                      type="number"
                      min="1"
                      value={walkIn.roomsBooked}
                      onChange={(e) => {
                        setWalkIn((p) => ({ ...p, roomsBooked: e.target.value, roomTypeId: "" }));
                        setAvailability(null);
                      }}
                      className={`${field.input} w-28`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckAvailability}
                    disabled={!walkIn.checkOut || availLoading}
                    className={btn.primary}
                  >
                    {availLoading ? "Checking..." : "Check Availability"}
                  </button>
                </div>

                {/* Room type selection */}
                {availability && (
                  <div className="flex flex-col gap-3">
                    <label className={field.label}>
                      Room Type <span className="text-red-500">*</span>
                    </label>
                    {availableTypes.length === 0 ? (
                      <p className="text-red-600 text-xl">
                        No rooms available for {walkIn.roomsBooked} room(s) on those dates.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {availableTypes.map((rt) => (
                          <label
                            key={rt.room_type_id}
                            className={`flex items-center justify-between border rounded-xl px-6 py-4 cursor-pointer transition-colors ${
                              walkIn.roomTypeId === String(rt.room_type_id)
                                ? "border-[color:var(--emphasis)] bg-[color:var(--emphasis)]/5 ring-1 ring-[color:var(--emphasis)]"
                                : "border-[color:var(--text-color)]/20 hover:border-[color:var(--emphasis)]/40"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <input
                                type="radio"
                                name="roomType"
                                value={rt.room_type_id}
                                checked={walkIn.roomTypeId === String(rt.room_type_id)}
                                onChange={(e) => setWalkIn((p) => ({ ...p, roomTypeId: e.target.value }))}
                                className="accent-[color:var(--emphasis)] w-5 h-5"
                              />
                              <span className="text-xl font-medium">{rt.room_type_name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xl font-bold text-[color:var(--emphasis)]">
                                {fmtCurrency(rt.base_rate, rt.currency_symbol)} / night
                              </span>
                              <span className="block text-lg text-[color:var(--text-color)]/50">
                                {rt.available_rooms} available
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Guest details */}
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className={field.label}>
                      Guest Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Full name"
                      value={walkIn.guestName}
                      onChange={(e) => setWalkIn((p) => ({ ...p, guestName: e.target.value }))}
                      className={field.input}
                    />
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    <div className="flex flex-col gap-2 flex-1 min-w-48">
                      <label className={field.label}>
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="+234..."
                        value={walkIn.phone}
                        onChange={(e) => setWalkIn((p) => ({ ...p, phone: e.target.value }))}
                        className={field.input}
                      />
                    </div>
                    <div className="flex flex-col gap-2 flex-1 min-w-48">
                      <label className={field.label}>Email</label>
                      <input
                        type="email"
                        placeholder="guest@example.com"
                        value={walkIn.email}
                        onChange={(e) => setWalkIn((p) => ({ ...p, email: e.target.value }))}
                        className={field.input}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={field.label}>
                      Room Number <span className="text-[color:var(--text-color)]/40 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 205"
                      value={walkIn.roomNumber}
                      onChange={(e) => setWalkIn((p) => ({ ...p, roomNumber: e.target.value }))}
                      className={`${field.input} w-44`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={walkInProcessing || !walkIn.roomTypeId || !walkIn.guestName.trim() || !walkIn.phone.trim()}
                  className={`${btn.primary} self-start px-12! py-4!`}
                >
                  {walkInProcessing ? "Processing..." : "Check In Guest"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* ==== Check-in modal for expected arrivals ==== */}
      {selected && (
        <Modal
          onClose={() => setSelected(null)}
          title={selected.guest_name}
          subtitle="Confirm arrival details before checking the guest in."
          size="sm"
          footer={
            <>
              <button onClick={() => setSelected(null)} className={btn.secondary}>Cancel</button>
              <button onClick={handleCheckIn} disabled={processing} className={btn.success}>
                {processing ? "Checking In..." : "Confirm Check In"}
              </button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[color:var(--text-color)]/3 rounded-lg px-5 py-4">
              <p className="text-lg font-semibold uppercase tracking-wide text-[color:var(--text-color)]/50 mb-1">Room Type</p>
              <p className="text-2xl font-bold text-[color:var(--black)]">{selected.room_type?.name || "N/A"}</p>
            </div>
            <div className="bg-[color:var(--text-color)]/3 rounded-lg px-5 py-4">
              <p className="text-lg font-semibold uppercase tracking-wide text-[color:var(--text-color)]/50 mb-1">Rooms Booked</p>
              <p className="text-2xl font-bold text-[color:var(--black)]">{selected.rooms_booked}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className={field.label}>Room Number (optional)</label>
            <input
              type="text"
              placeholder="e.g. 205"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              className={field.input}
            />
          </div>
        </Modal>
      )}
    </>
  );
}
