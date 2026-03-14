function FlashMessage({ flash, onDismiss }) {
  if (!flash) {
    return null;
  }

  return (
    <div className="flash-stack" aria-live="polite" aria-atomic="true">
      <div className={`flash-message flash-${flash.type || 'success'}`} role="status">
        <span>{flash.message}</span>
        <button type="button" className="flash-close" onClick={onDismiss} aria-label="Затвори">
          x
        </button>
      </div>
    </div>
  );
}

export default FlashMessage;
