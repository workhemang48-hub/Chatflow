import { useState } from 'react';
import Logo from './Logo';
import PresenceDot from './PresenceDot';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import NewChannelModal from './NewChannelModal';
import ConfirmModal from './ConfirmModal';
import ProfileModal from './ProfileModal';
import ManageTeamModal from './ManageTeamModal';
import NotificationToggle from './NotificationToggle';
import { api } from '../lib/api';

export default function Sidebar({
  rooms,
  people,
  activeRoomId,
  presence,
  onSelectRoom,
  onSelectPerson,
  onCreateChannel,
  isOpen,
  onClose,
}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showManageTeam, setShowManageTeam] = useState(false);
  const [deleting, setDeleting] = useState(false);
  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await api.delete('/users/me');
      signOut();
      navigate('/');
    } catch {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <>
      {/* Backdrop, mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-72 bg-ink text-mist flex flex-col
          transform transition-transform duration-200 ease-out
          md:static md:translate-x-0 md:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="px-5 py-5 flex items-center justify-between border-b border-white/10">
          <Logo className="text-mist" />
          <button
            onClick={onClose}
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-mist/60"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <SidebarSection
            title="Teams"
            action={
              <button
                onClick={() => setShowNewChannel(true)}
                className="min-h-[28px] min-w-[28px] flex items-center justify-center text-mist/40 hover:text-signal transition-colors rounded"
                aria-label="New channel"
                title="New channel"
              >
                +
              </button>
            }
          >
            {rooms
              .filter((r) => r.type === 'team')
              .map((room) => (
                <SidebarRow
                  key={room._id}
                  active={room._id === activeRoomId}
                  onClick={() => onSelectRoom(room._id)}
                  leading={
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: room.colorTag || '#5DCAA5' }}
                    />
                  }
                  label={room.name}
                />
              ))}
          </SidebarSection>

          <SidebarSection title="People">
            {people.map((person) => {
              const status = presence[person.id] || person.status;
              const dmRoom = rooms.find(
                (r) => r.type === 'dm' && r.members.some((m) => m?._id === person.id)
              );
              return (
                <SidebarRow
                  key={person.id}
                  active={dmRoom && dmRoom._id === activeRoomId}
                  onClick={() => onSelectPerson(person.id)}
                  leading={<PresenceDot status={status} />}
                  label={person.name}
                />
              );
            })}
          </SidebarSection>
        </div>

        <div className="border-t border-white/10 px-5 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowProfile(true)}
              className="min-w-0 text-left hover:opacity-80 transition-opacity"
            >
              <p className="truncate text-sm font-medium underline decoration-mist/20 underline-offset-2">
                {user?.name}
              </p>
              <p className="truncate text-xs text-mist/40 font-mono">{user?.role}</p>
            </button>
            <div className="flex items-center gap-3 shrink-0">
              {user?.role === 'manager' && (
                <button
                  onClick={() => setShowManageTeam(true)}
                  className="text-xs text-signal underline underline-offset-2"
                >
                  Manage team
                </button>
              )}
              <Link to="/submissions" className="text-xs text-signal underline underline-offset-2">
                My submissions
              </Link>
              <button onClick={signOut} className="text-xs text-mist/40 min-h-[44px] px-1">
                Sign out
              </button>
            </div>
          </div>
          <NotificationToggle />
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="mt-1 text-xs text-mist/25 hover:text-rose-400 transition-colors"
          >
            Delete account
          </button>
        </div>
      </aside>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete your account?"
          message="This permanently deletes your account and removes you from every channel and DM. Your past messages and submissions stay visible to others, just attributed to 'Deleted user'. This can't be undone."
          confirmLabel="Delete my account"
          danger
          busy={deleting}
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

      {showManageTeam && <ManageTeamModal onClose={() => setShowManageTeam(false)} />}

      {showNewChannel && (
        <NewChannelModal
          people={people}
          onClose={() => setShowNewChannel(false)}
          onCreate={onCreateChannel}
        />
      )}
    </>
  );
}

function SidebarSection({ title, action, children }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between px-5 mb-1">
        <p className="text-xs font-mono uppercase tracking-wide text-mist/30">{title}</p>
        {action}
      </div>
      <div>{children}</div>
    </div>
  );
}

function SidebarRow({ active, onClick, leading, label }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-5 min-h-[44px] text-sm text-left ${
        active ? 'bg-white/10 text-mist' : 'text-mist/70 hover:bg-white/5'
      }`}
    >
      {leading}
      <span className="truncate">{label}</span>
    </button>
  );
}