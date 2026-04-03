import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { userService, messageService } from "../services";
import { Avatar } from "../components/ui/Avatar";
import { Button, Spinner } from "../components/ui/Button";
import { useAuthStore } from "../contexts/authStore";
import toast from "react-hot-toast";

export const MemberProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuthStore();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const { data: member, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => userService.getById(id!),
    enabled: !!id,
  });

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

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-20 text-muted">Member not found.</div>
    );
  }

  const firstName = member.name.split(" ")[0];

  return (
    <main className="max-w-[680px] mx-auto px-5 py-8 flex flex-col gap-4">
      {/* Profile card */}
      <div className="bg-surface rounded-lg border-[1.5px] border-border overflow-hidden shadow-sm">
        <div className="h-[80px] bg-gradient-to-br from-brand to-accent" />
        <div className="px-6 pb-6 -mt-[40px]">
          <Avatar
            src={member.thumbnail}
            name={member.name}
            size={80}
            style={{ border: "3px solid #fff" }}
          />
          <div className="mt-3">
            <h1 className="font-heading text-[1.6rem] font-medium text-brand-dark">
              {member.name}
            </h1>
            <p className="text-muted text-[0.9rem] mt-1">
              📍 {member.city}, {member.state}
            </p>
            <p className="text-muted text-[0.82rem] mt-1">
              Member since{" "}
              {new Date(member.created_at).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Message compose — Facebook-style */}
      <div className="bg-surface rounded-lg border-[1.5px] border-border shadow-sm p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar
            src={me?.thumbnail ?? null}
            name={me?.name ?? ""}
            size={38}
          />
          <span className="font-semibold text-[0.9rem]">
            Write to {firstName}
          </span>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Send ${firstName} a message…`}
          rows={3}
          className="w-full px-4 py-3 rounded-lg border-[1.5px] border-border bg-[#f9fafb] text-[0.95rem] font-body resize-none outline-none focus:border-brand transition-colors"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
          }}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-muted text-[0.78rem]">⌘ Enter to send</span>
          <Button
            onClick={handleSend}
            disabled={!message.trim()}
            loading={sending}
            size="sm"
          >
            Send Message
          </Button>
        </div>
      </div>
    </main>
  );
};
