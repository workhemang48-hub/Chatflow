import { useState } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import PresenceDot from './PresenceDot';
import Avatar from './Avatar';
import RoomMembersModal from './RoomMembersModal';
import { useAuth } from '../context/AuthContext';

export default function RoomView({
  room,
  messages,
  hasMore,
  loadingMore,
  onLoadMore,
  typingNames,
  socket,
  presence,
  people,
  onOpenDrawer,
  onBack,
  onSubmissionUpdated,
  onSubmissionCreated,
  onAddMembers,
  onRemoveMember,
  onDeleteMessage,
  onEditMessage,
  replyingTo,
  onReplyMessage,
  onCancelReply,
  editingMessage,
  onEditRequest,
  onCancelEdit,
}) {
  const { user } = useAuth();
  const [showMembers, setShowMembers] = useState(false);

  if (!room) {
    return (
      <div className="flex-1 hidden md:flex items-center justify-center text-ink/30 text-sm bg-[#F6FBF9]">
        Select a room to start chatting
      </div>
    );
  }

  const dmPartner = room.type === 'dm' ? room.members.find((m) => m?._id !== user.id) : null;
  const dmStatus = dmPartner ? presence[dmPartner._id] || dmPartner.status : null;
  const title = room.type === 'dm' && dmPartner ? dmPartner.name : room.name;
  const realMembers = room.members.filter(Boolean);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F6FBF9]">
      <header className="flex items-center gap-2 px-3 sm:px-6 py-3 border-b border-ink/10 bg-white">
        {/* Back arrow: mobile only, returns to room list drawer */}
        <button
          onClick={onBack}
          className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-ink/60"
          aria-label="Back to rooms"
        >
          ←
        </button>
        <div className="min-w-0 flex items-center gap-2">
          {room.type === 'team' && (
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: room.colorTag || '#5DCAA5' }}
            />
          )}
          {room.type === 'dm' && <PresenceDot status={dmStatus} />}
          <h1 className="truncate font-medium text-ink">{title}</h1>
        </div>

        {room.type === 'team' && (
          <button
            onClick={() => setShowMembers(true)}
            className="ml-2 flex items-center -space-x-2 shrink-0 hover:opacity-80 transition-opacity"
            title="View members"
          >
            {realMembers.slice(0, 4).map((m) => (
              <Avatar key={m._id} name={m.name} size={24} className="ring-2 ring-white" />
            ))}
            {realMembers.length > 4 && (
              <span className="h-6 w-6 rounded-full bg-ink/10 text-[10px] font-mono flex items-center justify-center ring-2 ring-white text-ink/60">
                +{realMembers.length - 4}
              </span>
            )}
          </button>
        )}

        <button
          onClick={onOpenDrawer}
          className="md:hidden ml-auto min-h-[44px] min-w-[44px] flex items-center justify-center text-ink/60"
          aria-label="Open rooms menu"
        >
          ☰
        </button>
      </header>

      <MessageList
        messages={messages}
        onSubmissionUpdated={onSubmissionUpdated}
        onDeleteMessage={onDeleteMessage}
        onReplyMessage={onReplyMessage}
        onEditRequest={onEditRequest}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={onLoadMore}
      />
      <TypingIndicator names={typingNames} />
      <MessageInput
        roomId={room._id}
        socket={socket}
        onSubmissionCreated={onSubmissionCreated}
        replyingTo={replyingTo}
        onCancelReply={onCancelReply}
        editingMessage={editingMessage}
        onCancelEdit={onCancelEdit}
        onEditMessage={onEditMessage}
      />

      {showMembers && (
        <RoomMembersModal
          room={room}
          people={people}
          onClose={() => setShowMembers(false)}
          onAddMembers={(memberIds) => onAddMembers(room._id, memberIds)}
          onRemoveMember={(userId) => onRemoveMember(room._id, userId)}
        />
      )}
    </div>
  );
}