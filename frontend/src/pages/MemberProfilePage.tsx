import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { userService, messageService, playdateService } from "../services";
import { AvailabilitySlot } from "../types";
import { Avatar } from "../components/ui/Avatar";
import { Button, Spinner } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { WeekCalendar, weekMonday, isoDate } from "../components/playdates/WeekCalendar";
import { useAuthStore } from "../contexts/authStore";
import toast from "react-hot-toast";

export const MemberProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuthStore();
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [weekStart, setWeekStart] = useState(() => weekMonday(new Date()));
  const [requestSlot, setRequestSlot] = useState<AvailabilitySlot | null>(null);
  const [requestMsg, setRequestMsg] = useState("");
  const [requesting, setRequesting] = useState(false);

  const { data: member, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => userService.getById(id!),
    enabled: !!id,
  });

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["availability", id],
    queryFn: () => playdateService.getAvailability(id!),
    enabled: !!id && !isLoading && !!member && me?.id !== member.id,
  });

  const { data: mySlots = [] } = useQuery({
    queryKey: ["availability", me?.id],
    queryFn: () => playdateService.getAvailability(me!.id),
    enabled: !!me?.id,
  });

  // Slots where both the member and the viewer are free at the same time
  const matchingSlotIds = new Set<string>(
    slots
      .filter((s) => s.status === "free")
      .filter((s) =>
        mySlots.some(
          (mine) =>
            mine.status === "free" &&
            mine.date === s.date &&
            mine.start_time < s.end_time &&
            mine.end_time > s.start_time
        )
      )
      .map((s) => s.id)
  );

  if (!isLoading && member && me?.id === member.id) {
    navigate("/profile", { replace: true });
    return null;
  }

  const handleSend = async () => {
    if (!message.trim() || !id) return;
    setSending(true);
    try {
      await messageService.send(id, message.trim());
      navigate(`/messages?partner=${id}`);
    } catch {
      toast.error("Failed to send message");
      setSending(false);
    }
  };

  const handleRequest = async () => {
    if (!requestSlot) return;
    setRequesting(true);
    try {
      await playdateService.createRequest(requestSlot.id, requestMsg.trim() || undefined);
      toast.success("Playdate request sent! 🎉");
      setRequestSlot(null);
      setRequestMsg("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send request";
      toast.error(msg);
    } finally {
      setRequesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  if (!member) {
    return <div className="text-center py-20 text-muted">Member not found.</div>;
  }

  const firstName = member.name.split(" ")[0];
  const weekLabel = `${format(weekStart, "MMM d")} – ${format(
    new Date(weekStart.getTime() + 6 * 86400000),
    "MMM d, yyyy"
  )}`;

  return (
    <main className="max-w-[780px] mx-auto px-5 py-8 flex flex-col gap-4">
      {/* Profile card */}
      <div className="bg-surface rounded-lg border-[1.5px] border-border overflow-hidden shadow-sm">
        <div className="h-[80px] bg-gradient-to-br from-brand to-accent" />
        <div className="px-6 pb-6 -mt-[40px]">
          <Avatar src={member.thumbnail} name={member.name} size={80} style={{ border: "3px solid #fff" }} />
          <div className="mt-3">
            <h1 className="font-heading text-[1.6rem] font-medium text-brand-dark">{member.name}</h1>
            <p className="text-muted text-[0.9rem] mt-1">📍 {member.city}, {member.state}</p>
            <p className="text-muted text-[0.82rem] mt-1">
              Member since{" "}
              {new Date(member.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* Message compose */}
      <div className="bg-surface rounded-lg border-[1.5px] border-border shadow-sm p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar src={me?.thumbnail ?? null} name={me?.name ?? ""} size={38} />
          <span className="font-semibold text-[0.9rem]">Write to {firstName}</span>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Send ${firstName} a message…`}
          rows={3}
          className="w-full px-4 py-3 rounded-lg border-[1.5px] border-border bg-bg text-[0.95rem] font-body resize-none outline-none focus:border-brand transition-colors"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend(); }}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-muted text-[0.78rem]">⌘ Enter to send</span>
          <Button onClick={handleSend} disabled={!message.trim()} loading={sending} size="sm">
            Send Message
          </Button>
        </div>
      </div>

      {/* Availability calendar */}
      <div className="bg-surface rounded-lg border-[1.5px] border-border shadow-sm p-4">
        <h2 className="font-heading text-[1.1rem] font-medium text-brand-dark mb-1">
          {firstName}'s Availability
        </h2>
        <p className="text-muted text-[0.82rem] mb-3">
          Click a green slot to request a playdate
        </p>

        {/* Week nav */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); }}
            className="px-3 py-1 rounded-lg border border-border text-[0.82rem] font-semibold text-muted hover:border-brand hover:text-brand transition-colors bg-transparent cursor-pointer"
          >
            ← Prev
          </button>
          <span className="flex-1 text-center text-[0.88rem] font-semibold">{weekLabel}</span>
          <button
            onClick={() => setWeekStart(weekMonday(new Date()))}
            className="px-3 py-1 rounded-lg border border-border text-[0.82rem] font-semibold text-muted hover:border-brand hover:text-brand transition-colors bg-transparent cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); }}
            className="px-3 py-1 rounded-lg border border-border text-[0.82rem] font-semibold text-muted hover:border-brand hover:text-brand transition-colors bg-transparent cursor-pointer"
          >
            Next →
          </button>
        </div>

        {slotsLoading ? (
          <div className="flex justify-center py-10"><Spinner size={28} /></div>
        ) : slots.length === 0 && isoDate(weekStart) > isoDate(new Date()) ? (
          <div className="text-center py-10 text-muted text-[0.88rem]">
            {firstName} hasn't set any availability yet.
          </div>
        ) : (
          <>
            <div className="flex gap-4 text-[0.76rem] mb-2 flex-wrap">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-brand inline-block" /> Free</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-accent inline-block" /> ★ Matches your availability</span>
              <span className="text-muted">Click a slot to request</span>
            </div>
            <WeekCalendar
              weekStart={weekStart}
              slots={slots}
              mode="view"
              matchingSlotIds={matchingSlotIds}
              onSlotClick={(slot) => {
                if (slot.status === "free") setRequestSlot(slot);
              }}
            />
          </>
        )}
      </div>

      {/* Playdate request modal */}
      <Modal
        open={!!requestSlot}
        onClose={() => { setRequestSlot(null); setRequestMsg(""); }}
        title="Request a Playdate"
      >
        {requestSlot && (
          <div className="flex flex-col gap-4">
            <div className="bg-brand-light rounded-lg px-4 py-3 text-[0.9rem]">
              <div className="font-bold text-brand-dark">{firstName}'s free slot</div>
              <div className="text-muted mt-1">
                {format(new Date(requestSlot.date), "EEEE, MMMM d, yyyy")}
              </div>
              <div className="text-muted">
                {requestSlot.start_time} – {requestSlot.end_time}
              </div>
              {requestSlot.note && (
                <div className="mt-1 italic text-muted text-[0.85rem]">"{requestSlot.note}"</div>
              )}
            </div>
            {matchingSlotIds.has(requestSlot.id) && (
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-2 text-[0.85rem] text-yellow-800">
                <span className="text-base">★</span>
                <span><strong>Matching availability</strong> — this time range overlaps with your free schedule.</span>
              </div>
            )}

            <div>
              <label className="block text-[0.85rem] font-semibold mb-1">
                Message <span className="text-muted font-normal">(optional)</span>
              </label>
              <textarea
                value={requestMsg}
                onChange={(e) => setRequestMsg(e.target.value)}
                placeholder={`Say something to ${firstName}…`}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border-[1.5px] border-border text-[0.92rem] font-body resize-none outline-none focus:border-brand"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => { setRequestSlot(null); setRequestMsg(""); }}>
                Cancel
              </Button>
              <Button onClick={handleRequest} loading={requesting}>
                Send Request
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
};
