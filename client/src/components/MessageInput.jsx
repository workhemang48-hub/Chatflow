import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

let typingTimeout = null;

export default function MessageInput({
  roomId,
  socket,
  onSubmissionCreated,
  replyingTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
  onEditMessage,
}) {
  const [text, setText] = useState('');
  const [showSubmitPanel, setShowSubmitPanel] = useState(false);
  const [file, setFile] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (editingMessage) setText(editingMessage.content || '');
  }, [editingMessage]);
  function handleTyping(value) {
    setText(value);
    if (!socket) return;
    socket.emit('typing:start', { roomId });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => socket.emit('typing:stop', { roomId }), 1200);
  }

  async function sendText(e) {
    e.preventDefault();
    if (!text.trim()) return;

    if (editingMessage) {
      await onEditMessage?.(editingMessage._id, text.trim());
      setText('');
      onCancelEdit?.();
      return;
    }

    if (!socket) return;
    socket.emit('message:send', {
      roomId,
      content: text.trim(),
      replyTo: replyingTo?._id || null,
    });
    setText('');
    socket.emit('typing:stop', { roomId });
    onCancelReply?.();
  }

  async function submitWork(e) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('note', note);
      const { data } = await api.post(`/submissions/room/${roomId}`, form);
      onSubmissionCreated?.(data.message);
      setFile(null);
      setNote('');
      setShowSubmitPanel(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-ink/10 bg-white pb-safe">
      {showSubmitPanel && (
        <form onSubmit={submitWork} className="p-3 sm:p-4 border-b border-ink/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-ink/50">submit work</span>
            <button
              type="button"
              onClick={() => setShowSubmitPanel(false)}
              className="text-xs text-ink/40 min-h-[44px] px-2 transition-colors hover:text-ink/70"
            >
              Cancel
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note for the reviewer (optional)"
            className="w-full rounded-lg border border-ink/10 px-3 py-2 text-sm focus:border-flow"
          />
          <button
            type="submit"
            disabled={!file || busy}
            className="min-h-[44px] w-full rounded-lg bg-flow text-white text-sm font-medium disabled:opacity-50 transition-colors hover:bg-flow/90"
          >
            {busy ? 'Uploading…' : 'Submit for review'}
          </button>
        </form>
      )}

      {(replyingTo || editingMessage) && (
        <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 border-b border-ink/5 bg-ink/5">
          <div className="min-w-0 flex-1 border-l-2 border-flow pl-2">
            <p className="text-xs font-mono text-flow">
              {editingMessage ? 'Editing message' : `Replying to ${replyingTo.senderId?.name || 'message'}`}
            </p>
            <p className="truncate text-xs text-ink/50">
              {editingMessage
                ? editingMessage.content
                : replyingTo.type === 'submission'
                ? replyingTo.submission?.fileName || 'Attachment'
                : replyingTo.content}
            </p>
          </div>
          <button
            type="button"
            onClick={editingMessage ? onCancelEdit : onCancelReply}
            className="shrink-0 text-xs text-ink/40 hover:text-ink/70 min-h-[44px] px-2 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      <form onSubmit={sendText} className="flex items-center gap-2 p-3 sm:p-4">
        <button
          type="button"
          onClick={() => setShowSubmitPanel((v) => !v)}
          title="Submit work"
          className="min-h-[44px] min-w-[44px] shrink-0 rounded-lg border border-ink/10 text-ink/60 flex items-center justify-center transition-colors hover:bg-ink/5 hover:text-ink"
        >
          +
        </button>
        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Message…"
          className="flex-1 min-h-[44px] rounded-full border border-ink/10 px-4 text-sm focus:border-flow"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="min-h-[44px] px-4 shrink-0 rounded-full bg-flow text-white text-sm font-medium disabled:opacity-40 transition-colors hover:bg-flow/90"
        >
          {editingMessage ? 'Save' : 'Send'}
        </button>
      </form>
    </div>
  );
}
