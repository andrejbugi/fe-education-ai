import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

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

beforeEach(() => {
  window.localStorage.clear();
  window.history.pushState({}, '', '/');
  window.matchMedia = () => ({
    matches: false,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
});

afterEach(() => {
  jest.clearAllMocks();
  if (global.fetch) {
    global.fetch.mockClear?.();
  }
});

test('public invitation page loads from the FE route and accepts the invitation', async () => {
  window.history.pushState({}, '', '/invitations/test-token');
  installFetchMock({
    'GET /api/v1/invitations/test-token': {
      email: 'teacher@edu.mk',
      role_name: 'teacher',
      status: 'pending',
      accept_allowed: true,
      expires_at: '2026-03-28T10:00:00.000Z',
      accepted_at: null,
      school: {
        id: 1,
        name: 'ОУ Браќа Миладиновци',
        code: 'OU-BM',
      },
      user: {
        first_name: 'Јована',
        last_name: 'Георгиева',
      },
    },
    'POST /api/v1/invitations/test-token/accept': ({ options }) => {
      const body = JSON.parse(options.body);
      expect(body).toMatchObject({
        first_name: 'Јована',
        last_name: 'Георгиева',
        password: 'password123',
        password_confirmation: 'password123',
      });

      return {
        invitation: {
          email: 'teacher@edu.mk',
          role_name: 'teacher',
          status: 'accepted',
          accept_allowed: false,
          expires_at: '2026-03-28T10:00:00.000Z',
          accepted_at: '2026-03-21T10:00:00.000Z',
          school: {
            id: 1,
            name: 'ОУ Браќа Миладиновци',
            code: 'OU-BM',
          },
          user: {
            first_name: 'Јована',
            last_name: 'Георгиева',
          },
        },
        user: {
          id: 20,
          email: 'teacher@edu.mk',
          first_name: 'Јована',
          last_name: 'Георгиева',
          active: true,
        },
      };
    },
  });

  render(<App />);

  expect(await screen.findByRole('heading', { name: 'Прифати покана' })).toBeInTheDocument();
  expect(await screen.findByText('ОУ Браќа Миладиновци')).toBeInTheDocument();

  await userEvent.type(screen.getByLabelText('Лозинка'), 'password123');
  await userEvent.type(screen.getByLabelText('Потврди лозинка'), 'password123');
  await userEvent.click(screen.getByRole('button', { name: 'Прифати покана' }));

  expect(
    await screen.findByText('Поканата е успешно прифатена. Продолжете со најава.')
  ).toBeInTheDocument();
  expect(screen.getAllByText('Поканата е веќе прифатена.')).toHaveLength(2);
  expect(screen.getByRole('link', { name: 'Отвори најава' })).toHaveAttribute('href', '/');
});
