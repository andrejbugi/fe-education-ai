import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  api,
  getStoredSchoolId,
  getStoredUser,
} from '../services/apiClient';

const CHAT_MESSAGE_LIMIT = 100;
const CHAT_REFRESH_INTERVAL_MS = 15000;
const PRESENCE_REFRESH_INTERVAL_MS = 45000;
const CHAT_SOCKET_RECONNECT_DELAY_MS = 2500;
const REACTION_OPTIONS = [
  { value: 'like', label: 'Ми се допаѓа', icon: '👍' },
  { value: 'heart', label: 'Срце', icon: '❤️' },
  { value: 'laugh', label: 'Смешно', icon: '😂' },
  { value: 'check', label: 'Одобрено', icon: '✅' },
];

function toId(value, fallback = '') {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return String(value);
}

function toIsoText(value) {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleString('mk-MK', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toPresenceLabel(status) {
  if (status === 'online') {
    return 'Онлајн';
  }
  if (status === 'away') {
    return 'Отсутен';
  }
  if (status === 'busy') {
    return 'Зафатен';
  }
  return 'Офлајн';
}

function getAttachmentPreviewLabel(attachment) {
  if (attachment.fileName) {
    return attachment.fileName;
  }
  if (attachment.attachmentType === 'image') {
    return 'Слика';
  }
  if (attachment.attachmentType === 'pdf') {
    return 'PDF документ';
  }
  return 'Датотека';
}

function getMessagePreview(message) {
  if (!message) {
    return 'Нема пораки';
  }
  if (message.body) {
    return message.body;
  }
  if (message.attachments.length === 1) {
    return `Прилог: ${getAttachmentPreviewLabel(message.attachments[0])}`;
  }
  if (message.attachments.length > 1) {
    return `${message.attachments.length} прилози`;
  }
  return 'Порака';
}

function sortMessages(messages) {
  return [...messages].sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();

    if (Number.isNaN(leftTime) || Number.isNaN(rightTime) || leftTime === rightTime) {
      return left.id.localeCompare(right.id, 'mk');
    }

    return leftTime - rightTime;
  });
}

function sortConversations(conversations) {
  return [...conversations].sort((left, right) => {
    const leftTime = new Date(left.lastMessageAt || left.createdAt).getTime();
    const rightTime = new Date(right.lastMessageAt || right.createdAt).getTime();

    if (Number.isNaN(leftTime) || Number.isNaN(rightTime) || leftTime === rightTime) {
      return right.id.localeCompare(left.id, 'mk');
    }

    return rightTime - leftTime;
  });
}

function mergeConversations(previousConversations, nextConversations) {
  const byId = new Map(previousConversations.map((conversation) => [conversation.id, conversation]));

  nextConversations.forEach((conversation) => {
    const existingConversation = byId.get(conversation.id);
    byId.set(
      conversation.id,
      existingConversation ? { ...existingConversation, ...conversation } : conversation
    );
  });

  return sortConversations(Array.from(byId.values()));
}

function toNumericId(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : value;
}

function getCableUrl() {
  if (typeof window === 'undefined') {
    return '';
  }

  const apiBaseUrl = String(process.env.REACT_APP_API_BASE_URL || '/api/v1').trim();
  let baseUrl = '';

  if (/^https?:\/\//i.test(apiBaseUrl)) {
    const parsedApiUrl = new URL(apiBaseUrl);
    parsedApiUrl.protocol = parsedApiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    parsedApiUrl.pathname = '/cable';
    parsedApiUrl.search = '';
    baseUrl = parsedApiUrl.toString();
  } else {
    const nextUrl = new URL('/cable', window.location.origin);
    nextUrl.protocol = nextUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    baseUrl = nextUrl.toString();
  }

  return baseUrl;
}

function buildConversationSubscriptionPayload(conversationId) {
  return JSON.stringify({
    command: 'subscribe',
    identifier: JSON.stringify({
      channel: 'ConversationChannel',
      conversation_id: toNumericId(conversationId),
    }),
  });
}

function buildConversationUnsubscribePayload(conversationId) {
  return JSON.stringify({
    command: 'unsubscribe',
    identifier: JSON.stringify({
      channel: 'ConversationChannel',
      conversation_id: toNumericId(conversationId),
    }),
  });
}

function extractCableEventPayload(rawPayload) {
  if (!rawPayload || typeof rawPayload !== 'object') {
    return null;
  }

  if (rawPayload.type === 'message.created') {
    return rawPayload;
  }

  if (rawPayload.message && typeof rawPayload.message === 'object') {
    if (rawPayload.message.type === 'message.created') {
      return rawPayload.message;
    }
  }

  return null;
}

function normalizeReaction(reaction, index) {
  if (!reaction) {
    return null;
  }

  return {
    id: toId(reaction.id, `reaction-${index}`),
    userId: toId(reaction.user_id ?? reaction.userId),
    reaction: reaction.reaction || '',
    createdAt: reaction.created_at || reaction.createdAt || '',
  };
}

function normalizeAttachment(attachment, index) {
  if (!attachment) {
    return null;
  }

  return {
    id: toId(attachment.id, `attachment-${index}`),
    attachmentType: attachment.attachment_type || attachment.attachmentType || 'file',
    fileName: attachment.file_name || attachment.fileName || '',
    contentType: attachment.content_type || attachment.contentType || '',
    fileSize: attachment.file_size ?? attachment.fileSize ?? null,
    storageKey: attachment.storage_key || attachment.storageKey || '',
    fileUrl: attachment.file_url || attachment.fileUrl || '',
    createdAt: attachment.created_at || attachment.createdAt || '',
  };
}

