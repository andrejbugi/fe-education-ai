import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ChatMessagesPanel from './ChatMessagesPanel';
import { STORAGE_KEYS } from '../services/apiClient';

function createJsonResponse(body, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

function normalizeUrl(input) {
  const url = typeof input === 'string' ? input : input.url;
  const marker = '/api/v1';
  const markerIndex = url.indexOf(marker);
  return markerIndex >= 0 ? url.slice(markerIndex) : url;
}

function installFetchMock(routeMap) {
  global.fetch = jest.fn((input, options = {}) => {
    const method = (options.method || 'GET').toUpperCase();
    const url = normalizeUrl(input);
    const key = `${method} ${url}`;
    const response = routeMap[key];

    if (!response) {
      throw new Error(`Unhandled fetch: ${key}`);
    }

    if (typeof response === 'function') {
      const result = response({ input, options, url, method });
      if (typeof result?.status === 'number') {
        return createJsonResponse(result.body, result.status);
      }
      return createJsonResponse(result);
    }

    if (typeof response?.status === 'number') {
      return createJsonResponse(response.body, response.status);
    }

    return createJsonResponse(response);
  });
}

class MockWebSocket {
  static instances = [];

  static OPEN = 1;
  static CLOSED = 3;
  static CLOSING = 2;
  static CONNECTING = 0;

  constructor(url) {
    this.url = url;
    this.readyState = MockWebSocket.CONNECTING;
    this.listeners = {
      open: [],
      message: [],
      close: [],
      error: [],
    };
    this.sentMessages = [];
    MockWebSocket.instances.push(this);
  }

  addEventListener(type, listener) {
    this.listeners[type]?.push(listener);
  }

  send(payload) {
    this.sentMessages.push(payload);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
  }

  emit(type, payload = {}) {
    if (type === 'open') {
      this.readyState = MockWebSocket.OPEN;
    }
    if (type === 'close') {
      this.readyState = MockWebSocket.CLOSED;
    }

    const eventPayload =
      type === 'message'
        ? { data: payload.data }
        : payload;

    (this.listeners[type] || []).forEach((listener) => listener(eventPayload));
  }
}

describe('ChatMessagesPanel realtime', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(STORAGE_KEYS.token, 'jwt-token');
    window.localStorage.setItem(
      STORAGE_KEYS.user,
      JSON.stringify({
        id: 45,
        email: 'student1@edu.mk',
        full_name: 'Марија Стојанова',
        roles: ['student'],
      })
    );
    window.localStorage.setItem(STORAGE_KEYS.schoolId, '1');
    MockWebSocket.instances = [];
    window.WebSocket = MockWebSocket;
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('subscribes to cable and appends incoming realtime messages', async () => {
    installFetchMock({
      'GET /api/v1/conversations?limit=100&offset=0': [
        {
          id: 11,
          school_id: 1,
          conversation_type: 'direct',
          active: true,
          last_message_at: '2026-03-17T10:00:00.000Z',
          created_at: '2026-03-17T09:00:00.000Z',
          updated_at: '2026-03-17T10:00:00.000Z',
          participants: [
            {
              id: 45,
              email: 'student1@edu.mk',
              full_name: 'Марија Стојанова',
              roles: ['student'],
              presence_status: 'online',
            },
            {
              id: 8,
              email: 'teacher@example.com',
              full_name: 'Boris Teacher',
              roles: ['teacher'],
              presence_status: 'online',
            },
          ],
          current_user_state: {
            joined_at: '2026-03-17T09:00:00.000Z',
            last_read_message_id: null,
            last_read_at: null,
            active: true,
          },
          unread_count: 0,
          last_message: null,
        },
      ],
      'GET /api/v1/conversations/11/messages?limit=100&offset=0': [],
      'POST /api/v1/presence/update': {
        user_id: 45,
        status: 'online',
        last_seen_at: '2026-03-17T10:00:00.000Z',
      },
      'POST /api/v1/messages/99/read': {
        id: 99,
        conversation_id: 11,
        sender_id: 8,
        sender_name: 'Boris Teacher',
        body: 'Нова порака во живо',
        message_type: 'text',
        status: 'read',
        reply_to_message_id: null,
        edited_at: null,
        deleted_at: null,
        created_at: '2026-03-17T10:05:00.000Z',
        updated_at: '2026-03-17T10:05:01.000Z',
        attachments: [],
        reactions: [],
        delivered_user_ids: [8, 45],
        read_user_ids: [8, 45],
      },
    });

    render(<ChatMessagesPanel />);

    expect((await screen.findAllByText('Boris Teacher')).length).toBeGreaterThan(0);

    const socket = MockWebSocket.instances[0];
    expect(socket).toBeDefined();
    expect(socket.url).toContain('/cable?token=jwt-token');

    await act(async () => {
      socket.emit('open');
    });

    await waitFor(() => {
      expect(socket.sentMessages).toContain(
        JSON.stringify({
          command: 'subscribe',
          identifier: JSON.stringify({
            channel: 'ConversationChannel',
            conversation_id: 11,
          }),
        })
      );
    });

    await act(async () => {
      socket.emit('message', {
        data: JSON.stringify({
          identifier: JSON.stringify({
            channel: 'ConversationChannel',
            conversation_id: 11,
          }),
          message: {
            type: 'message.created',
            conversation_id: 11,
            message: {
              id: 99,
              conversation_id: 11,
              sender_id: 8,
              sender_name: 'Boris Teacher',
              body: 'Нова порака во живо',
              message_type: 'text',
              status: 'sent',
              reply_to_message_id: null,
              edited_at: null,
              deleted_at: null,
              created_at: '2026-03-17T10:05:00.000Z',
              updated_at: '2026-03-17T10:05:00.000Z',
              attachments: [],
              reactions: [],
              delivered_user_ids: [8],
              read_user_ids: [8],
            },
          },
        }),
      });
    });

    expect((await screen.findAllByText('Нова порака во живо')).length).toBeGreaterThan(0);
    expect(await screen.findByText('Realtime: поврзано')).toBeInTheDocument();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/messages/99/read',
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Headers),
          body: undefined,
        })
      );
    });
  });

  test('lets a student start a new conversation with an allowed teacher', async () => {
    const onNotify = jest.fn();

    installFetchMock({
      'GET /api/v1/conversations?limit=100&offset=0': [],
      'POST /api/v1/presence/update': {
        user_id: 45,
        status: 'online',
        last_seen_at: '2026-03-17T10:00:00.000Z',
      },
      'POST /api/v1/conversations': ({ options }) => {
        const payload = JSON.parse(options.body);
        expect(payload).toEqual({
          school_id: 1,
          conversation_type: 'direct',
          participant_ids: [15],
        });

        return {
          id: 77,
          school_id: 1,
          conversation_type: 'direct',
          active: true,
          last_message_at: null,
          created_at: '2026-03-17T11:00:00.000Z',
          updated_at: '2026-03-17T11:00:00.000Z',
          participants: [
            {
              id: 45,
              email: 'student1@edu.mk',
              full_name: 'Марија Стојанова',
              roles: ['student'],
              presence_status: 'online',
            },
            {
              id: 15,
              email: 'ana.teacher@edu.mk',
              full_name: 'Ана Трајковска',
              roles: ['teacher'],
              presence_status: 'online',
            },
          ],
          current_user_state: {
            joined_at: '2026-03-17T11:00:00.000Z',
            last_read_message_id: null,
            last_read_at: null,
            active: true,
          },
          unread_count: 0,
          last_message: null,
        };
      },
      'GET /api/v1/conversations/77/messages?limit=100&offset=0': [],
      'POST /api/v1/conversations/77/messages': {
        id: 301,
        conversation_id: 77,
        sender_id: 45,
        sender_name: 'Марија Стојанова',
        body: 'Професорке, имам прашање за задачата.',
        message_type: 'text',
        status: 'sent',
        reply_to_message_id: null,
        edited_at: null,
        deleted_at: null,
        created_at: '2026-03-17T11:01:00.000Z',
        updated_at: '2026-03-17T11:01:00.000Z',
        attachments: [],
        reactions: [],
        delivered_user_ids: [45],
        read_user_ids: [45],
      },
    });

    render(
      <ChatMessagesPanel
        onNotify={onNotify}
        recipientSeedOptions={[
          {
            id: '15',
            fullName: 'Ана Трајковска',
            classroomName: 'IX-2',
            subjectName: 'Математика',
            roles: ['teacher'],
          },
        ]}
      />
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Нова порака' }));

    expect(await screen.findByText('Започни разговор со наставник')).toBeInTheDocument();
    expect(screen.queryByText('Клас')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Ана Трајковска/i }));
    fireEvent.change(
      screen.getByPlaceholderText('Напиши ја првата порака до наставникот...'),
      {
        target: { value: 'Професорке, имам прашање за задачата.' },
      }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Испрати и отвори разговор' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/conversations',
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Headers),
        })
      );
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/conversations/77/messages',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
    });

    expect(onNotify).toHaveBeenCalledWith(
      'Разговорот е започнат и пораката е испратена.',
      'success'
    );
  });
});
