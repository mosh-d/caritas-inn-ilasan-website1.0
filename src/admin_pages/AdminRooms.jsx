import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { IoClose, IoBedOutline } from "react-icons/io5";
import Modal from "../components/shared/Modal";
import PageHeading from "../components/shared/PageHeading";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { btn, field, table } from "../components/shared/ui";
import { useWebSocketContext } from "../context/WebSocketContext";
import { canManageRoomPrices, getAuthHeaders } from "../utils/auth";
import { SERVER_BASE_URL } from "../utils/server-config";

// ─── API Setup ────────────────────────────────────────────────────────────────

let API_BASE_URL = SERVER_BASE_URL;

// ─── Ilasan branch_id = 4 (Caritas Inn Ilasan) ───────────────────────────────
// Source of truth: auth.js, room-data.js, WebSocketContext.jsx all use BRANCH_ID = 4
const BRANCH_ID = 4;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getBaseUrl = () =>
  API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

const formatPrice = (price) =>
  Number(price).toLocaleString("en-NG", { minimumFractionDigits: 0 });

// ─── Add Room Modal ────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "",
  summary: "",
  amenities: "",
  adult_capacity: "",
  child_capacity: "",
  currency_symbol: "₦",
  base_rate: "",
  max_capacity: "",
};

