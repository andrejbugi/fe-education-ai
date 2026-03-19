function getAttachmentPreviewLabel(attachment) {
  if (attachment?.fileName) {
    return attachment.fileName;
  }

  if (attachment?.attachmentType === 'image') {
    return 'Слика';
  }

  if (attachment?.attachmentType === 'pdf') {
    return 'PDF документ';
  }

  return 'Прилог';
}

function isImageAttachment(attachment) {
  const contentType = String(attachment?.contentType || '').toLowerCase();
  const attachmentType = String(attachment?.attachmentType || '').toLowerCase();
  return attachmentType === 'image' || contentType.startsWith('image/');
}

export function getSelectedDiscussionFileKey(file) {
  return `${file?.name || 'file'}-${file?.size || 0}-${file?.lastModified || 0}`;
}

export function mergeSelectedDiscussionFiles(existingFiles, nextFiles) {
  const mergedFiles = new Map(
    (existingFiles || []).map((file) => [getSelectedDiscussionFileKey(file), file])
  );

  (nextFiles || []).forEach((file) => {
    mergedFiles.set(getSelectedDiscussionFileKey(file), file);
  });

  return Array.from(mergedFiles.values());
}

export function DiscussionAttachmentList({ attachments = [] }) {
  if (!attachments.length) {
    return null;
  }

  return (
    <div className="chat-attachment-list discussion-attachment-list">
      {attachments.map((attachment) => {
        const imageAttachment = isImageAttachment(attachment);
        return (
          <a
            key={attachment.id}
            className={`chat-attachment-item ${
              imageAttachment ? 'is-image-attachment' : 'is-file-attachment'
            }`}
            href={attachment.fileUrl || '#'}
            target="_blank"
            rel="noreferrer"
          >
            {imageAttachment && attachment.fileUrl ? (
              <img
                src={attachment.fileUrl}
                alt={getAttachmentPreviewLabel(attachment)}
                className="chat-attachment-image"
              />
            ) : null}
            <span>{getAttachmentPreviewLabel(attachment)}</span>
          </a>
        );
      })}
    </div>
  );
}

export function DiscussionSelectedFiles({ files = [], onRemove }) {
  if (!files.length) {
    return null;
  }

  return (
    <div className="discussion-selected-files">
      {files.map((file) => {
        const fileKey = getSelectedDiscussionFileKey(file);
        return (
          <span key={fileKey} className="discussion-selected-file">
            <span>{file.name}</span>
            {typeof onRemove === 'function' ? (
              <button
                type="button"
                className="discussion-selected-file-remove"
                onClick={() => onRemove(fileKey)}
              >
                Отстрани
              </button>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
