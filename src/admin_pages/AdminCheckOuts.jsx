import { useState, useEffect, useCallback } from "react";
import { IoClose, IoLogOutOutline } from "react-icons/io5";
import Modal from "../components/shared/Modal";
import PageHeading from "../components/shared/PageHeading";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { btn, field, table } from "../components/shared/ui";
import { fetchCheckOutList } from "../utils/front-office-api";
import { checkOutReservation } from "../utils/reservations-pms-api";
import { fetchFolios } from "../utils/folios-api";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A");
const money = (value) => `₦${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const todayISO = () => new Date().toISOString().split("T")[0];

export default function AdminCheckOutsPage() {
  const [date, setDate] = useState(todayISO());
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [selected, setSelected] = useState(null);
  const [folio, setFolio] = useState(null);
  const [folioLoading, setFolioLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchCheckOutList(date);
      setReservations(Array.isArray(result) ? result : []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load check-out list.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openCheckOut = async (reservation) => {
    setSelected(reservation);
    setFolio(null);
    setFolioLoading(true);
    try {
      const result = await fetchFolios({ reservation_id: reservation.id });
      setFolio((result.data && result.data[0]) || null);
    } catch {
      setFolio(null);
    } finally {
      setFolioLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selected) return;
    try {
      setProcessing(true);
      await checkOutReservation(selected.id);
      setSuccessMessage(`${selected.guest_name} checked out.`);
      setTimeout(() => setSuccessMessage(""), 5000);
      setSelected(null);
      loadList();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to check out.");
    } finally {
      setProcessing(false);
    }
  };

  const balanceDue = folio && Number(folio.balance) > 0;

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

      <div data-component="AdminCheckOuts" className="px-[4rem] max-sm:px-[1rem] py-[4rem] flex flex-col items-start gap-[3rem]">
        <div className="w-full flex justify-between items-center max-sm:flex-col max-sm:items-start max-sm:gap-4">
          <PageHeading icon={IoLogOutOutline}>Check-Out List</PageHeading>
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
                  <th className={`${table.th} hidden md:table-cell`}>Checked In</th>
                  <th className={table.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="px-8 py-10 text-center text-xl"><LoadingSpinner /></td></tr>
                ) : error ? (
                  <tr><td colSpan="4" className="px-8 py-10 text-center text-red-600 text-xl">{error}</td></tr>
                ) : reservations.length === 0 ? (
                  <tr><td colSpan="4" className="px-8 py-10 text-center text-xl text-[color:var(--text-color)]/50">No expected check-outs for this date.</td></tr>
                ) : (
                  reservations.map((r) => (
                    <tr key={r.id} className={table.row}>
                      <td className={`${table.td} font-medium`}>{r.guest_name}</td>
                      <td className={`${table.td} hidden md:table-cell`}>{r.room_type?.name || "N/A"}</td>
                      <td className={`${table.td} hidden md:table-cell`}>{formatDate(r.actual_check_in)}</td>
                      <td className={table.td}>
                        <div className={table.actions}>
                          <button onClick={() => openCheckOut(r)} className={btn.rowPrimary}>Check Out</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==== Check-out confirmation modal ==== */}
      {selected && (
        <Modal
          onClose={() => setSelected(null)}
          title={selected.guest_name}
          subtitle="Review the folio balance before completing check-out."
          size="sm"
          footer={
            <>
              <button onClick={() => setSelected(null)} className={btn.secondary}>Cancel</button>
              <button onClick={handleCheckOut} disabled={processing} className={btn.success}>
                {processing ? "Checking Out..." : "Confirm Check Out"}
              </button>
            </>
          }
        >
          {folioLoading ? (
            <div className="flex justify-center py-6"><LoadingSpinner /></div>
          ) : folio ? (
            <div className={`flex justify-between items-center text-xl px-5 py-4 rounded-lg border ${balanceDue ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}>
              <span className="font-bold">Folio Balance</span>
              <span className="font-bold text-2xl">{money(folio.balance)}</span>
            </div>
          ) : (
            <p className="text-xl text-[color:var(--text-color)]/60">No folio found for this reservation.</p>
          )}
          {balanceDue && (
            <p className="text-xl text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-5 py-4">
              ⚠ Outstanding balance — consider settling payment before checkout.
            </p>
          )}
        </Modal>
      )}
    </>
  );
}