function normalizeMessage(message, index) {
  if (!message) {
    return null;
  }

  return {
    id: toId(message.id, `message-${index}`),
    conversationId: toId(message.conversation_id ?? message.conversationId),
    senderId: toId(message.sender_id ?? message.senderId),
    senderName: message.sender_name || message.senderName || 'Корисник',
    body: message.body || '',
    messageType: message.message_type || message.messageType || 'text',
    status: message.status || 'sent',
    replyToMessageId: toId(message.reply_to_message_id ?? message.replyToMessageId),
    editedAt: message.edited_at || message.editedAt || '',
    deletedAt: message.deleted_at || message.deletedAt || '',
    createdAt: message.created_at || message.createdAt || '',
    updatedAt: message.updated_at || message.updatedAt || '',
    attachments: Array.isArray(message.attachments)
      ? message.attachments.map(normalizeAttachment).filter(Boolean)
      : [],
    reactions: Array.isArray(message.reactions)
      ? message.reactions.map(normalizeReaction).filter(Boolean)
      : [],
    deliveredUserIds: Array.isArray(message.delivered_user_ids || message.deliveredUserIds)
      ? (message.delivered_user_ids || message.deliveredUserIds).map((id) => toId(id))
      : [],
    readUserIds: Array.isArray(message.read_user_ids || message.readUserIds)
      ? (message.read_user_ids || message.readUserIds).map((id) => toId(id))
      : [],
  };
}

function normalizeParticipant(participant, index) {
  if (!participant) {
    return null;
  }

  return {
    id: toId(participant.id, `participant-${index}`),
    email: participant.email || '',
    firstName: participant.first_name ?? participant.firstName ?? '',
    lastName: participant.last_name ?? participant.lastName ?? '',
    fullName: participant.full_name || participant.fullName || participant.email || 'Корисник',
    roles: Array.isArray(participant.roles) ? participant.roles : [],
    joinedAt: participant.joined_at || participant.joinedAt || '',
    lastReadMessageId: toId(
      participant.last_read_message_id ?? participant.lastReadMessageId,
      ''
    ),
    lastReadAt: participant.last_read_at || participant.lastReadAt || '',
    presenceStatus: participant.presence_status || participant.presenceStatus || 'offline',
    lastSeenAt: participant.last_seen_at || participant.lastSeenAt || '',
  };
}

function normalizeConversation(conversation, index) {
  if (!conversation) {
    return null;
  }

  return {
    id: toId(conversation.id, `conversation-${index}`),
    schoolId: toId(conversation.school_id ?? conversation.schoolId),
    conversationType: conversation.conversation_type || conversation.conversationType || 'direct',
    active: conversation.active !== false,
    lastMessageAt: conversation.last_message_at || conversation.lastMessageAt || '',
    createdAt: conversation.created_at || conversation.createdAt || '',
    updatedAt: conversation.updated_at || conversation.updatedAt || '',
    participants: Array.isArray(conversation.participants)
      ? conversation.participants.map(normalizeParticipant).filter(Boolean)
      : [],
    currentUserState: conversation.current_user_state || conversation.currentUserState || null,
    unreadCount: Number(conversation.unread_count ?? conversation.unreadCount ?? 0) || 0,
    lastMessage: conversation.last_message
      ? normalizeMessage(conversation.last_message, 0)
      : conversation.lastMessage
        ? normalizeMessage(conversation.lastMessage, 0)
        : null,
  };
}

function getOtherParticipant(conversation, currentUserId) {
  if (!conversation) {
    return null;
  }

  const participants = Array.isArray(conversation.participants) ? conversation.participants : [];
  return (
    participants.find((participant) => participant.id !== currentUserId) ||
    participants[0] ||
    null
  );
}

function getReactionCount(message, reactionType) {
  return message.reactions.filter((item) => item.reaction === reactionType).length;
}

function hasCurrentUserReaction(message, reactionType, currentUserId) {
  return message.reactions.some(
    (item) => item.reaction === reactionType && item.userId === currentUserId
  );
}

function getOutgoingStatusLabel(message, otherParticipantId) {
  if (!message || !otherParticipantId) {
    return 'Испратена';
  }
  if (message.readUserIds.includes(otherParticipantId)) {
    return 'Прочитана';
  }
  if (message.deliveredUserIds.includes(otherParticipantId)) {
    return 'Доставена';
  }
  return 'Испратена';
}

function buildMessageFormData(body, files) {
  const formData = new FormData();
  if (body) {
    formData.append('body', body);
  }
  if (!files.length) {
    formData.append('message_type', 'text');
  }
  files.forEach((file) => {
    formData.append('files[]', file);
  });
  return formData;
}

function normalizeTeacherClassroom(item, index) {
  if (!item) {
    return null;
  }

  return {
    id: toId(item.id, `classroom-${index}`),
    name:
      item.name ||
      `${item.grade_level || item.grade || ''}-${item.section || ''}`.trim() ||
      'Клас',
    gradeLevel: item.grade_level || item.grade || '',
    studentCount: item.student_count ?? item.students_count ?? 0,
  };
}

function normalizeRecipient(person, index, options = {}) {
  if (!person) {
    return null;
  }

  const roles = Array.isArray(person.roles)
    ? person.roles
    : Array.isArray(options.roles)
      ? options.roles
      : [];
  const fallbackLabel = options.fallbackLabel || 'Корисник';

  return {
    id: toId(person.id, `recipient-${index}`),
    fullName:
      person.full_name ||
      person.fullName ||
      person.name ||
      [person.first_name || person.firstName, person.last_name || person.lastName]
        .filter(Boolean)
        .join(' ') ||
      fallbackLabel,
    email: person.email || person.emailAddress || '',
    classroomId: toId(
      options.classroomId ?? person.classroom_id ?? person.classroom?.id,
      ''
    ),
    classroomName:
      options.classroomName ||
      person.classroom_name ||
      person.classroomName ||
      person.classroom?.name ||
      '',
    subjectId: toId(options.subjectId ?? person.subject_id ?? person.subject?.id, ''),
    subjectName:
      options.subjectName || person.subject_name || person.subjectName || person.subject?.name || '',
    roles,
  };
}

