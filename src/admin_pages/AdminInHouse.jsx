import { useState, useEffect, useCallback } from "react";
import { IoClose, IoHomeOutline } from "react-icons/io5";
import Modal from "../components/shared/Modal";
import PageHeading from "../components/shared/PageHeading";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import RoomAssignmentPicker from "../components/shared/RoomAssignmentPicker";
import { btn, field, table } from "../components/shared/ui";
import { fetchInHouse, fetchInHouseById } from "../utils/front-office-api";
import { checkOutReservation, extendStay, assignRoom } from "../utils/reservations-pms-api";
import { fetchFolios } from "../utils/folios-api";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A");
const money = (value) => `₦${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const isOverdue = (checkOut) => checkOut && new Date(checkOut) < new Date();

export default function AdminInHousePage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [assigningRoom, setAssigningRoom] = useState(false);
  const [modalError, setModalError] = useState("");
  const [newCheckOutDate, setNewCheckOutDate] = useState("");
  const [folio, setFolio] = useState(null);
  const [folioLoading, setFolioLoading] = useState(false);

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchInHouse();
      setReservations(Array.isArray(result) ? result : []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load in-house guest list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openDetail = async (reservation) => {
    setDetailLoading(true);
    setFolio(null);
    setFolioLoading(true);
    setModalError("");
    try {
      const [full, folioResult] = await Promise.all([
        fetchInHouseById(reservation.id),
        fetchFolios({ reservation_id: reservation.id }).catch(() => null),
      ]);
      setSelected(full);
      setFolio((folioResult?.data && folioResult.data[0]) || null);
      setNewCheckOutDate("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load guest detail.");
    } finally {
      setDetailLoading(false);
      setFolioLoading(false);
    }
  };

  const closeDetail = () => { setSelected(null); setFolio(null); setModalError(""); };
  const balanceDue = folio && Number(folio.balance) > 0;

  const handleCheckOut = async () => {
    if (!selected) return;
    try {
      setProcessing(true);
      await checkOutReservation(selected.id);
      setSuccessMessage(`${selected.guest_name} checked out.`);
      setTimeout(() => setSuccessMessage(""), 5000);
      closeDetail();
      loadList();
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to check out.");
    } finally {
      setProcessing(false);
    }
  };

  const handleExtendStay = async () => {
    if (!selected || !newCheckOutDate) return;
    try {
      setProcessing(true);
      await extendStay(selected.id, newCheckOutDate);
      setSuccessMessage("Stay extended.");
      setTimeout(() => setSuccessMessage(""), 5000);
      closeDetail();
      loadList();
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to extend stay.");
    } finally {
      setProcessing(false);
    }
  };

  const handleAssignRoom = async (roomNumbers) => {
    if (!selected) return;
    try {
      setAssigningRoom(true);
      await assignRoom(selected.id, roomNumbers);
      const full = await fetchInHouseById(selected.id);
      setSelected(full);
      loadList();
      setSuccessMessage("Room assignments saved.");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to assign room.");
    } finally {
      setAssigningRoom(false);
    }
  };

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

      <div data-component="AdminInHouse" className="px-[4rem] max-sm:px-[1rem] py-[4rem] flex flex-col items-start gap-[3rem]">
        <PageHeading icon={IoHomeOutline}>In-House Guests</PageHeading>

        <div className={table.card}>
          <div className={table.scroll}>
            <table className={table.el}>
              <thead>
                <tr className={table.headRow}>
                  <th className={table.th}>Guest</th>
                  <th className={`${table.th} hidden md:table-cell`}>Room(s)</th>
                  <th className={`${table.th} hidden md:table-cell`}>Checked In</th>
                  <th className={table.th}>Expected Check-Out</th>
                  <th className={table.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="px-8 py-10 text-center text-xl"><LoadingSpinner /></td></tr>
                ) : error ? (
                  <tr><td colSpan="5" className="px-8 py-10 text-center text-red-600 text-xl">{error}</td></tr>
                ) : reservations.length === 0 ? (
                  <tr><td colSpan="5" className="px-8 py-10 text-center text-xl text-[color:var(--text-color)]/50">No guests currently in-house.</td></tr>
                ) : (
                  reservations.map((r) => (
                    <tr key={r.id} className={table.row}>
                      <td className={`${table.td} font-medium`}>{r.guest_name}</td>
                      <td className={`${table.td} hidden md:table-cell`}>
                        {(r.room_assignments || []).map((ra) => ra.room_number).join(", ") || "Unassigned"}
                      </td>
                      <td className={`${table.td} hidden md:table-cell`}>{formatDate(r.actual_check_in)}</td>
                      <td className={table.td}>
                        <div className="flex items-center gap-3">
                          {formatDate(r.check_out)}
                          {isOverdue(r.check_out) && (
                            <span className="text-sm font-bold uppercase tracking-wide text-red-700 bg-red-100 px-2 py-1 rounded-full whitespace-nowrap">Overdue</span>
                          )}
                        </div>
                      </td>
                      <td className={table.td}>
                        <div className={table.actions}>
                          <button onClick={() => openDetail(r)} className={btn.rowPrimary}>View</button>
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

      {/* ==== In-house guest detail modal ==== */}
      {(selected || detailLoading) && (
        <Modal
          onClose={closeDetail}
          loading={detailLoading || !selected}
          title={selected?.guest_name || ""}
          subtitle={selected ? `${selected.room_type?.name || "N/A"} · Checked in ${formatDate(selected.actual_check_in)}` : ""}
          badge={selected && isOverdue(selected.check_out) && (
            <span className="inline-block px-3 py-1 rounded-full text-lg font-bold leading-tight whitespace-nowrap bg-red-100 text-red-700">Overdue</span>
          )}
          size="md"
          footer={selected && (
            <>
              <button onClick={closeDetail} className={btn.secondary}>Close</button>
              <button onClick={handleCheckOut} disabled={processing} className={btn.success}>
                {processing ? "Processing..." : "Check Out"}
              </button>
            </>
          )}
        >
          {detailLoading || !selected ? (
            <LoadingSpinner size="lg" />
          ) : (
            <>
              {modalError && (
                <p className="text-red-600 text-xl bg-red-50 border border-red-200 rounded-lg px-4 py-3">{modalError}</p>
              )}

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <InfoRow label="Email" value={selected.guest_email || "N/A"} />
                <InfoRow label="Phone" value={selected.phone_number || "N/A"} />
                <InfoRow label="Checked In" value={formatDate(selected.actual_check_in)} />
                <InfoRow label="Expected Check-Out" value={formatDate(selected.check_out)} />
              </div>

              {folioLoading ? (
                <div className="flex justify-center"><LoadingSpinner /></div>
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

              <section className="flex flex-col gap-3 border-t border-[color:var(--text-color)]/10 pt-6">
                <h3 className="text-2xl font-bold text-[color:var(--black)]">Room Assignments</h3>
                <RoomAssignmentPicker
                  reservationId={selected.id}
                  roomsBooked={selected.rooms_booked}
                  initialRoomNumbers={(selected.room_assignments || []).map((ra) => ra.room_number)}
                  onSave={handleAssignRoom}
                  saving={assigningRoom}
                />
              </section>

              <section className="flex flex-col gap-3 border-t border-[color:var(--text-color)]/10 pt-6">
                <h3 className="text-2xl font-bold text-[color:var(--black)]">Extend Stay</h3>
                <div className="flex gap-3 flex-nowrap items-center">
                  <input
                    type="date"
                    value={newCheckOutDate}
                    onChange={(e) => setNewCheckOutDate(e.target.value)}
                    className={field.input}
                  />
                  <button onClick={handleExtendStay} disabled={processing || !newCheckOutDate} className={`${btn.primary} whitespace-nowrap`}>
                    Extend
                  </button>
                </div>
              </section>
            </>
          )}
        </Modal>
      )}
    </>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center gap-4 bg-[color:var(--text-color)]/3 rounded-lg px-5 py-3 text-xl">
      <span className="font-semibold text-[color:var(--text-color)]/50 uppercase tracking-wide text-lg whitespace-nowrap">{label}</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}
