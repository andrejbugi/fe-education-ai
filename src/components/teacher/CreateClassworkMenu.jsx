import { useEffect, useRef, useState } from 'react';

function CreateClassworkMenu({ onCreateAssignment, onCreateTopic }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <div className="teacher-create-menu" ref={menuRef}>
      <button
        type="button"
        className="btn btn-primary teacher-create-menu-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Креирај
        <span aria-hidden="true">▾</span>
      </button>

      {open ? (
        <div className="teacher-create-menu-dropdown" role="menu" aria-label="Креирај елемент">
          <button
            type="button"
            className="teacher-create-menu-item"
            onClick={() => {
              setOpen(false);
              onCreateAssignment?.();
            }}
            role="menuitem"
          >
            <span className="teacher-create-menu-icon">▣</span>
            <span>
              <strong>Задача</strong>
              <small>Отвори форма за нова задача</small>
            </span>
          </button>

          <button
            type="button"
            className="teacher-create-menu-item"
            onClick={() => {
              setOpen(false);
              onCreateTopic?.();
            }}
            role="menuitem"
          >
            <span className="teacher-create-menu-icon">≡</span>
            <span>
              <strong>Тема</strong>
              <small>Креирај нова тема во модал</small>
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default CreateClassworkMenu;
