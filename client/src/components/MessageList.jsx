import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import SubmissionCard from './SubmissionCard';
import Avatar from './Avatar';
import MessageMenu from './MessageMenu';

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function dayLabel(iso) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'long', day: 'numeric' });
}

// Groups consecutive messages from the same sender, within a 5-minute
// window, so a burst of messages reads as one visual block — name and
// avatar only on the first message, timestamp only on the last.
function buildGroups(messages) {
  const groups = [];
  let lastDay = null;

  messages.forEach((m) => {
    const day = dayLabel(m.createdAt);
    const senderId = m.senderId?._id || m.senderId;
    const last = groups[groups.length - 1];

    if (day !== lastDay) {
      groups.push({ type: 'day-marker', day, key: `day-${m._id}` });
      lastDay = day;
    }

    const prevItem = groups[groups.length - 1];
    const canMerge =
      prevItem?.type === 'message-group' &&
      m.type === 'text' &&
      prevItem.items[0].type === 'text' &&
      (prevItem.items[0].senderId?._id || prevItem.items[0].senderId) === senderId &&
      new Date(m.createdAt) - new Date(prevItem.items[prevItem.items.length - 1].createdAt) < 5 * 60 * 1000;

    if (canMerge) {
      prevItem.items.push(m);
    } else {
      groups.push({ type: 'message-group', items: [m], key: m._id });
    }
  });

  return groups;
}

export default function MessageList({ messages, onSubmissionUpdated, onDeleteMessage, onReplyMessage, onEditRequest, hasMore, loadingMore, onLoadMore }) {
  const { user } = useAuth();
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const isPrependingRef = useRef(false);
  const prevScrollHeightRef = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (isPrependingRef.current) {
      // Older messages were just prepended above the current view — keep
      // the same content visually in place instead of letting the browser
      // (or our own scroll-to-bottom below) yank the view around.
      el.scrollTop = el.scrollHeight - prevScrollHeightRef.current;
      isPrependingRef.current = false;
    } else {
      bottomRef.current?.scrollIntoView({ block: 'end' });
    }
  }, [messages.length]);

  function handleLoadMore() {
    const el = containerRef.current;
    if (el) prevScrollHeightRef.current = el.scrollHeight;
    isPrependingRef.current = true;
    onLoadMore();
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-xs">
          <p className="text-3xl mb-2">👋</p>
          <p className="text-sm text-ink/40">No messages yet — say hi, or submit some work for review.</p>
        </div>
      </div>
    );
  }

  const groups = buildGroups(messages);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
      {hasMore && (
        <div className="flex justify-center pb-2">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="text-xs font-mono text-ink/40 hover:text-ink/70 transition-colors disabled:opacity-50"
          >
            {loadingMore ? 'Loading…' : 'Load earlier messages'}
          </button>
        </div>
      )}

      {groups.map((group) => {
        if (group.type === 'day-marker') {
          return (
            <div key={group.key} className="flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-ink/10" />
              <span className="text-[11px] font-mono text-ink/30 uppercase tracking-wide">{group.day}</span>
              <div className="h-px flex-1 bg-ink/10" />
            </div>
          );
        }

        const first = group.items[0];
        const isOwn = (first.senderId?._id || first.senderId) === user.id;

        if (first.type === 'submission') {
          return (
            <div
              key={group.key}
              className={`flex gap-2 animate-message-in ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              {!isOwn && <Avatar name={first.senderId?.name} size={28} className="mt-auto" />}
              <div className="relative inline-block group">
                {first.deleted ? (
                  <div className="max-w-md rounded-2xl border border-ink/10 bg-white shadow-sm px-4 py-3 text-sm italic opacity-70">
                    This message was deleted by {first.deletedBy?.name || 'Unknown'}
                  </div>
                ) : (
                  <SubmissionCard message={first} onUpdated={onSubmissionUpdated} />
                )}

                {!first.deleted && (
                  <MessageMenu
                    isOwn={isOwn}
                    onReply={() => onReplyMessage?.(first)}
                    onEdit={() => console.log('Edit', first)}
                    onDelete={() => onDeleteMessage?.(first._id)}
                  />
                )}
              </div>
            </div>
          );
        }

              return (
                <div key={group.key} className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  {!isOwn && <Avatar name={first.senderId?.name} size={28} className="mt-auto" />}
                  <div className={`max-w-[80%] sm:max-w-md flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
                    {!isOwn && (
                      <span className="text-xs text-ink/40 font-mono px-1 mb-0.5">
                        {first.senderId?.name || 'Deleted user'}
                      </span>
                    )}
                    {group.items.map((m, i) => (
                      <div
                        key={m._id}
                        className={`group relative animate-message-in flex flex-col gap-0.5 w-full ${
                          isOwn ? 'items-end' : 'items-start'
                        }`}
                      >
                    <div className="relative inline-block group">

                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed w-fit ${
                        isOwn
                          ? 'ml-auto bg-flow text-white rounded-br-sm'
                          : 'bg-white text-ink rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {!m.deleted && m.replyTo && (
                        <div
                          className={`mb-1.5 rounded-lg border-l-2 px-2 py-1 text-xs ${
                            isOwn
                              ? 'border-white/50 bg-white/10 text-white/90'
                              : 'border-ink/20 bg-ink/5 text-ink/70'
                          }`}
                        >
                          <p className="font-medium">{m.replyTo.senderName}</p>
                          <p className="truncate opacity-80">{m.replyTo.preview}</p>
                        </div>
                      )}
                      {m.deleted ? (
                        <span className="italic opacity-70">
                          This message was deleted by {m.deletedBy?.name || 'Unknown'}
                        </span>
                      ) : (
                        m.content
                      )}
                    </div>

                    {!m.deleted && (
                    <MessageMenu
                      isOwn={isOwn}
                      onReply={() => onReplyMessage?.(m)}
                      onEdit={() => onEditRequest?.(m)}
                      onDelete={() => onDeleteMessage?.(m._id)}
                    />
                    )}

                  </div>
                  {m.edited && !m.deleted && (
                    <span className={`text-[10px] italic text-ink/40 px-1 ${isOwn ? 'text-right' : ''}`}>
                      {m.senderId?.name || 'Someone'} edited this message · {formatTime(m.editedAt)}
                    </span>
                  )}
                  {i === group.items.length - 1 && (
                    <span className={`text-[11px] text-ink/30 font-mono px-1 ${isOwn ? 'text-right' : ''}`}>
                      {formatTime(m.createdAt)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}