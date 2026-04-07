import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { playdateService } from "../services";
import { AvailabilitySlot, PlaydateRequest } from "../types";
import { WeekCalendar, weekMonday, isoDate } from "../components/playdates/WeekCalendar";
import { MonthCalendar } from "../components/playdates/MonthCalendar";
import { TimePicker } from "../components/playdates/TimePicker";
import { useAuthStore } from "../contexts/authStore";
import { Button, Spinner } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { Modal } from "../components/ui/Modal";
import toast from "react-hot-toast";

// ── Slot form (add / edit) ────────────────────────────────────────

interface SlotFormProps {
  initialDate?: string;
  existing?: AvailabilitySlot;
  onSaved: () => void;
  onCancel: () => void;
  onDeleted?: () => void;
}

const SlotForm: React.FC<SlotFormProps> = ({
  initialDate,
  existing,
  onSaved,
  onCancel,
  onDeleted,
}) => {
  const [date, setDate] = useState(existing?.date ?? initialDate ?? isoDate(new Date()));
  const [startTime, setStartTime] = useState(existing?.start_time ?? "10:00");
  const [endTime, setEndTime] = useState(existing?.end_time ?? "11:00");
  const [status, setStatus] = useState<"free" | "busy">(existing?.status ?? "free");
  const [note, setNote] = useState(existing?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (startTime >= endTime) {
      toast.error("End time must be after start time");
      return;
    }
    setSaving(true);
    try {
      if (existing) {
        await playdateService.updateSlot(existing.id, { date, start_time: startTime, end_time: endTime, status, note: note || undefined });
        toast.success("Slot updated");
      } else {
        await playdateService.addSlot({ date, start_time: startTime, end_time: endTime, status, note: note || undefined });
        toast.success("Slot added");
      }
      onSaved();
    } catch {
      toast.error("Failed to save slot");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existing) return;
    setDeleting(true);
    try {
      await playdateService.deleteSlot(existing.id);
      toast.success("Slot removed");
      onDeleted?.();
    } catch {
      toast.error("Failed to delete slot");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-[0.85rem] font-semibold mb-1">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full px-3 py-2 rounded-lg border-[1.5px] border-border text-[0.92rem] font-body outline-none focus:border-brand"
        />
      </div>

      <div className="flex gap-4 flex-wrap">
        <TimePicker label="Start time" value={startTime} onChange={setStartTime} />
        <TimePicker label="End time" value={endTime} onChange={setEndTime} />
      </div>

      <div>
        <label className="block text-[0.85rem] font-semibold mb-1">Status</label>
        <div className="flex gap-3">
          {(["free", "busy"] as const).map((s) => (
            <label
              key={s}
              className={[
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border-[1.5px] cursor-pointer text-[0.88rem] font-semibold transition-colors",
                status === s
                  ? s === "free"
                    ? "border-brand bg-brand-light text-brand-dark"
                    : "border-border bg-bg text-muted"
                  : "border-border text-muted",
              ].join(" ")}
            >
              <input
                type="radio"
                name="status"
                value={s}
                checked={status === s}
                onChange={() => setStatus(s)}
                className="sr-only"
              />
              {s === "free" ? "🟢 Free" : "🔴 Busy"}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[0.85rem] font-semibold mb-1">Note <span className="text-muted font-normal">(optional)</span></label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Park visit, indoor only…"
          className="w-full px-3 py-2 rounded-lg border-[1.5px] border-border text-[0.92rem] font-body outline-none focus:border-brand"
        />
      </div>

      <div className="flex gap-2 justify-between">
        {existing && (
          <Button type="button" variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
            Delete
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" loading={saving}>{existing ? "Save" : "Add Slot"}</Button>
        </div>
      </div>
    </form>
  );
};

// ── Request card ──────────────────────────────────────────────────

interface RequestCardProps {
  request: PlaydateRequest;
  myId: string;
  onUpdate: () => void;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, myId, onUpdate }) => {
  const isOwner = request.owner_id === myId;
  const [responding, setResponding] = useState(false);

  const respond = async (status: "accepted" | "declined") => {
    setResponding(true);
    try {
      await playdateService.respond(request.id, status);
      toast.success(status === "accepted" ? "Playdate accepted! 🎉" : "Request declined");
      onUpdate();
    } catch {
      toast.error("Failed to respond");
    } finally {
      setResponding(false);
    }
  };

  const statusBadge = {
    pending: "bg-yellow-100 text-yellow-800",
    accepted: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
  }[request.status];

  const otherName = isOwner ? request.requester_name : request.owner_name;
  const otherThumb = isOwner ? request.requester_thumbnail : request.owner_thumbnail;
  const dateStr = format(new Date(request.slot_date), "EEE, MMM d");

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border-[1.5px] border-border bg-surface">
      <Avatar src={otherThumb} name={otherName} size={38} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-[0.9rem]">{otherName}</span>
          <span className={`text-[0.72rem] font-bold px-2 py-[2px] rounded-full ${statusBadge}`}>
            {request.status}
          </span>
        </div>
        <div className="text-muted text-[0.8rem] mt-[2px]">
          {isOwner ? "Requested" : "You requested"} · {dateStr} · {request.slot_start_time}–{request.slot_end_time}
        </div>
        {request.message && (
          <div className="text-[0.82rem] mt-1 italic text-muted">"{request.message}"</div>
        )}
        <div className="text-[0.72rem] text-muted mt-[2px]">
          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
        </div>
        {isOwner && request.status === "pending" && (
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={() => respond("accepted")} loading={responding}>Accept</Button>
            <Button size="sm" variant="danger" onClick={() => respond("declined")} loading={responding}>Decline</Button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────

export const PlaydatesPage: React.FC = () => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [calView, setCalView] = useState<"week" | "month">("week");
  const [weekStart, setWeekStart] = useState(() => weekMonday(new Date()));
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | undefined>();

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["availability", user?.id],
    queryFn: () => playdateService.getAvailability(user!.id),
    enabled: !!user,
  });

  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["playdate-requests"],
    queryFn: playdateService.getRequests,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["availability", user?.id] });
    qc.invalidateQueries({ queryKey: ["playdate-requests"] });
  };

  const openAdd = (date?: string) => {
    setEditingSlot(undefined);
    setSelectedDate(date);
    setSlotModalOpen(true);
  };

  const openEdit = (slot: AvailabilitySlot) => {
    setEditingSlot(slot);
    setSelectedDate(undefined);
    setSlotModalOpen(true);
  };

  const closeModal = () => {
    setSlotModalOpen(false);
    setEditingSlot(undefined);
    setSelectedDate(undefined);
  };

  const pendingIncoming = requests.filter(
    (r) => r.owner_id === user?.id && r.status === "pending"
  );
  const others = requests.filter(
    (r) => !(r.owner_id === user?.id && r.status === "pending")
  );

  const prevPeriod = () => {
    if (calView === "week") {
      const d = new Date(weekStart);
      d.setDate(d.getDate() - 7);
      setWeekStart(d);
    } else {
      const d = new Date(monthDate);
      d.setMonth(d.getMonth() - 1);
      setMonthDate(d);
    }
  };

  const nextPeriod = () => {
    if (calView === "week") {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + 7);
      setWeekStart(d);
    } else {
      const d = new Date(monthDate);
      d.setMonth(d.getMonth() + 1);
      setMonthDate(d);
    }
  };

  const goToToday = () => {
    setWeekStart(weekMonday(new Date()));
    setMonthDate(new Date());
  };

  const periodLabel = calView === "week"
    ? `${format(weekStart, "MMM d")} – ${format(new Date(weekStart.getTime() + 6 * 86400000), "MMM d, yyyy")}`
    : format(monthDate, "MMMM yyyy");

  return (
    <main className="max-w-[1400px] mx-auto px-4 py-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-[1.8rem] font-medium text-brand-dark">Playdates</h1>
          <p className="text-muted mt-1">Manage your availability and playdate requests</p>
        </div>
        <Button onClick={() => openAdd()}>+ Add Slot</Button>
      </div>

      {/* Two-column layout: calendar + requests sidebar */}
      <div className="flex gap-5 items-start flex-col lg:flex-row">

        {/* Calendar — grows to fill space */}
        <section className="flex-1 min-w-0">
          {/* Controls row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <button
              onClick={prevPeriod}
              className="px-3 py-1 rounded-lg border border-border text-[0.85rem] font-semibold text-muted hover:border-brand hover:text-brand transition-colors bg-transparent cursor-pointer"
            >
              ← Prev
            </button>
            <span className="flex-1 text-center font-semibold text-[0.95rem]">{periodLabel}</span>
            <button
              onClick={goToToday}
              className="px-3 py-1 rounded-lg border border-border text-[0.85rem] font-semibold text-muted hover:border-brand hover:text-brand transition-colors bg-transparent cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={nextPeriod}
              className="px-3 py-1 rounded-lg border border-border text-[0.85rem] font-semibold text-muted hover:border-brand hover:text-brand transition-colors bg-transparent cursor-pointer"
            >
              Next →
            </button>

            {/* Week / Month toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden ml-2">
              {(["week", "month"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setCalView(v)}
                  className={[
                    "px-3 py-1 text-[0.82rem] font-semibold capitalize bg-transparent border-none cursor-pointer transition-colors",
                    calView === v ? "bg-brand text-white" : "text-muted hover:bg-brand-light",
                  ].join(" ")}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4 text-[0.78rem] mb-2">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-brand inline-block" /> Free</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-border inline-block" /> Busy</span>
            <span className="text-muted">
              {calView === "week" ? "Click a slot to edit · Click a cell to add" : "Click a slot to edit · Click a date to add"}
            </span>
          </div>

          {slotsLoading ? (
            <div className="flex justify-center py-16"><Spinner size={32} /></div>
          ) : calView === "week" ? (
            <WeekCalendar
              weekStart={weekStart}
              slots={slots}
              mode="own"
              onCellClick={(date) => openAdd(date)}
              onSlotClick={openEdit}
            />
          ) : (
            <MonthCalendar
              monthDate={monthDate}
              slots={slots}
              mode="own"
              onCellClick={(date) => openAdd(date)}
              onSlotClick={openEdit}
            />
          )}
        </section>

        {/* Requests sidebar */}
        <aside className="w-full lg:w-[300px] shrink-0">
          <h2 className="font-heading text-[1.1rem] font-medium text-brand-dark mb-3">
            Playdate Requests
            {pendingIncoming.length > 0 && (
              <span className="ml-2 text-[0.72rem] font-bold bg-yellow-100 text-yellow-800 px-2 py-[2px] rounded-full">
                {pendingIncoming.length} pending
              </span>
            )}
          </h2>

          {requestsLoading ? (
            <div className="flex justify-center py-8"><Spinner size={28} /></div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 px-4 bg-surface rounded-lg border-[1.5px] border-border text-muted text-[0.85rem]">
              No playdate requests yet. Share your calendar with other families!
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
              {pendingIncoming.length > 0 && (
                <>
                  <div className="text-[0.75rem] font-bold text-yellow-700 uppercase tracking-wide">
                    Needs your response
                  </div>
                  {pendingIncoming.map((r) => (
                    <RequestCard key={r.id} request={r} myId={user!.id} onUpdate={invalidate} />
                  ))}
                  {others.length > 0 && <div className="border-t border-border" />}
                </>
              )}
              {others.map((r) => (
                <RequestCard key={r.id} request={r} myId={user!.id} onUpdate={invalidate} />
              ))}
            </div>
          )}
        </aside>
      </div>

      {/* Add / Edit slot modal */}
      <Modal
        open={slotModalOpen}
        onClose={closeModal}
        title={editingSlot ? "Edit Slot" : "Add Availability Slot"}
      >
        <SlotForm
          initialDate={selectedDate}
          existing={editingSlot}
          onSaved={() => { closeModal(); invalidate(); }}
          onCancel={closeModal}
          onDeleted={() => { closeModal(); invalidate(); }}
        />
      </Modal>
    </main>
  );
};