function AddRoomModal({ onClose, onSuccess, onError }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    // Basic validation
    if (
      !form.name ||
      !form.summary ||
      !form.amenities ||
      !form.adult_capacity ||
      !form.child_capacity ||
      !form.base_rate ||
      !form.max_capacity
    ) {
      onError("Please fill in all required fields.");
      return;
    }

    const payload = {
      branch_id: BRANCH_ID,
      name: form.name.trim(),
      summary: form.summary.trim(),
      amenities: form.amenities.trim(),
      adult_capacity: Number(form.adult_capacity),
      child_capacity: Number(form.child_capacity),
      currency_symbol: form.currency_symbol || "₦",
      base_rate: Number(form.base_rate),
      max_capacity: Number(form.max_capacity),
    };

    console.log("AdminRooms: Submitting new room type:", payload);
    setSubmitting(true);

    try {
      const res = await axios.post(`${getBaseUrl()}/api/rooms/type`, payload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
      console.log("AdminRooms: Add room response:", res.data);
      onSuccess(res.data?.message || "Room type added successfully!");
      onClose();
    } catch (err) {
      console.error("AdminRooms: Error adding room type:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      onError(
        err.response?.data?.message ||
          "Failed to add room type. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      title="Add New Room Type"
      subtitle="Creates a bookable room category with its own rate and inventory."
      size="md"
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.secondary}>Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={submitting} className={btn.primary}>
            {submitting ? "Adding..." : "Add Room"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className={field.label}>Room Type Name *</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Diplomatic Suite"
            className={field.input}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className={field.label}>Summary *</label>
          <textarea
            name="summary"
            value={form.summary}
            onChange={handleChange}
            placeholder="Brief description of the room..."
            rows={3}
            className={field.textarea}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className={field.label}>Amenities *</label>
          <input
            type="text"
            name="amenities"
            value={form.amenities}
            onChange={handleChange}
            placeholder="e.g. WiFi, AC, Jacuzzi, Breakfast, Smart TV"
            className={field.input}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <div className="flex flex-col gap-2">
            <label className={field.label}>Adult Capacity *</label>
            <input
              type="number"
              name="adult_capacity"
              value={form.adult_capacity}
              onChange={handleChange}
              min="1"
              placeholder="e.g. 2"
              className={field.input}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className={field.label}>Child Capacity *</label>
            <input
              type="number"
              name="child_capacity"
              value={form.child_capacity}
              onChange={handleChange}
              min="0"
              placeholder="e.g. 2"
              className={field.input}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <div className="flex flex-col gap-2">
            <label className={field.label}>Currency Symbol</label>
            <input
              type="text"
              name="currency_symbol"
              value={form.currency_symbol}
              onChange={handleChange}
              placeholder="₦"
              className={field.input}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className={field.label}>Room Rate/Price *</label>
            <input
              type="number"
              name="base_rate"
              value={form.base_rate}
              onChange={handleChange}
              min="0"
              placeholder="e.g. 85000"
              className={field.input}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className={field.label}>Max Capacity (no. of physical rooms) *</label>
          <input
            type="number"
            name="max_capacity"
            value={form.max_capacity}
            onChange={handleChange}
            min="1"
            placeholder="e.g. 5"
            className={field.input}
          />
        </div>

        {/* Allow Enter key to submit */}
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Modal>
  );
}

// ─── View / Edit Room Modal ────────────────────────────────────────────────────

function ViewRoomModal({
  room,
  onClose,
  onSuccess,
  onError,
  onRoomDeleted,
  onRefreshRoom,
  canManagePrices,
}) {
  const [priceInput, setPriceInput] = useState(String(room.base_rate ?? ""));
  const [capacityInput, setCapacityInput] = useState(
    String(room.max_capacity ?? "")
  );
  const [updatingPrice, setUpdatingPrice] = useState(false);
  const [updatingCapacity, setUpdatingCapacity] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Safety fetches after data update - ensures consistency
  const runSafetyFetches = async () => {
    console.log(`🔍 [ViewRoomModal] Starting safety fetches for room ${room.room_type_id}...`);

    // Lock UI during entire safety fetch period (6 seconds total)
    setRefreshing(true);
    console.log('🔒 [ViewRoomModal] UI locked - safety fetches in progress');

    // First refresh after 500ms (immediate)
    setTimeout(async () => {
      console.log(`🔄 [ViewRoomModal] First safety fetch for room ${room.room_type_id}...`);
      const freshData = await onRefreshRoom(room.room_type_id);
      if (freshData) {
        console.log(`✅ [ViewRoomModal] First safety fetch complete, updating capacity from ${capacityInput} to ${freshData.max_capacity}`);
        setCapacityInput(String(freshData.max_capacity ?? ""));
        setPriceInput(String(freshData.base_rate ?? ""));
      }
    }, 500);

    // Second refresh after 3s (ensure consistency)
    setTimeout(async () => {
      console.log(`🔄 [ViewRoomModal] Second safety fetch for room ${room.room_type_id}...`);
      const freshData = await onRefreshRoom(room.room_type_id);
      if (freshData) {
        console.log(`✅ [ViewRoomModal] Second safety fetch complete, updating capacity to ${freshData.max_capacity}`);
        setCapacityInput(String(freshData.max_capacity ?? ""));
        setPriceInput(String(freshData.base_rate ?? ""));
      }
    }, 3000);

    // Final refresh after 6s (ensure consistency) - then unlock UI
    setTimeout(async () => {
      console.log(`🔄 [ViewRoomModal] Final safety fetch for room ${room.room_type_id}...`);
      const freshData = await onRefreshRoom(room.room_type_id);
      if (freshData) {
        console.log(`✅ [ViewRoomModal] Final safety fetch complete, capacity confirmed as ${freshData.max_capacity}`);
        setCapacityInput(String(freshData.max_capacity ?? ""));
        setPriceInput(String(freshData.base_rate ?? ""));
      }

      // Unlock UI after all safety fetches complete
      setRefreshing(false);
      console.log('🔓 [ViewRoomModal] UI unlocked - safety fetches complete');
    }, 6000);
  };

  const handleUpdatePrice = async () => {
    if (!canManagePrices) {
      onError("Only managers can update room prices.");
      return;
    }

    const newPrice = Number(priceInput);
    if (isNaN(newPrice) || newPrice <= 0) {
      onError("Please enter a valid price.");
      return;
    }

    console.log(
      `AdminRooms: Updating price for room_type_id=${room.room_type_id} to ${newPrice}`
    );
    setUpdatingPrice(true);

    try {
      const res = await axios.patch(
        `${getBaseUrl()}/api/rooms/price`,
        { room_type_id: room.room_type_id, new_price: newPrice },
        {
          headers: getAuthHeaders(),
          withCredentials: true,
        }
      );
      console.log("AdminRooms: Update price response:", res.data);
      onSuccess(res.data?.message || "Price updated successfully!");
      // Run safety fetches to ensure data consistency instead of closing immediately
      runSafetyFetches();
    } catch (err) {
      console.error("AdminRooms: Error updating price:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      onError(
        err.response?.data?.message ||
          "Failed to update price. Please try again."
      );
    } finally {
      setUpdatingPrice(false);
    }
  };

  const handleUpdateCapacity = async () => {
    const newCapacity = Number(capacityInput);
    if (isNaN(newCapacity) || newCapacity < 1) {
      onError("Please enter a valid capacity (minimum 1).");
      return;
    }

    console.log(
      `AdminRooms: Updating capacity for room_type_id=${room.room_type_id} to ${newCapacity}`
    );
    setUpdatingCapacity(true);

    try {
      const res = await axios.patch(
        `${getBaseUrl()}/api/rooms/capacity`,
        { room_type_id: room.room_type_id, new_capacity: newCapacity },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      console.log("AdminRooms: Update capacity response:", res.data);

      // Check for partial-success capacity warning in message
      const msg = res.data?.message || "";
      const isPartialSuccess =
        msg.toLowerCase().includes("warn") ||
        msg.toLowerCase().includes("flag") ||
        msg.toLowerCase().includes("auto-deletion");

      console.log(
        `AdminRooms: Capacity update result — partial success: ${isPartialSuccess}, message: ${msg}`
      );

      onSuccess(msg || "Capacity updated successfully!");
      // Run safety fetches to ensure data consistency instead of closing immediately
      runSafetyFetches();
    } catch (err) {
      console.error("AdminRooms: Error updating capacity:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      onError(
        err.response?.data?.message ||
          "Failed to update capacity. Please try again."
      );
    } finally {
      setUpdatingCapacity(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    console.log(
      `AdminRooms: Deleting room type id=${room.room_type_id} (${room.room_type_name})`
    );
    setDeleting(true);

    try {
      const res = await axios.delete(
        `${getBaseUrl()}/api/rooms/type/${room.room_type_id}`,
        { withCredentials: true }
      );
      console.log("AdminRooms: Delete room response:", res.data);
      onRoomDeleted(
        room.room_type_id,
        res.data?.message || "Room type deleted successfully!"
      );
      onClose();
    } catch (err) {
      console.error("AdminRooms: Error deleting room type:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      onError(
        err.response?.data?.message ||
          "Failed to delete room type. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      title={room.room_type_name}
      subtitle={`${room.available_rooms ?? "N/A"} room(s) currently available`}
      size="md"
      footer={
        <>
          <button
            onClick={() => {
              console.log(
                `AdminRooms: Delete Room clicked for room_type_id=${room.room_type_id} (${room.room_type_name}) — showing confirmation dialog`
              );
              setConfirmDelete(true);
            }}
            disabled={deleting}
            className={`${btn.danger} mr-auto`}
          >
            Delete Room
          </button>
          <button onClick={onClose} className={btn.secondary}>Close</button>
        </>
      }
    >
      {/* Read-only overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Available Rooms" value={room.available_rooms ?? "N/A"} />
        <StatCard label="Adult Capacity" value={room.adult_capacity ?? "N/A"} />
        <StatCard label="Child Capacity" value={room.child_capacity ?? "N/A"} />
      </div>

      {room.summary && (
        <section className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold uppercase tracking-wide text-[color:var(--text-color)]/50">Summary</h3>
          <p className="text-xl leading-relaxed">{room.summary}</p>
        </section>
      )}

      {room.amenities && (
        <section className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold uppercase tracking-wide text-[color:var(--text-color)]/50">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {String(room.amenities).split(",").map((a, i) => (
              <span key={i} className="text-lg bg-[color:var(--text-color)]/5 px-4 py-1.5 rounded-full">
                {a.trim()}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Editable: Base Price */}
      <section className="flex flex-col gap-3 border-t border-[color:var(--text-color)]/10 pt-6">
        <h3 className="text-2xl font-bold text-[color:var(--black)]">Base Price (₦)</h3>
        {canManagePrices ? (
          <div className="flex gap-3 flex-nowrap items-center">
            <input
              type="number"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className={field.input}
              min="0"
            />
            <button
              onClick={handleUpdatePrice}
              disabled={updatingPrice}
              className={`${btn.primary} whitespace-nowrap`}
            >
              {updatingPrice ? "..." : "Update"}
            </button>
          </div>
        ) : (
          <p className="text-2xl font-bold">NGN {formatPrice(room.base_rate ?? 0)}</p>
        )}
      </section>

      {/* Editable: Max Capacity (physical rooms) */}
      <section className="flex flex-col gap-3 border-t border-[color:var(--text-color)]/10 pt-6">
        <h3 className="text-2xl font-bold text-[color:var(--black)]">Max Capacity (physical rooms)</h3>
        <div className="flex gap-3 flex-nowrap items-center">
          <input
            type="number"
            value={capacityInput}
            onChange={(e) => setCapacityInput(e.target.value)}
            className={`${field.input} ${refreshing ? "opacity-70" : ""}`}
            disabled={refreshing}
            min="1"
          />
          <button
            onClick={handleUpdateCapacity}
            disabled={updatingCapacity || refreshing}
            className={`${btn.primary} whitespace-nowrap`}
          >
            {updatingCapacity ? "..." : refreshing ? "Syncing..." : "Update"}
          </button>
        </div>
      </section>

      {/* ── Delete Confirmation Dialog ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop (darker layer on top of the already-dimmed modal) */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setConfirmDelete(false)}
          />

          {/* Dialog box */}
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-md w-full p-10 flex flex-col gap-6 text-center font-primary">
            {/* Warning icon */}
            <div className="text-red-500 flex justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-16 h-16"
              >
                <path
                  fillRule="evenodd"
                  d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div>
              <h3 className="text-3xl font-bold text-[color:var(--text-color)] tracking-wide mb-2">
                Delete Room Type?
              </h3>
              <p className="text-xl text-[color:var(--text-color)]/70 leading-relaxed">
                You are about to permanently remove{" "}
                <span className="font-bold text-[color:var(--text-color)]">
                  {room.room_type_name}
                </span>{" "}
                from the system. This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-4 justify-center pt-2">
              <button
                onClick={() => {
                  console.log("AdminRooms: Delete confirmation cancelled by user");
                  setConfirmDelete(false);
                }}
                disabled={deleting}
                className={btn.secondary}
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className={btn.dangerSolid}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-[color:var(--text-color)]/3 rounded-lg px-5 py-4">
      <p className="text-lg font-semibold uppercase tracking-wide text-[color:var(--text-color)]/50 mb-1">{label}</p>
      <p className="text-2xl font-bold text-[color:var(--black)]">{value}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminRoomsPage() {
  const canManagePrices = canManageRoomPrices();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Inline price editing per row (desktop)
  const [inlinePriceEdits, setInlinePriceEdits] = useState({});
  const [updatingInlinePrice, setUpdatingInlinePrice] = useState(null);

  // WebSocket update lock - prevents editing during safety fetches
  const [webSocketUpdating, setWebSocketUpdating] = useState(false);

  const showSuccess = (msg) => {
    console.log("AdminRooms: ✅ Success:", msg);
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 6000);
  };

  const showError = (msg) => {
    console.error("AdminRooms: ❌ Error shown to user:", msg);
    setError(msg);
    setTimeout(() => setError(null), 6000);
  };

  const fetchRooms = async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) setLoading(true);

      console.log(
        `AdminRooms: Fetching rooms via POST /api/rooms/details for branch_id=${BRANCH_ID} from: ${getBaseUrl()}`
      );

      // ✅ Correct endpoint — mirrors room-data.js / fetchRoomDetails()
      const res = await axios.post(
        `${getBaseUrl()}/api/rooms/details`,
        { branch_id: BRANCH_ID },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      console.log("AdminRooms: Raw API response:", res.data);

      // Response shape: { room_types: [...], ... } — same as AdminOverview uses
      const roomList = Array.isArray(res.data?.room_types)
        ? res.data.room_types
        : [];

      console.log(`AdminRooms: Extracted ${roomList.length} room type(s):`, roomList);

      setRooms(roomList);
      setError(null);

      // Initialise inline price state from fetched data
      const priceMap = {};
      roomList.forEach((r) => {
        priceMap[r.room_type_id] = String(r.base_rate ?? "");
      });
      console.log("AdminRooms: Initialised inline price map:", priceMap);
      setInlinePriceEdits(priceMap);
    } catch (err) {
      console.error("AdminRooms: Error fetching rooms:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      if (!isBackgroundRefresh) {
        setError("Failed to load rooms. Please refresh the page.");
      }
    } finally {
      if (!isBackgroundRefresh) setLoading(false);
    }
  };

  // Fetch single room details by ID (for modal safety fetches)
  const fetchRoomById = async (roomTypeId) => {
    try {
      console.log(
        `AdminRooms: Fetching room details for room_type_id=${roomTypeId} from: ${getBaseUrl()}`
      );

      const res = await axios.post(
        `${getBaseUrl()}/api/rooms/details`,
        { branch_id: BRANCH_ID },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      const roomList = Array.isArray(res.data?.room_types)
        ? res.data.room_types
        : [];

      const updatedRoom = roomList.find((r) => r.room_type_id === roomTypeId);

      if (updatedRoom) {
        console.log(`AdminRooms: Found updated room data:`, updatedRoom);
        return updatedRoom;
      }

      console.log(`AdminRooms: Room ${roomTypeId} not found in response`);
      return null;
    } catch (err) {
      console.error("AdminRooms: Error fetching room by ID:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      return null;
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(() => fetchRooms(true), 60000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket handler - refetch data when rooms are updated (with multiple safety fetches for reliability)
  const handleRoomsUpdated = useCallback((data) => {
    console.log('📡 [AdminRooms] WebSocket update received at:', new Date().toISOString());
    console.log('📡 [AdminRooms] WebSocket data:', data);

    // Lock editing during WebSocket updates
    setWebSocketUpdating(true);
    console.log('🔒 [AdminRooms] Editing locked - WebSocket update in progress');

    // First fetch after 2 seconds (immediate response)
    setTimeout(() => {
      console.log('🔄 [AdminRooms] Starting first safety fetch...');
      fetchRooms(true);
      console.log('🔄 [AdminRooms] First safety fetch triggered');
    }, 2000);

    // Second verification fetch after 6 seconds (ensure consistency)
    setTimeout(() => {
      console.log('🔄 [AdminRooms] Starting verification fetch...');
      fetchRooms(true);
      console.log('🔄 [AdminRooms] Verification fetch triggered');
    }, 6000);

    // Final verification fetch after 10 seconds (ensure consistency) - then unlock editing
    setTimeout(() => {
      console.log('🔄 [AdminRooms] Starting final safety fetch...');
      fetchRooms(true);
      console.log('🔄 [AdminRooms] Final safety fetch triggered');

      // Unlock editing after all safety fetches complete
      setWebSocketUpdating(false);
      console.log('🔓 [AdminRooms] Editing unlocked - WebSocket update complete');
    }, 10000);
  }, []);

  // Subscribe to WebSocket updates
  const { subscribe } = useWebSocketContext();

  useEffect(() => {
    const unsubscribe = subscribe(handleRoomsUpdated);
    return unsubscribe;
  }, [handleRoomsUpdated, subscribe]);

  // Handle inline price update (desktop table)
  const handleInlinePriceUpdate = async (room) => {
    if (!canManagePrices) {
      showError("Only managers can update room prices.");
      return;
    }

    const newPrice = Number(inlinePriceEdits[room.room_type_id]);
    if (isNaN(newPrice) || newPrice <= 0) {
      showError("Please enter a valid price.");
      return;
    }

    console.log(
      `AdminRooms: [Inline] Updating price for room_type_id=${room.room_type_id} to ${newPrice}`
    );
    setUpdatingInlinePrice(room.room_type_id);

    try {
      const res = await axios.patch(
        `${getBaseUrl()}/api/rooms/price`,
        { room_type_id: room.room_type_id, new_price: newPrice },
        {
          headers: getAuthHeaders(),
          withCredentials: true,
        }
      );
      console.log("AdminRooms: [Inline] Update price response:", res.data);
      showSuccess(res.data?.message || "Price updated successfully!");
      fetchRooms(true);
    } catch (err) {
      console.error("AdminRooms: [Inline] Error updating price:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      showError(
        err.response?.data?.message ||
          "Failed to update price. Please try again."
      );
    } finally {
      setUpdatingInlinePrice(null);
    }
  };

  const handleRoomDeleted = (roomTypeId, msg) => {
    console.log(`AdminRooms: Room type ${roomTypeId} deleted from local state`);
    setRooms((prev) => prev.filter((r) => r.room_type_id !== roomTypeId));
    showSuccess(msg);
  };

  const handleAddSuccess = (msg) => {
    showSuccess(msg);
    fetchRooms();
  };

  return (
    <>
      {/* ── Notifications ── */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-xl z-50 flex items-center gap-4 max-w-sm shadow-lg">
          <span className="text-xl">{successMessage}</span>
          <button
            onClick={() => setSuccessMessage("")}
            className="text-green-700 hover:text-green-900 flex-shrink-0 cursor-pointer"
          >
            <IoClose size={20} />
          </button>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-xl z-50 flex items-center gap-4 max-w-sm shadow-lg">
          <span className="text-xl">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900 flex-shrink-0 cursor-pointer"
          >
            <IoClose size={20} />
          </button>
        </div>
      )}

      {/* ── Page ── */}
      <div
        data-component="AdminRooms"
        className="px-[4rem] max-sm:px-[1rem] py-[4rem] flex flex-col items-start gap-[3rem]"
      >
        <div className="w-full flex justify-between items-center max-sm:flex-col max-sm:items-start max-sm:gap-4">
          <PageHeading icon={IoBedOutline}>Rooms</PageHeading>
          <button
            onClick={() => {
              console.log("AdminRooms: Opening Add Room modal");
              setShowAddModal(true);
            }}
            className={`${btn.primary} whitespace-nowrap`}
          >
            + Add Room
          </button>
        </div>

        {/* ── Table ── */}
        <div className={table.card}>
          <div className={table.scroll}>
            <table className={table.el}>
              <thead>
                <tr className={table.headRow}>
                  <th className={table.th}>Room Type</th>
                  <th className={`${table.th} hidden md:table-cell`}>Price (₦)</th>
                  <th className={table.th}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="3" className="px-8 py-10 text-center text-xl"><LoadingSpinner /></td>
                  </tr>
                ) : rooms.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-8 py-10 text-center text-xl text-[color:var(--text-color)]/50">
                      No rooms found for this branch.
                    </td>
                  </tr>
                ) : (
                  rooms.map((room) => (
                    <tr key={room.room_type_id} className={table.row}>
                      {/* Room Type Name */}
                      <td className={`${table.td} font-medium`}>
                        {room.room_type_name}
                      </td>

                      {/* Desktop: Inline price input + Update button */}
                      <td className={`${table.td} hidden md:table-cell`}>
                        {canManagePrices ? (
                          <div className="flex items-center gap-2 flex-nowrap">
                            <input
                              type="number"
                              value={inlinePriceEdits[room.room_type_id] ?? ""}
                              onChange={(e) =>
                                setInlinePriceEdits((prev) => ({
                                  ...prev,
                                  [room.room_type_id]: e.target.value,
                                }))
                              }
                              className={`${field.input} text-xl! w-[14rem] py-2!`}
                              min="0"
                              disabled={webSocketUpdating}
                            />
                            <button
                              onClick={() => handleInlinePriceUpdate(room)}
                              disabled={updatingInlinePrice === room.room_type_id || webSocketUpdating}
                              className={btn.rowPrimary}
                            >
                              {updatingInlinePrice === room.room_type_id
                                ? "..."
                                : webSocketUpdating
                                ? "Syncing..."
                                : "Update"}
                            </button>
                          </div>
                        ) : (
                          <span>NGN {formatPrice(room.base_rate ?? 0)}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className={table.td}>
                        <div className={table.actions}>
                          <button
                            onClick={() => {
                              console.log(
                                "AdminRooms: Opening view modal for room:",
                                room
                              );
                              setSelectedRoom(room);
                            }}
                            className={btn.rowPrimary}
                          >
                            View
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
      </div>

      {/* ── View/Edit Room Modal ── */}
      {selectedRoom && (
        <ViewRoomModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onSuccess={showSuccess}
          onError={showError}
          onRoomDeleted={(id, msg) => {
            handleRoomDeleted(id, msg);
            setSelectedRoom(null);
          }}
          onRefreshRoom={fetchRoomById}
          canManagePrices={canManagePrices}
        />
      )}

      {/* ── Add Room Modal ── */}
      {showAddModal && (
        <AddRoomModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
          onError={showError}
        />
      )}
    </>
  );
}
