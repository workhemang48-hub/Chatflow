import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import RoomView from '../components/RoomView';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function AppShell() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket, presence } = useSocket();
  const { user } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [people, setPeople] = useState([]);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // { userId: name }
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);

  useEffect(() => {
    setReplyingTo(null);
    setEditingMessage(null);
  }, [roomId]);

  const activeRoom = useMemo(() => rooms.find((r) => r._id === roomId), [rooms, roomId]);

  // Initial load: rooms + people.
  useEffect(() => {
    async function load() {
      const [roomsRes, peopleRes] = await Promise.all([api.get('/rooms'), api.get('/users')]);
      setRooms(roomsRes.data.rooms);
      setPeople(peopleRes.data.users);

      if (!roomId && roomsRes.data.rooms.length > 0) {
        navigate(`/app/rooms/${roomsRes.data.rooms[0]._id}`, { replace: true });
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A socket only auto-joins rooms it was a member of at connect time.
  // Rooms created later (e.g. a brand-new DM) need an explicit join, or
  // neither the sender nor the recipient will receive live broadcasts
  // for that room until their next reconnect/refresh.
  useEffect(() => {
    if (!socket || !roomId) return;
    socket.emit('room:join', roomId);
  }, [socket, roomId]);
  // A socket only auto-joins rooms it was a member of at connect time.
  // Rooms created later (e.g. a brand-new DM) need an explicit join, or
  // neither the sender nor the recipient will receive live broadcasts
  // for that room until their next reconnect/refresh.
  useEffect(() => {
    if (!socket || !roomId) return;
    socket.emit('room:join', roomId);
  }, [socket, roomId]);
  // Message history for the active room.
  useEffect(() => {
    if (!roomId) return;
    setMessages([]);
    setHasMore(false);
    api.get(`/messages/${roomId}`).then((res) => {
      setMessages(res.data.messages);
      setHasMore(res.data.hasMore);
    });
  }, [roomId]);

  const loadOlderMessages = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;

    setLoadingMore(true);
    try {
      const oldest = messages[0];
      const res = await api.get(`/messages/${roomId}`, { params: { before: oldest.createdAt } });
      setMessages((prev) => [...res.data.messages, ...prev]);
      setHasMore(res.data.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }, [roomId, messages, hasMore, loadingMore]);

  // Live message + typing events, scoped to the currently viewed room.
  useEffect(() => {
    if (!socket) return;

    function handleNew(message) {
      if (message.roomId !== roomId && message.roomId?._id !== roomId) return;
      setMessages((prev) => [...prev, message]);
    }

    function handleUpdated(message) {
      setMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
    }

    function handleRoomUpdated(room) {
      setRooms((prev) => prev.map((r) => (r._id === room._id ? room : r)));
    }

    function handleRoomRemoved({ roomId: removedId }) {
      setRooms((prev) => prev.filter((r) => r._id !== removedId));
      if (roomId === removedId) navigate('/app');
    }

    function handleTyping({ roomId: incomingRoomId, userId, name, isTyping }) {
      if (incomingRoomId !== roomId) return;
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (isTyping) next[userId] = name;
        else delete next[userId];
        return next;
      });
    }

    socket.on('message:new', handleNew);
    socket.on('message:updated', handleUpdated);
    socket.on('typing:update', handleTyping);
    socket.on('room:updated', handleRoomUpdated);
    socket.on('room:removed', handleRoomRemoved);

    function handleRoomNew(room) {
      setRooms((prev) => (prev.some((r) => r._id === room._id) ? prev : [...prev, room]));
    }
    socket.on('room:new', handleRoomNew);

    return () => {
      socket.off('message:new', handleNew);
      socket.off('message:updated', handleUpdated);
      socket.off('typing:update', handleTyping);
      socket.off('room:updated', handleRoomUpdated);
      socket.off('room:removed', handleRoomRemoved);
      socket.off('room:new', handleRoomNew);
    };
  }, [socket, roomId, navigate]);
  useEffect(() => {
    setTypingUsers({});
  }, [roomId]);

  const selectRoom = useCallback(
    (id) => {
      navigate(`/app/rooms/${id}`);
      setDrawerOpen(false);
    },
    [navigate]
  );

  const selectPerson = useCallback(
    async (userId) => {
      const { data } = await api.post(`/rooms/dm/${userId}`);
      setRooms((prev) => {
        const exists = prev.some((r) => r._id === data.room._id);
        return exists ? prev : [...prev, data.room];
      });
      navigate(`/app/rooms/${data.room._id}`);
      setDrawerOpen(false);
    },
    [navigate]
  );

  const createChannel = useCallback(
    async (name, colorTag, memberIds) => {
      const { data } = await api.post('/rooms', { name, colorTag, memberIds });
      setRooms((prev) => [...prev, data.room]);
      navigate(`/app/rooms/${data.room._id}`);
      setDrawerOpen(false);
    },
    [navigate]
  );

  const addMembers = useCallback(async (targetRoomId, memberIds) => {
    const { data } = await api.post(`/rooms/${targetRoomId}/members`, { memberIds });
    setRooms((prev) => prev.map((r) => (r._id === data.room._id ? data.room : r)));
  }, []);

  const removeMember = useCallback(
    async (targetRoomId, userId) => {
      await api.delete(`/rooms/${targetRoomId}/members/${userId}`);
      if (userId === user.id) {
        setRooms((prev) => prev.filter((r) => r._id !== targetRoomId));
        if (roomId === targetRoomId) navigate('/app');
      }
    },
    [user.id, roomId, navigate]
  );

  const deleteMessage = useCallback(async (messageId) => {
    const { data } = await api.delete(`/messages/${messageId}`);
    setMessages((prev) => prev.map((m) => (m._id === data.message._id ? data.message : m)));
  }, []);

  const editMessage = useCallback(async (messageId, content) => {
    const { data } = await api.patch(`/messages/${messageId}`, { content });
    setMessages((prev) => prev.map((m) => (m._id === data.message._id ? data.message : m)));
  }, []);
  return (
    <div className="h-full flex">
      <Sidebar
        rooms={rooms}
        people={people}
        activeRoomId={roomId}
        presence={presence}
        onSelectRoom={selectRoom}
        onSelectPerson={selectPerson}
        onCreateChannel={createChannel}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <RoomView
        room={activeRoom}
        messages={messages}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={loadOlderMessages}
        typingNames={Object.values(typingUsers)}
        socket={socket}
        presence={presence}
        people={people}
        onOpenDrawer={() => setDrawerOpen(true)}
        onBack={() => setDrawerOpen(true)}
        onAddMembers={addMembers}
        onRemoveMember={removeMember}
        onDeleteMessage={deleteMessage}
        onEditMessage={editMessage}
        replyingTo={replyingTo}
        onReplyMessage={setReplyingTo}
        onCancelReply={() => setReplyingTo(null)}
        editingMessage={editingMessage}
        onEditRequest={setEditingMessage}
        onCancelEdit={() => setEditingMessage(null)}
        onSubmissionUpdated={(updated) =>
          setMessages((prev) => prev.map((m) => (m._id === updated._id ? updated : m)))
        }
      // No local append here on purpose — the socket 'message:new'
        // broadcast (handled above) already adds this message once, since
        // the sender's own socket is joined to the room. Appending here
        // too was causing every submission to show up twice.
        onSubmissionCreated={() => {}}
      />
    </div>
  );
}