function mergeRecipientOptions(...collections) {
  const recipientsById = new Map();

  collections.flat().forEach((recipient, index) => {
    if (!recipient?.id) {
      return;
    }

    const key = toId(recipient.id, `recipient-${index}`);
    const existingRecipient = recipientsById.get(key);

    recipientsById.set(key, {
      ...existingRecipient,
      ...recipient,
      id: key,
      fullName: recipient.fullName || existingRecipient?.fullName || 'Корисник',
      email: recipient.email || existingRecipient?.email || '',
      classroomId: recipient.classroomId || existingRecipient?.classroomId || '',
      classroomName: recipient.classroomName || existingRecipient?.classroomName || '',
      subjectId: recipient.subjectId || existingRecipient?.subjectId || '',
      subjectName: recipient.subjectName || existingRecipient?.subjectName || '',
      roles:
        Array.isArray(recipient.roles) && recipient.roles.length > 0
          ? recipient.roles
          : existingRecipient?.roles || [],
    });
  });

  return Array.from(recipientsById.values()).sort((left, right) =>
    String(left.fullName).localeCompare(String(right.fullName), 'mk')
  );
}

function ChatMessagesPanel({ onNotify, recipientSeedOptions = [] }) {
  const storedUser = getStoredUser();
  const storedSchoolId = getStoredSchoolId();
  const [currentUser, setCurrentUser] = useState(storedUser);
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [draftMessage, setDraftMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [conversationsError, setConversationsError] = useState('');
  const [messagesError, setMessagesError] = useState('');
  const [teacherClassrooms, setTeacherClassrooms] = useState([]);
  const [classroomsLoading, setClassroomsLoading] = useState(false);
  const [classroomsError, setClassroomsError] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [recipientOptions, setRecipientOptions] = useState([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [recipientsError, setRecipientsError] = useState('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [newConversationMessage, setNewConversationMessage] = useState('');
  const [startingConversation, setStartingConversation] = useState(false);
  const [startConversationError, setStartConversationError] = useState('');
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [socketStatus, setSocketStatus] = useState('idle');
  const pendingReadIdsRef = useRef(new Set());
  const endOfMessagesRef = useRef(null);
  const conversationSocketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const currentUserId = toId(currentUser?.id);
  const isTeacher = useMemo(() => {
    const roles = Array.isArray(currentUser?.roles) ? currentUser.roles : [];
    return roles.includes('teacher') || roles.includes('admin');
  }, [currentUser?.roles]);
  const studentRecipientOptions = useMemo(() => {
    if (isTeacher) {
      return [];
    }

    const seededRecipients = Array.isArray(recipientSeedOptions)
      ? recipientSeedOptions
          .map((recipient, index) =>
            normalizeRecipient(recipient, index, {
              roles: ['teacher'],
              fallbackLabel: 'Наставник',
            })
          )
          .filter(Boolean)
      : [];
    const teachersFromConversations = conversations
      .map((conversation) => getOtherParticipant(conversation, currentUserId))
      .filter((participant) => Array.isArray(participant?.roles) && participant.roles.includes('teacher'))
      .map((participant, index) =>
        normalizeRecipient(participant, index, {
          roles: participant.roles,
          fallbackLabel: 'Наставник',
        })
      )
      .filter(Boolean);

    return mergeRecipientOptions(seededRecipients, teachersFromConversations);
  }, [conversations, currentUserId, isTeacher, recipientSeedOptions]);
  const availableRecipientOptions = isTeacher ? recipientOptions : studentRecipientOptions;
  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );
  const activeMessages = useMemo(
    () => messagesByConversation[selectedConversationId] || [],
    [messagesByConversation, selectedConversationId]
  );
  const otherParticipant = useMemo(
    () => getOtherParticipant(selectedConversation, currentUserId),
    [selectedConversation, currentUserId]
  );
  const selectedRecipient = useMemo(
    () =>
      availableRecipientOptions.find((recipient) => recipient.id === selectedRecipientId) || null,
    [availableRecipientOptions, selectedRecipientId]
  );
  const filteredRecipients = useMemo(() => {
    const normalizedSearch = recipientSearch.trim().toLowerCase();
    if (!normalizedSearch) {
      return availableRecipientOptions;
    }

    return availableRecipientOptions.filter((recipient) => {
      const haystack = [
        recipient.fullName,
        recipient.email,
        recipient.classroomName,
        recipient.subjectName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [availableRecipientOptions, recipientSearch]);
  const recipientTypeLabel = isTeacher ? 'ученик' : 'наставник';
  const recipientTypePluralLabel = isTeacher ? 'ученици' : 'наставници';

  const updateConversationFromMessage = useCallback(
    (conversationId, message, options = {}) => {
      if (!conversationId || !message) {
        return;
      }

      setConversations((previousConversations) =>
        sortConversations(
          previousConversations.map((conversation) => {
            if (conversation.id !== conversationId) {
              return conversation;
            }

            const currentLastMessageTime = new Date(
              conversation.lastMessageAt || conversation.createdAt
            ).getTime();
            const nextMessageTime = new Date(message.createdAt || message.updatedAt).getTime();
            const shouldReplaceLastMessage =
              !conversation.lastMessage ||
              conversation.lastMessage.id === message.id ||
              Number.isNaN(currentLastMessageTime) ||
              (!Number.isNaN(nextMessageTime) && nextMessageTime >= currentLastMessageTime);
            const latestReadMessageId =
              options.lastReadMessageId ||
              (message.readUserIds.includes(currentUserId) ? message.id : '');

            return {
              ...conversation,
              lastMessage: shouldReplaceLastMessage ? message : conversation.lastMessage,
              lastMessageAt: shouldReplaceLastMessage
                ? message.createdAt || conversation.lastMessageAt
                : conversation.lastMessageAt,
              unreadCount:
                options.unreadCount !== undefined
                  ? options.unreadCount
                  : message.senderId === currentUserId || message.readUserIds.includes(currentUserId)
                    ? 0
                    : conversation.unreadCount,
              currentUserState: conversation.currentUserState
                ? {
                    ...conversation.currentUserState,
                    last_read_message_id:
                      latestReadMessageId || conversation.currentUserState.last_read_message_id,
                    last_read_at:
                      message.readUserIds.includes(currentUserId)
                        ? message.updatedAt || message.createdAt
                        : conversation.currentUserState.last_read_at,
                  }
                : conversation.currentUserState,
            };
          })
        )
      );
    },
    [currentUserId]
  );

  const replaceConversationMessages = useCallback((conversationId, nextMessages) => {
    setMessagesByConversation((previousMessages) => ({
      ...previousMessages,
      [conversationId]: sortMessages(nextMessages),
    }));
  }, []);

  const replaceMessageInState = useCallback(
    (conversationId, nextMessage) => {
      if (!conversationId || !nextMessage) {
        return;
      }

      setMessagesByConversation((previousMessages) => {
        const currentMessages = previousMessages[conversationId] || [];
        const existingIndex = currentMessages.findIndex((message) => message.id === nextMessage.id);
        const nextCollection =
          existingIndex === -1
            ? [...currentMessages, nextMessage]
            : currentMessages.map((message) =>
                message.id === nextMessage.id ? nextMessage : message
              );

        return {
          ...previousMessages,
          [conversationId]: sortMessages(nextCollection),
        };
      });

      updateConversationFromMessage(conversationId, nextMessage);
    },
    [updateConversationFromMessage]
  );

  const loadCurrentUser = useCallback(async () => {
    if (storedUser?.id) {
      return;
    }

    const response = await api.me().catch(() => null);
    if (response?.user) {
      setCurrentUser(response.user);
    }
  }, [storedUser?.id]);

  const loadConversations = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setConversationsLoading(true);
      setConversationsError('');
    }

    try {
      const response = await api.conversations({ limit: CHAT_MESSAGE_LIMIT, offset: 0 });
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.conversations)
          ? response.conversations
          : [];
      const normalizedConversations = sortConversations(
        list.map(normalizeConversation).filter(Boolean)
      );
      setConversations((previousConversations) =>
        mergeConversations(previousConversations, normalizedConversations)
      );
      setSelectedConversationId((currentConversationId) => {
        if (
          currentConversationId &&
          normalizedConversations.some((conversation) => conversation.id === currentConversationId)
        ) {
          return currentConversationId;
        }
        return normalizedConversations[0]?.id || '';
      });
    } catch (error) {
      if (!silent) {
        setConversationsError(error.message || 'Не успеа вчитувањето на разговорите.');
      }
    } finally {
      if (!silent) {
        setConversationsLoading(false);
      }
    }
  }, []);

  const loadMessages = useCallback(
    async (conversationId, { silent = false } = {}) => {
      if (!conversationId) {
        return;
      }

      if (!silent) {
        setMessagesLoading(true);
        setMessagesError('');
      }

      try {
        const response = await api.conversationMessages(conversationId, {
          limit: CHAT_MESSAGE_LIMIT,
          offset: 0,
        });
        const list = Array.isArray(response)
          ? response
          : Array.isArray(response?.messages)
            ? response.messages
            : [];
        replaceConversationMessages(conversationId, list.map(normalizeMessage).filter(Boolean));
      } catch (error) {
        if (!silent) {
          setMessagesError(error.message || 'Не успеа вчитувањето на пораките.');
        }
      } finally {
        if (!silent) {
          setMessagesLoading(false);
        }
      }
    },
    [replaceConversationMessages]
  );

  const loadTeacherClassrooms = useCallback(async () => {
    if (!isTeacher) {
      return;
    }

    setClassroomsLoading(true);
    setClassroomsError('');

    try {
      const response = await api.teacherClassrooms();
      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.classrooms)
          ? response.classrooms
          : [];
      const normalizedClassrooms = list.map(normalizeTeacherClassroom).filter(Boolean);
      setTeacherClassrooms(normalizedClassrooms);
      setSelectedClassroomId((currentValue) => {
        if (currentValue && normalizedClassrooms.some((item) => item.id === currentValue)) {
          return currentValue;
        }
        return normalizedClassrooms[0]?.id || '';
      });
    } catch (error) {
      setClassroomsError(error.message || 'Не успеа вчитувањето на класовите.');
    } finally {
      setClassroomsLoading(false);
    }
  }, [isTeacher]);

  const loadRecipients = useCallback(
    async (classroomId) => {
      if (!isTeacher || !classroomId) {
        setRecipientOptions([]);
        return;
      }

      setRecipientsLoading(true);
      setRecipientsError('');

      try {
        const response = await api.teacherClassroomDetails(classroomId);
        const classroom = teacherClassrooms.find((item) => item.id === classroomId) || {
          id: classroomId,
          name: 'Клас',
        };
        const students = Array.isArray(response?.students) ? response.students : [];
        const normalizedRecipients = students
          .map((student, index) =>
            normalizeRecipient(student, index, {
              classroomId: classroom.id,
              classroomName: classroom.name,
              roles: ['student'],
              fallbackLabel: 'Ученик',
            })
          )
          .filter(Boolean);
        setRecipientOptions(normalizedRecipients);
      } catch (error) {
        setRecipientsError(error.message || 'Не успеа вчитувањето на учениците.');
      } finally {
        setRecipientsLoading(false);
      }
    },
    [isTeacher, teacherClassrooms]
  );

  useEffect(() => {
    loadCurrentUser().catch(() => null);
    loadConversations().catch(() => null);
  }, [loadConversations, loadCurrentUser, refreshKey]);

  useEffect(() => {
    if (!isTeacher) {
      return;
    }

    loadTeacherClassrooms().catch(() => null);
  }, [isTeacher, loadTeacherClassrooms, refreshKey]);

  useEffect(() => {
    if (!isTeacher || !selectedClassroomId) {
      return;
    }

    loadRecipients(selectedClassroomId).catch(() => null);
  }, [isTeacher, loadRecipients, selectedClassroomId]);

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    if (Object.prototype.hasOwnProperty.call(messagesByConversation, selectedConversationId)) {
      return;
    }

    loadMessages(selectedConversationId).catch(() => null);
  }, [loadMessages, messagesByConversation, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) {
      return undefined;
    }

    const refreshTimerId = window.setInterval(() => {
      loadConversations({ silent: true }).catch(() => null);
      if (socketStatus !== 'connected') {
        loadMessages(selectedConversationId, { silent: true }).catch(() => null);
      }
    }, CHAT_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(refreshTimerId);
    };
  }, [loadConversations, loadMessages, selectedConversationId, socketStatus]);

  useEffect(() => {
    api.updatePresence('online').catch(() => null);

    const presenceTimerId = window.setInterval(() => {
      api.updatePresence('online').catch(() => null);
    }, PRESENCE_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(presenceTimerId);
      api.updatePresence('away').catch(() => null);
    };
  }, []);

  useEffect(() => {
    if (!selectedConversationId || !currentUserId || activeMessages.length === 0) {
      return;
    }

    const unreadIncomingMessages = activeMessages.filter(
      (message) =>
        message.senderId !== currentUserId &&
        !message.readUserIds.includes(currentUserId) &&
        !pendingReadIdsRef.current.has(message.id)
    );

    if (unreadIncomingMessages.length === 0) {
      return;
    }

    const latestUnreadMessage = unreadIncomingMessages[unreadIncomingMessages.length - 1];

    setConversations((previousConversations) =>
      previousConversations.map((conversation) =>
        conversation.id === selectedConversationId
          ? {
              ...conversation,
              unreadCount: 0,
              currentUserState: conversation.currentUserState
                ? {
                    ...conversation.currentUserState,
                    last_read_message_id:
                      latestUnreadMessage.id ||
                      conversation.currentUserState.last_read_message_id,
                    last_read_at:
                      latestUnreadMessage.createdAt ||
                      conversation.currentUserState.last_read_at,
                  }
                : conversation.currentUserState,
            }
          : conversation
      )
    );

    unreadIncomingMessages.forEach((message) => {
      pendingReadIdsRef.current.add(message.id);
      api
        .markMessageRead(message.id)
        .then((updatedMessage) => {
          replaceMessageInState(
            selectedConversationId,
            normalizeMessage(updatedMessage, 0) || message
          );
        })
        .catch(() => null)
        .finally(() => {
          pendingReadIdsRef.current.delete(message.id);
        });
    });
  }, [activeMessages, currentUserId, replaceMessageInState, selectedConversationId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (!selectedConversationId) {
      setSocketStatus('idle');
      return undefined;
    }

    const cableUrl = getCableUrl();
    if (!cableUrl || typeof window.WebSocket !== 'function') {
      setSocketStatus('unsupported');
      return undefined;
    }

    let isUnmounted = false;
    let shouldReconnect = true;
    let activeSocket = null;

    const connect = () => {
      if (isUnmounted) {
        return;
      }

      setSocketStatus('connecting');

      try {
        activeSocket = new window.WebSocket(cableUrl);
        conversationSocketRef.current = activeSocket;
      } catch {
        setSocketStatus('error');
        return;
      }

      activeSocket.addEventListener('open', () => {
        if (isUnmounted) {
          return;
        }

        setSocketStatus('connected');
        activeSocket.send(buildConversationSubscriptionPayload(selectedConversationId));
      });

      activeSocket.addEventListener('message', (event) => {
        if (isUnmounted) {
          return;
        }

        let parsedPayload = null;
        try {
          parsedPayload = JSON.parse(event.data);
        } catch {
          return;
        }

        if (parsedPayload?.type === 'reject_subscription') {
          shouldReconnect = false;
          setSocketStatus('rejected');
          return;
        }

        const realtimeEvent = extractCableEventPayload(parsedPayload);
        if (!realtimeEvent || realtimeEvent.type !== 'message.created') {
          return;
        }

        const normalizedMessage = normalizeMessage(realtimeEvent.message, 0);
        const conversationId = toId(
          realtimeEvent.conversation_id ?? normalizedMessage?.conversationId
        );

        if (!normalizedMessage || conversationId !== selectedConversationId) {
          return;
        }

        replaceMessageInState(conversationId, normalizedMessage);
      });

      activeSocket.addEventListener('close', () => {
        if (isUnmounted) {
          return;
        }

        conversationSocketRef.current = null;
        setSocketStatus('disconnected');

        if (!shouldReconnect) {
          return;
        }

        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, CHAT_SOCKET_RECONNECT_DELAY_MS);
      });

      activeSocket.addEventListener('error', () => {
        if (isUnmounted) {
          return;
        }

        setSocketStatus('error');
      });
    };

    connect();

    return () => {
      isUnmounted = true;
      shouldReconnect = false;

      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      const socketToClose = conversationSocketRef.current || activeSocket;
      if (socketToClose && socketToClose.readyState === window.WebSocket.OPEN) {
        try {
          socketToClose.send(buildConversationUnsubscribePayload(selectedConversationId));
        } catch {
          // ignore close race
        }
      }

      if (
        socketToClose &&
        socketToClose.readyState !== window.WebSocket.CLOSED &&
        socketToClose.readyState !== window.WebSocket.CLOSING
      ) {
        socketToClose.close();
      }

      if (conversationSocketRef.current === socketToClose) {
        conversationSocketRef.current = null;
      }
    };
  }, [replaceMessageInState, selectedConversationId]);

  useEffect(() => {
    if (!endOfMessagesRef.current) {
      return;
    }
    endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeMessages.length, selectedConversationId]);

  useEffect(() => {
    if (!selectedRecipientId) {
      return;
    }

    if (!availableRecipientOptions.some((recipient) => recipient.id === selectedRecipientId)) {
      setSelectedRecipientId('');
    }
  }, [availableRecipientOptions, selectedRecipientId]);

  useEffect(() => {
    if (!isNewConversationOpen) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsNewConversationOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isNewConversationOpen]);

  const handleConversationSelect = (conversationId) => {
    setSelectedConversationId(conversationId);
    setMessagesError('');
  };

  const handleFileChange = (event) => {
    const fileList = Array.from(event.target.files || []);
    setSelectedFiles(fileList);
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!selectedConversationId || sendingMessage) {
      return;
    }

    const trimmedMessage = draftMessage.trim();
    if (!trimmedMessage && selectedFiles.length === 0) {
      return;
    }

    setSendingMessage(true);
    setMessagesError('');

    try {
      const payload = buildMessageFormData(trimmedMessage, selectedFiles);
      const response = await api.createConversationMessage(selectedConversationId, payload);
      const nextMessage = normalizeMessage(response, 0);
      if (nextMessage) {
        replaceMessageInState(selectedConversationId, nextMessage);
      }
      setDraftMessage('');
      setSelectedFiles([]);
    } catch (error) {
      setMessagesError(error.message || 'Не успеа испраќањето на пораката.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleReactionToggle = async (message, reactionType) => {
    if (!message || !reactionType) {
      return;
    }

    const alreadySelected = hasCurrentUserReaction(message, reactionType, currentUserId);

    try {
      const response = alreadySelected
        ? await api.removeMessageReaction(message.id, reactionType)
        : await api.addMessageReaction(message.id, reactionType);
      const updatedMessage = normalizeMessage(response, 0);
      if (updatedMessage) {
        replaceMessageInState(message.conversationId, updatedMessage);
      }
    } catch (error) {
      onNotify?.(error.message || 'Не успеа ажурирањето на реакцијата.', 'error');
    }
  };

  const handleStartConversation = async (event) => {
    event.preventDefault();
    if (!selectedRecipientId || startingConversation) {
      return;
    }

    if (!storedSchoolId) {
      setStartConversationError('Недостасува избрано училиште за разговорот.');
      return;
    }

    setStartingConversation(true);
    setStartConversationError('');

    try {
      const payload = {
        school_id: Number(storedSchoolId),
        conversation_type: 'direct',
        participant_ids: [Number(selectedRecipientId)],
      };
      const conversationResponse = await api.createConversation(payload);
      const nextConversation = normalizeConversation(conversationResponse, 0);
      const conversationId = nextConversation?.id || toId(conversationResponse?.id);

      if (nextConversation) {
        setConversations((previousConversations) => {
          const existingConversation = previousConversations.find(
            (conversation) => conversation.id === nextConversation.id
          );
          if (!existingConversation) {
            return sortConversations([...previousConversations, nextConversation]);
          }

          return sortConversations(
            previousConversations.map((conversation) =>
              conversation.id === nextConversation.id
                ? { ...conversation, ...nextConversation }
                : conversation
            )
          );
        });
      }

      if (conversationId) {
        setSelectedConversationId(conversationId);
        await loadMessages(conversationId, { silent: true });
      }

      const trimmedMessage = newConversationMessage.trim();
      if (conversationId && trimmedMessage) {
        const messageResponse = await api.createConversationMessage(
          conversationId,
          buildMessageFormData(trimmedMessage, [])
        );
        const nextMessage = normalizeMessage(messageResponse, 0);
        if (nextMessage) {
          replaceMessageInState(conversationId, nextMessage);
        }
      }

      setNewConversationMessage('');
      setIsNewConversationOpen(false);
      onNotify?.(
        trimmedMessage ? 'Разговорот е започнат и пораката е испратена.' : 'Разговорот е отворен.',
        'success'
      );
    } catch (error) {
      setStartConversationError(error.message || 'Не успеа започнувањето на разговорот.');
    } finally {
      setStartingConversation(false);
    }
  };

  return (
    <section className="dashboard-card content-card chat-messages-card">
      <div className="chat-messages-heading">
        <div>
          <p className="auth-eyebrow">Messages</p>
          <h1 className="section-title">Пораки</h1>
          <p className="item-meta">
            Разговори меѓу наставници и меѓу наставници и ученици.
          </p>
        </div>
        <div className="chat-heading-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsNewConversationOpen(true)}
          >
            Нова порака
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setRefreshKey((currentValue) => currentValue + 1)}
          >
            Освежи
          </button>
        </div>
      </div>

      <div className="chat-messages-shell">
        <aside className="chat-conversation-list" aria-label="Листа на разговори">
          <div className="chat-conversation-list-header">
            <strong>Inbox</strong>
            {conversationsLoading ? <span className="item-meta">Се вчитува...</span> : null}
          </div>

          {conversationsError ? <p className="auth-error">{conversationsError}</p> : null}

          {!conversationsLoading && conversations.length === 0 ? (
            <div className="chat-empty-state">
              <p className="item-meta">
                Сè уште нема разговори. Разговор ќе се појави тука штом постои активна конверзација.
              </p>
            </div>
          ) : null}

          <div className="chat-conversation-items">
            {conversations.map((conversation) => {
              const participant = getOtherParticipant(conversation, currentUserId);
              const previewMessage = conversation.lastMessage;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  className={`chat-conversation-item ${
                    selectedConversationId === conversation.id ? 'is-selected' : ''
                  }`}
                  onClick={() => handleConversationSelect(conversation.id)}
                >
                  <div className="chat-conversation-top">
                    <strong>{participant?.fullName || 'Разговор'}</strong>
                    <span className="notification-time">
                      {toIsoText(conversation.lastMessageAt || conversation.createdAt)}
                    </span>
                  </div>
                  <p className="item-meta">
                    {participant?.roles?.length ? participant.roles.join(', ') : 'директен разговор'}
                  </p>
                  <p className="chat-conversation-preview">{getMessagePreview(previewMessage)}</p>
                  <div className="chat-conversation-meta">
                    <span
                      className={`chat-presence-pill presence-${participant?.presenceStatus || 'offline'}`}
                    >
                      {toPresenceLabel(participant?.presenceStatus || 'offline')}
                    </span>
                    {conversation.unreadCount > 0 ? (
                      <span className="chat-unread-badge">{conversation.unreadCount}</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="chat-thread-panel">
          {selectedConversation ? (
            <>
              <header className="chat-thread-header">
                <div>
                  <p className="auth-eyebrow">Разговор</p>
                  <h2 className="section-title">{otherParticipant?.fullName || 'Пораки'}</h2>
                  <p className="item-meta">
                    {otherParticipant?.email || 'Нема дополнителни податоци'}
                  </p>
                </div>
                <div className="chat-thread-status">
                  <span
                    className={`chat-presence-pill presence-${otherParticipant?.presenceStatus || 'offline'}`}
                  >
                    {toPresenceLabel(otherParticipant?.presenceStatus || 'offline')}
                  </span>
                  <span className="item-meta">
                    {socketStatus === 'connected'
                      ? 'Realtime: поврзано'
                      : socketStatus === 'connecting'
                        ? 'Realtime: се поврзува...'
                        : socketStatus === 'rejected'
                          ? 'Realtime: одбиена претплата'
                          : socketStatus === 'unsupported'
                            ? 'Realtime: не е достапно'
                            : 'Realtime: HTTP освежување'}
                  </span>
                  {otherParticipant?.lastSeenAt ? (
                    <span className="item-meta">
                      Последно активен/на: {toIsoText(otherParticipant.lastSeenAt)}
                    </span>
                  ) : null}
                </div>
              </header>

              <div className="chat-thread-body">
                {messagesLoading ? <p className="item-meta">Се вчитуваат пораките...</p> : null}
                {messagesError ? <p className="auth-error">{messagesError}</p> : null}

                {!messagesLoading && activeMessages.length === 0 ? (
                  <div className="chat-empty-state">
                    <p className="item-meta">
                      Сè уште нема пораки во овој разговор. Започни со кратка порака или прилог.
                    </p>
                  </div>
                ) : null}

                {activeMessages.length > 0 ? (
                  <div className="ai-message-list chat-message-list">
                    {activeMessages.map((message) => {
                      const isOwnMessage = message.senderId === currentUserId;
                      return (
                        <article
                          key={message.id}
                          className={`ai-message-item chat-message-item ${
                            isOwnMessage ? 'ai-role-user' : 'ai-role-assistant'
                          } ${isOwnMessage ? 'is-own-message' : ''}`}
                        >
                          <div className="chat-message-top">
                            <strong>{isOwnMessage ? 'Ти' : message.senderName}</strong>
                            <span className="notification-time">
                              {toIsoText(message.createdAt)}
                            </span>
                          </div>

                          {message.body ? <p>{message.body}</p> : null}

                          {message.attachments.length > 0 ? (
                            <div className="chat-attachment-list">
                              {message.attachments.map((attachment) => {
                                const isImage =
                                  attachment.attachmentType === 'image' ||
                                  attachment.contentType.startsWith('image/');
                                return (
                                  <a
                                    key={attachment.id}
                                    className={`chat-attachment-item ${
                                      isImage ? 'is-image-attachment' : 'is-file-attachment'
                                    }`}
                                    href={attachment.fileUrl || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {isImage && attachment.fileUrl ? (
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
                          ) : null}

                          <div className="chat-message-meta">
                            <div className="chat-reaction-row">
                              {REACTION_OPTIONS.map((reactionOption) => {
                                const count = getReactionCount(message, reactionOption.value);
                                const active = hasCurrentUserReaction(
                                  message,
                                  reactionOption.value,
                                  currentUserId
                                );

                                return (
                                  <button
                                    key={reactionOption.value}
                                    type="button"
                                    className={`chat-reaction-chip ${active ? 'is-active' : ''}`}
                                    onClick={() =>
                                      handleReactionToggle(message, reactionOption.value)
                                    }
                                    aria-label={reactionOption.label}
                                  >
                                    <span>{reactionOption.icon}</span>
                                    <span>{count}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {isOwnMessage ? (
                              <p className="chat-message-status">
                                {getOutgoingStatusLabel(message, otherParticipant?.id)}
                              </p>
                            ) : null}
                          </div>
                        </article>
                      );
                    })}
                    <div ref={endOfMessagesRef} />
                  </div>
                ) : null}
              </div>

              <form className="chat-message-form" onSubmit={handleSendMessage}>
                <label>
                  Нова порака
                  <textarea
                    rows={3}
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    placeholder="Напиши порака до наставникот или ученикот..."
                    disabled={sendingMessage}
                  />
                </label>

                <div className="chat-form-actions">
                  <label className="btn btn-ghost chat-file-picker">
                    <input type="file" multiple onChange={handleFileChange} />
                    Додај прилог
                  </label>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={sendingMessage || (!draftMessage.trim() && selectedFiles.length === 0)}
                  >
                    {sendingMessage ? 'Се испраќа...' : 'Испрати порака'}
                  </button>
                </div>

                {selectedFiles.length > 0 ? (
                  <div className="chat-file-list">
                    {selectedFiles.map((file) => (
                      <span key={`${file.name}-${file.size}`} className="chat-file-pill">
                        {file.name}
                      </span>
                    ))}
                  </div>
                ) : null}
              </form>
            </>
          ) : (
            <div className="chat-empty-state chat-thread-empty">
              <p className="item-meta">Одбери разговор од левата страна за да ги видиш пораките.</p>
            </div>
          )}
        </div>
      </div>

      {isNewConversationOpen ? (
        <div className="modal-overlay" role="presentation">
          <button
            type="button"
            className="ai-tutor-backdrop"
            onClick={() => setIsNewConversationOpen(false)}
            aria-label="Затвори нова порака"
          />
          <div className="modal-card chat-modal-card" role="dialog" aria-modal="true">
            <form className="chat-new-conversation-card" onSubmit={handleStartConversation}>
              <div className="chat-new-conversation-header">
                <div>
                  <p className="auth-eyebrow">Нова порака</p>
                  <h2 className="section-title">
                    {isTeacher
                      ? 'Започни разговор со ученик'
                      : 'Започни разговор со наставник'}
                  </h2>
                  <p className="item-meta">
                    {isTeacher
                      ? 'Избери клас, пребарај ученик и прати ја првата порака.'
                      : 'Пребарај наставник што е поврзан со твојот клас или предмет и разговорот ќе се отвори веднаш.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsNewConversationOpen(false)}
                >
                  Затвори
                </button>
              </div>

              <div className="chat-new-conversation-controls">
                {isTeacher ? (
                  <label>
                    Клас
                    <select
                      value={selectedClassroomId}
                      onChange={(event) => {
                        setSelectedClassroomId(event.target.value);
                        setSelectedRecipientId('');
                        setRecipientSearch('');
                        setStartConversationError('');
                      }}
                      disabled={classroomsLoading || startingConversation}
                    >
                      {teacherClassrooms.length === 0 ? (
                        <option value="">Нема достапни класови</option>
                      ) : null}
                      {teacherClassrooms.map((classroom) => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <label>
                  {`Пребарај ${recipientTypeLabel}`}
                  <input
                    type="search"
                    value={recipientSearch}
                    onChange={(event) => setRecipientSearch(event.target.value)}
                    placeholder="Име, е-пошта..."
                    disabled={
                      startingConversation ||
                      (isTeacher ? recipientsLoading || !selectedClassroomId : false)
                    }
                  />
                </label>
              </div>

              {classroomsError ? <p className="auth-error">{classroomsError}</p> : null}
              {recipientsError ? <p className="auth-error">{recipientsError}</p> : null}
              {startConversationError ? <p className="auth-error">{startConversationError}</p> : null}

              <div
                className="chat-recipient-list"
                role="listbox"
                aria-label={`${recipientTypePluralLabel} за порака`}
              >
                {isTeacher && recipientsLoading ? (
                  <p className="item-meta">Се вчитуваат учениците...</p>
                ) : null}
                {!recipientsLoading && filteredRecipients.length === 0 ? (
                  <div className="chat-empty-state">
                    <p className="item-meta">
                      {isTeacher
                        ? 'Нема ученици што одговараат на избраниот клас или пребарувањето.'
                        : 'Нема наставници што одговараат на твојот клас, предметите или пребарувањето.'}
                    </p>
                  </div>
                ) : null}
                {filteredRecipients.map((recipient) => (
                  <button
                    key={recipient.id}
                    type="button"
                    className={`chat-recipient-item ${
                      selectedRecipientId === recipient.id ? 'is-selected' : ''
                    }`}
                    onClick={() => {
                      setSelectedRecipientId(recipient.id);
                      setStartConversationError('');
                    }}
                  >
                    <strong>{recipient.fullName}</strong>
                    <span className="item-meta">
                      {recipient.email ||
                        [recipient.classroomName, recipient.subjectName]
                          .filter(Boolean)
                          .join(' · ') ||
                        recipientTypeLabel}
                    </span>
                  </button>
                ))}
              </div>

              <label>
                Прва порака
                <textarea
                  rows={3}
                  value={newConversationMessage}
                  onChange={(event) => setNewConversationMessage(event.target.value)}
                  placeholder={
                    isTeacher
                      ? 'Напиши ја првата порака до ученикот...'
                      : 'Напиши ја првата порака до наставникот...'
                  }
                  disabled={startingConversation || !selectedRecipientId}
                />
              </label>

              <div className="chat-new-conversation-actions">
                <span className="item-meta">
                  {selectedRecipient
                    ? `Избран ${recipientTypeLabel}: ${selectedRecipient.fullName}`
                    : `Избери ${recipientTypeLabel} од листата за да започнеш разговор.`}
                </span>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!selectedRecipientId || startingConversation}
                >
                  {startingConversation
                    ? 'Се отвора разговор...'
                    : newConversationMessage.trim()
                      ? 'Испрати и отвори разговор'
                      : 'Отвори разговор'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default ChatMessagesPanel;
