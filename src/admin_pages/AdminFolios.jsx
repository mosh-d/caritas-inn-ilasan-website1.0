import { useState, useEffect, useCallback } from "react";
import { IoClose, IoReceiptOutline } from "react-icons/io5";
import Button from "../components/shared/Button";
import Modal from "../components/shared/Modal";
import PageHeading from "../components/shared/PageHeading";
import StatusBadge from "../components/shared/StatusBadge";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { btn, field, table } from "../components/shared/ui";
import {
  fetchFolios,
  fetchPendingFolios,
  fetchOverdueFolios,
  fetchFolioById,
  addFolioItem,
  closeFolio,
  createFolio,
  recordPayment,
} from "../utils/folios-api";

const ITEM_TYPES = ["room_charge", "service", "product", "penalty", "adjustment"];
const PAYMENT_METHODS = ["cash", "card", "transfer", "pos", "online"];

const emptyItemForm = { description: "", amount: "", tax: "0", discount: "0", item_type: "service", date: "" };
const emptyCreateForm = { reservation_id: "", guest_id: "", total_amount: "0", amount_paid: "0" };
const emptyPaymentForm = { amount: "", payment_method: "cash", notes: "" };

const money = (value) => `₦${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function AdminFoliosPage() {
  const [subTab, setSubTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [folios, setFolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [selectedFolio, setSelectedFolio] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [addingItem, setAddingItem] = useState(false);
  const [closing, setClosing] = useState(false);

  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [creating, setCreating] = useState(false);

  const loadFolios = useCallback(async () => {
    try {
      setLoading(true);
      if (subTab === "pending") {
        const result = await fetchPendingFolios();
        setFolios(Array.isArray(result) ? result : []);
        setTotalPages(1);
      } else if (subTab === "overdue") {
        const result = await fetchOverdueFolios();
        setFolios(Array.isArray(result) ? result : []);
        setTotalPages(1);
      } else {
        const params = { page, limit };
        if (statusFilter !== "all") params.status = statusFilter;
        const result = await fetchFolios(params);
        setFolios(result.data || []);
        setTotalPages(result.totalPages || 1);
      }
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load folios.");
    } finally {
      setLoading(false);
    }
  }, [subTab, statusFilter, page]);

  useEffect(() => { loadFolios(); }, [loadFolios]);
  useEffect(() => setPage(1), [subTab, statusFilter]);

  const openFolioDetail = async (folio) => {
    setDetailLoading(true);
    setItemForm(emptyItemForm);
    setPaymentForm(emptyPaymentForm);
    setPaymentError(null);
    try {
      const full = await fetchFolioById(folio.id);
      setSelectedFolio(full);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load folio.");
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshSelectedFolio = async () => {
    if (!selectedFolio) return;
    const full = await fetchFolioById(selectedFolio.id);
    setSelectedFolio(full);
  };

  const closeFolioDetail = () => {
    setSelectedFolio(null);
    setItemForm(emptyItemForm);
    setPaymentForm(emptyPaymentForm);
    setPaymentError(null);
  };

  const handleAddItem = async () => {
    if (!selectedFolio || !itemForm.description || !itemForm.amount) return;
    try {
      setAddingItem(true);
      await addFolioItem(selectedFolio.id, {
        description: itemForm.description,
        amount: Number(itemForm.amount),
        tax: Number(itemForm.tax || 0),
        discount: Number(itemForm.discount || 0),
        item_type: itemForm.item_type,
        date: itemForm.date || undefined,
      });
      setItemForm(emptyItemForm);
      await refreshSelectedFolio();
      loadFolios();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add item.");
    } finally {
      setAddingItem(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedFolio || !paymentForm.amount) return;
    setPaymentError(null);
    try {
      setRecordingPayment(true);
      await recordPayment({
        folio_id: selectedFolio.id,
        amount: Number(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        notes: paymentForm.notes || undefined,
      });
      setPaymentForm(emptyPaymentForm);
      await refreshSelectedFolio();
      loadFolios();
      setSuccessMessage("Payment recorded.");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      setPaymentError(err.response?.data?.message || "Failed to record payment.");
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleCloseFolio = async () => {
    if (!selectedFolio) return;
    try {
      setClosing(true);
      await closeFolio(selectedFolio.id);
      setSuccessMessage("Folio closed.");
      setTimeout(() => setSuccessMessage(""), 5000);
      closeFolioDetail();
      loadFolios();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to close folio.");
    } finally {
      setClosing(false);
    }
  };

  const handleCreateFolio = async () => {
    try {
      setCreating(true);
      await createFolio({
        reservation_id: Number(createForm.reservation_id),
        guest_id: Number(createForm.guest_id),
        total_amount: Number(createForm.total_amount || 0),
        amount_paid: Number(createForm.amount_paid || 0),
      });
      setSuccessMessage("Folio created.");
      setTimeout(() => setSuccessMessage(""), 5000);
      setIsCreateOpen(false);
      setCreateForm(emptyCreateForm);
      loadFolios();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create folio.");
    } finally {
      setCreating(false);
    }
  };

  const canCloseFolio = selectedFolio && Number(selectedFolio.balance) <= 0;
  const hasOutstandingBalance = selectedFolio && Number(selectedFolio.balance) > 0;
  const hasCreditBalance = selectedFolio && Number(selectedFolio.balance) < 0;

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

      <div data-component="AdminFolios" className="px-[4rem] max-sm:px-[1rem] py-[4rem] flex flex-col items-start gap-[3rem]">
        <div className="w-full flex justify-between items-center max-sm:flex-col max-sm:items-start max-sm:gap-4">
          <PageHeading icon={IoReceiptOutline}>Folios</PageHeading>
          <button onClick={() => setIsCreateOpen(true)} className={`${btn.primary} whitespace-nowrap`}>
            + Create Folio
          </button>
        </div>

        <div className="flex gap-3 text-xl flex-wrap items-center">
          {[
            { key: "all", label: "All" },
            { key: "pending", label: "Outstanding Balance" },
            { key: "overdue", label: "Overdue" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className={`px-6 py-3 rounded-lg font-bold cursor-pointer transition-all ${subTab === t.key ? "bg-[color:var(--emphasis)] text-white" : "bg-black/4 text-[color:var(--text-color)] hover:bg-black/8"}`}
            >
              {t.label}
            </button>
          ))}
          {subTab === "all" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`${field.select} w-auto text-xl!`}
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
            </select>
          )}
        </div>

        <div className={table.card}>
          <div className={table.scroll}>
            <table className={table.el}>
              <thead>
                <tr className={table.headRow}>
                  <th className={table.th}>Folio #</th>
                  <th className={`${table.th} hidden md:table-cell`}>Guest</th>
                  <th className={table.th}>Total</th>
                  <th className={table.th}>Paid</th>
                  <th className={table.th}>Balance</th>
                  <th className={`${table.th} hidden md:table-cell`}>Status</th>
                  <th className={table.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="px-8 py-10 text-center text-xl"><LoadingSpinner /></td></tr>
                ) : error ? (
                  <tr><td colSpan="7" className="px-8 py-10 text-center text-red-600 text-xl">{error}</td></tr>
                ) : folios.length === 0 ? (
                  <tr><td colSpan="7" className="px-8 py-10 text-center text-xl text-[color:var(--text-color)]/50">No folios match filter.</td></tr>
                ) : (
                  folios.map((f) => (
                    <tr key={f.id} className={table.row}>
                      <td className={`${table.td} font-medium`}>{f.folio_number}</td>
                      <td className={`${table.td} hidden md:table-cell`}>
                        {f.guest ? `${f.guest.first_name} ${f.guest.last_name}` : "N/A"}
                      </td>
                      <td className={table.td}>{money(f.total_amount)}</td>
                      <td className={table.td}>{money(f.amount_paid)}</td>
                      <td className={`${table.td} font-bold ${Number(f.balance) > 0 ? "text-red-500" : Number(f.balance) < 0 ? "text-green-600" : ""}`}>
                        {Number(f.balance) < 0 ? `Credit: ${money(Math.abs(Number(f.balance)))}` : money(f.balance)}
                      </td>
                      <td className={`${table.td} hidden md:table-cell`}><StatusBadge status={f.status} /></td>
                      <td className={table.td}>
                        <div className={table.actions}>
                          <button onClick={() => openFolioDetail(f)} className={btn.rowPrimary}>View</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {subTab === "all" && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 w-full mt-6">
            <Button variant="emphasis" onClick={() => setPage(page - 1)} disabled={page === 1} className={page === 1 ? "opacity-30 cursor-not-allowed" : ""}>Previous</Button>
            <span className="text-lg font-medium">Page {page} of {totalPages}</span>
            <Button variant="emphasis" onClick={() => setPage(page + 1)} disabled={page === totalPages} className={page === totalPages ? "opacity-30 cursor-not-allowed" : ""}>Next</Button>
          </div>
        )}
      </div>

      {/* ==== Folio Detail Modal ==== */}
      {(selectedFolio || detailLoading) && (
        <Modal
          onClose={closeFolioDetail}
          loading={detailLoading || !selectedFolio}
          title={selectedFolio?.folio_number || ""}
          subtitle={selectedFolio ? `Reservation: ${selectedFolio.reservation?.booking_reference || selectedFolio.reservation_id}` : ""}
          badge={selectedFolio && <StatusBadge status={selectedFolio.status} />}
          size="lg"
          footer={selectedFolio && (
            <>
              <button onClick={closeFolioDetail} className={btn.secondary}>Close</button>
              {selectedFolio.status !== "closed" && (
                <button
                  onClick={handleCloseFolio}
                  disabled={!canCloseFolio || closing}
                  className={btn.primary}
                  title={!canCloseFolio ? "Settle full balance before closing folio" : ""}
                >
                  {closing ? "Closing..." : "Close Folio"}
                </button>
              )}
            </>
          )}
        >
          {detailLoading || !selectedFolio ? (
            <LoadingSpinner size="lg" />
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryStat label="Guest" value={selectedFolio.guest ? `${selectedFolio.guest.first_name} ${selectedFolio.guest.last_name}` : "N/A"} />
                <SummaryStat label="Total Charged" value={money(selectedFolio.total_amount)} />
                <SummaryStat label="Total Paid" value={money(selectedFolio.amount_paid)} />
                <SummaryStat
                  label="Balance Due"
                  value={hasOutstandingBalance ? money(selectedFolio.balance) : "Settled"}
                  tone={hasOutstandingBalance ? "danger" : "success"}
                />
              </div>
              {hasCreditBalance && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-5 py-4 flex items-center justify-between">
                  <span className="text-green-700 font-bold text-xl">Credit Due to Guest:</span>
                  <span className="text-green-700 font-bold text-2xl">{money(Math.abs(Number(selectedFolio.balance)))}</span>
                </div>
              )}

              {/* Charges */}
              <section className="flex flex-col gap-3 border-t border-[color:var(--text-color)]/10 pt-6">
                <h3 className="text-2xl font-bold text-[color:var(--black)]">Charges</h3>
                {(!selectedFolio.items || selectedFolio.items.length === 0) ? (
                  <p className="text-xl text-[color:var(--text-color)]/60">No charges yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedFolio.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center gap-4 bg-[color:var(--text-color)]/3 rounded-lg px-5 py-3 text-xl">
                        <span className="capitalize truncate">
                          {item.description}
                          <span className="text-[color:var(--text-color)]/50 ml-2">({item.item_type})</span>
                        </span>
                        <span className="font-bold whitespace-nowrap">{money(item.total)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedFolio.status !== "closed" && (
                  <div className="flex flex-col gap-4 mt-2">
                    <p className="text-lg font-semibold uppercase tracking-wide text-[color:var(--text-color)]/50">Add a charge</p>
                    <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                      <div className="flex flex-col gap-2">
                        <label className={field.label}>Description</label>
                        <input type="text" value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} className={field.input} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className={field.label}>Amount (₦)</label>
                        <input type="number" value={itemForm.amount} onChange={(e) => setItemForm({ ...itemForm, amount: e.target.value })} className={field.input} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className={field.label}>Tax</label>
                        <input type="number" value={itemForm.tax} onChange={(e) => setItemForm({ ...itemForm, tax: e.target.value })} className={field.input} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className={field.label}>Discount</label>
                        <input type="number" value={itemForm.discount} onChange={(e) => setItemForm({ ...itemForm, discount: e.target.value })} className={field.input} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className={field.label}>Item Type</label>
                        <select value={itemForm.item_type} onChange={(e) => setItemForm({ ...itemForm, item_type: e.target.value })} className={field.select}>
                          {ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <button onClick={handleAddItem} disabled={addingItem || !itemForm.description || !itemForm.amount} className={`${btn.primary} self-start`}>
                      {addingItem ? "Adding..." : "Add Charge"}
                    </button>
                  </div>
                )}
              </section>

              {/* Payments */}
              <section className="flex flex-col gap-3 border-t border-[color:var(--text-color)]/10 pt-6">
                <h3 className="text-2xl font-bold text-[color:var(--black)]">Payments</h3>
                {(!selectedFolio.payments || selectedFolio.payments.length === 0) ? (
                  <p className="text-xl text-[color:var(--text-color)]/60">No payments recorded yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedFolio.payments.map((p) => (
                      <div key={p.id} className="flex justify-between items-center gap-4 bg-[color:var(--text-color)]/3 rounded-lg px-5 py-3 text-xl">
                        <div className="min-w-0">
                          <span className="capitalize font-medium">{p.payment_method}</span>
                          {p.notes && <span className="text-[color:var(--text-color)]/50 ml-2">· {p.notes}</span>}
                          <span className="block text-base text-[color:var(--text-color)]/40">{p.payment_reference} · {formatDate(p.payment_date)}</span>
                        </div>
                        <span className="text-green-700 font-bold whitespace-nowrap">{money(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedFolio.status !== "closed" && (
                  <div className="flex flex-col gap-4 mt-2">
                    {paymentError && <p className="text-red-600 text-xl bg-red-50 border border-red-200 rounded-lg px-4 py-3">{paymentError}</p>}
                    <p className="text-lg font-semibold uppercase tracking-wide text-[color:var(--text-color)]/50">Record a payment</p>
                    <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                      <div className="flex flex-col gap-2">
                        <label className={field.label}>Amount (₦) *</label>
                        <input
                          type="number"
                          placeholder={hasOutstandingBalance ? `Balance due: ${money(selectedFolio.balance)}` : hasCreditBalance ? `Credit on account: ${money(Math.abs(Number(selectedFolio.balance)))}` : "0"}
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                          className={field.input}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className={field.label}>Method *</label>
                        <select value={paymentForm.payment_method} onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })} className={field.select}>
                          {PAYMENT_METHODS.map((m) => <option key={m} value={m} className="capitalize">{m}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2 max-sm:col-span-1 flex flex-col gap-2">
                        <label className={field.label}>Notes</label>
                        <input
                          type="text"
                          placeholder="e.g. cash received at front desk"
                          value={paymentForm.notes}
                          onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                          className={field.input}
                        />
                      </div>
                    </div>
                    <button onClick={handleRecordPayment} disabled={recordingPayment || !paymentForm.amount} className={`${btn.success} self-start`}>
                      {recordingPayment ? "Recording..." : "Record Payment"}
                    </button>
                  </div>
                )}
              </section>
            </>
          )}
        </Modal>
      )}

      {/* ==== Create Folio Modal ==== */}
      {isCreateOpen && (
        <Modal
          onClose={() => setIsCreateOpen(false)}
          title="Create Folio"
          subtitle="For backfilling a folio onto an existing reservation. New bookings get one automatically on confirmation."
          size="sm"
          footer={
            <>
              <button onClick={() => setIsCreateOpen(false)} className={btn.secondary}>Cancel</button>
              <button onClick={handleCreateFolio} disabled={creating || !createForm.reservation_id || !createForm.guest_id} className={btn.primary}>
                {creating ? "Creating..." : "Create Folio"}
              </button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <div className="flex flex-col gap-2">
              <label className={field.label}>Reservation ID *</label>
              <input type="number" value={createForm.reservation_id} onChange={(e) => setCreateForm({ ...createForm, reservation_id: e.target.value })} className={field.input} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={field.label}>Guest ID *</label>
              <input type="number" value={createForm.guest_id} onChange={(e) => setCreateForm({ ...createForm, guest_id: e.target.value })} className={field.input} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={field.label}>Total Amount</label>
              <input type="number" value={createForm.total_amount} onChange={(e) => setCreateForm({ ...createForm, total_amount: e.target.value })} className={field.input} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={field.label}>Amount Paid</label>
              <input type="number" value={createForm.amount_paid} onChange={(e) => setCreateForm({ ...createForm, amount_paid: e.target.value })} className={field.input} />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function SummaryStat({ label, value, tone }) {
  const valueColor =
    tone === "danger" ? "text-red-600" : tone === "success" ? "text-green-700" : "text-[color:var(--black)]";
  return (
    <div className="bg-[color:var(--text-color)]/3 rounded-lg px-5 py-4">
      <p className="text-lg font-semibold uppercase tracking-wide text-[color:var(--text-color)]/50 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueColor} truncate`}>{value}</p>
    </div>
  );
}
