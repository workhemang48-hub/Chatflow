import { useEffect, useRef, useState } from 'react';

export default function MessageMenu({
  isOwn,
  onReply,
  onEdit,
  onDelete,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, []);

  return (
        <div
  ref={menuRef}
  className={`absolute ${
    isOwn
      ? 'right-full mr-1 top-1/2 -translate-y-1/2'
      : 'left-full ml-1 top-1/2 -translate-y-1/2'
  } opacity-0 group-hover:opacity-100 transition-opacity z-50`}
>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-8 w-8 rounded-full hover:bg-black/5 flex items-center justify-center"
      >
        ⋮
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white shadow-lg border border-black/10 z-50 overflow-hidden">

          <button
            onClick={() => {
              setOpen(false);
              onReply?.();
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Reply
          </button>

          {isOwn && (
            <>
              <button
                onClick={() => {
                  setOpen(false);
                  onEdit?.();
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Edit
              </button>

              <button
                onClick={() => {
                  setOpen(false);

                  if (window.confirm('Delete this message?')) {
                    onDelete?.();
                  }
                }}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}