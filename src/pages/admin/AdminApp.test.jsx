import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminApp from './AdminApp';
import {
  ADMIN_STORAGE_KEYS,
  adminApi,
  clearAdminSession,
} from '../../services/adminApiClient';

beforeEach(() => {
  jest.restoreAllMocks();
  clearAdminSession();
  window.localStorage.removeItem(ADMIN_STORAGE_KEYS.theme);
  window.localStorage.removeItem(ADMIN_STORAGE_KEYS.palette);
});

async function openAdminPeopleTab() {
  await userEvent.click(await screen.findByRole('button', { name: 'People' }));
}

async function openAdminSetupTab() {
  await userEvent.click(await screen.findByRole('button', { name: 'Setup' }));
}

test('admin login page renders on /admin/login without an active admin session', () => {
  window.history.replaceState({}, '', '/admin/login');

  const meSpy = jest.spyOn(adminApi, 'me');

  render(<AdminApp />);

  expect(screen.getByRole('heading', { name: 'Администраторски пристап' })).toBeInTheDocument();
  expect(meSpy).not.toHaveBeenCalled();
});

test('admin can log in without an active school selection', async () => {
  window.history.replaceState({}, '', '/admin/login');

  jest.spyOn(adminApi, 'login').mockResolvedValue({
    user: {
      id: 9,
      full_name: 'Админ Тест',
      roles: ['admin'],
    },
  });
  jest.spyOn(adminApi, 'me').mockResolvedValue({
    user: {
      id: 9,
      full_name: 'Админ Тест',
      roles: ['admin'],
    },
    schools: [],
  });
  const adminSchoolDetailsSpy = jest.spyOn(adminApi, 'adminSchoolDetails');
  const adminTeachersSpy = jest.spyOn(adminApi, 'adminTeachers');

  render(<AdminApp />);

  await userEvent.type(screen.getByLabelText('Е-пошта'), 'admin@edu.mk');
  await userEvent.type(screen.getByLabelText('Лозинка'), 'password123');
  await userEvent.click(screen.getByRole('button', { name: 'Најава како администратор' }));

  await waitFor(() => {
    expect(window.location.pathname).toBe('/admin/dashboard');
  });

  expect(
    await screen.findByRole('heading', { name: 'Училишна подготовка' })
  ).toBeInTheDocument();
  expect(window.localStorage.getItem(ADMIN_STORAGE_KEYS.loggedIn)).toBe('true');
  expect(window.localStorage.getItem(ADMIN_STORAGE_KEYS.schoolId)).toBeNull();
  expect(adminSchoolDetailsSpy).not.toHaveBeenCalled();
  expect(adminTeachersSpy).not.toHaveBeenCalled();
});

test('admin with no schools can create the first school from the overview hero', async () => {
  window.history.replaceState({}, '', '/admin/login');

  jest.spyOn(adminApi, 'login').mockResolvedValue({
    user: {
      id: 9,
      full_name: 'Нов Админ',
      roles: ['admin'],
    },
  });
  jest
    .spyOn(adminApi, 'me')
    .mockResolvedValueOnce({
      user: {
        id: 9,
        full_name: 'Нов Админ',
        roles: ['admin'],
      },
      schools: [],
    })
    .mockResolvedValueOnce({
      user: {
        id: 9,
        full_name: 'Нов Админ',
        roles: ['admin'],
      },
      schools: [],
    });
  const createSchoolSpy = jest.spyOn(adminApi, 'createAdminSchool').mockResolvedValue({
    id: 15,
    name: 'ОУ Нова Школа',
    code: 'OU-NS',
    city: 'Скопје',
    active: true,
    classroom_count: 0,
    subject_count: 0,
    teacher_count: 0,
    student_count: 0,
  });
  const adminSchoolDetailsSpy = jest.spyOn(adminApi, 'adminSchoolDetails').mockResolvedValue({
    id: 15,
    name: 'ОУ Нова Школа',
    code: 'OU-NS',
    city: 'Скопје',
    active: true,
    classrooms: [],
    subjects: [],
  });
  jest.spyOn(adminApi, 'adminTeachers').mockResolvedValue({ teachers: [] });
  jest.spyOn(adminApi, 'adminStudents').mockResolvedValue({ students: [], meta: { total: 0 } });
  jest.spyOn(adminApi, 'adminClassrooms').mockResolvedValue({ classrooms: [] });
  jest.spyOn(adminApi, 'adminSubjects').mockResolvedValue({ subjects: [] });

  render(<AdminApp />);

  await userEvent.type(screen.getByLabelText('Е-пошта'), 'admin@edu.mk');
  await userEvent.type(screen.getByLabelText('Лозинка'), 'password123');
  await userEvent.click(screen.getByRole('button', { name: 'Најава како администратор' }));

  expect(
    await screen.findByRole('heading', { name: 'Училишна подготовка' })
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Overview' })).toHaveClass('is-active');
  expect(screen.getByRole('button', { name: 'Додади ново училиште' })).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Додади ново училиште' }));

  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByLabelText('Код')).toHaveAttribute(
    'pattern',
    '[A-Za-z]{2}-[A-Za-z0-9]{2,4}'
  );
  await userEvent.type(within(dialog).getByLabelText('Име на училиште'), 'ОУ Нова Школа');
  await userEvent.type(within(dialog).getByLabelText('Код'), 'OU-NS');
  await userEvent.type(within(dialog).getByLabelText('Град'), 'Скопје');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Креирај училиште' }));

  await waitFor(() => {
    expect(createSchoolSpy).toHaveBeenCalledWith({
      name: 'ОУ Нова Школа',
      code: 'OU-NS',
      city: 'Скопје',
      active: true,
    });
  });

  await waitFor(() => {
    expect(adminSchoolDetailsSpy).toHaveBeenCalledWith('15');
  });
  expect(await screen.findByRole('heading', { name: 'ОУ Нова Школа' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Додади ново училиште' })).not.toBeInTheDocument();
  expect(window.localStorage.getItem(ADMIN_STORAGE_KEYS.schoolId)).toBe('15');
});

test('admin dashboard loads the initial admin essentials for the selected school', async () => {
  window.history.replaceState({}, '', '/admin/dashboard');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.loggedIn, 'true');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  jest.spyOn(adminApi, 'me').mockResolvedValue({
    user: {
      id: 9,
      full_name: 'Админ Тест',
      roles: ['admin'],
    },
    schools: [{ id: 1, name: 'ОУ Браќа Миладиновци', code: 'OU-BM', city: 'Скопје' }],
  });
  jest.spyOn(adminApi, 'adminSchoolDetails').mockResolvedValue({
    id: 1,
    name: 'ОУ Браќа Миладиновци',
    code: 'OU-BM',
    city: 'Скопје',
    active: true,
    classrooms: [{ id: 10, name: '7-A', grade_level: '7', academic_year: '2025/2026' }],
    subjects: [{ id: 4, name: 'Математика', code: 'MAT-7', topics: [{ id: 12, name: 'Дробки' }] }],
  });
  jest.spyOn(adminApi, 'adminTeachers').mockResolvedValue({
    teachers: [
      {
        id: 20,
        full_name: 'Јована Георгиева',
        email: 'teacher@edu.mk',
        invitation_status: 'pending',
        classroom_ids: [10],
        subject_ids: [4],
      },
    ],
  });
  jest.spyOn(adminApi, 'adminStudents').mockResolvedValue({
    students: [
      {
        id: 30,
        full_name: 'Марија Стојанова',
        email: 'student@edu.mk',
        invitation_status: 'accepted',
        classroom_ids: [10],
      },
    ],
  });
  jest.spyOn(adminApi, 'adminClassrooms').mockResolvedValue({
    classrooms: [
      {
        id: 10,
        name: '7-A',
        grade_level: '7',
        academic_year: '2025/2026',
        student_count: 24,
        teacher_count: 3,
      },
    ],
  });
  jest.spyOn(adminApi, 'adminSubjects').mockResolvedValue({
    subjects: [
      {
        id: 4,
        name: 'Математика',
        code: 'MAT-7',
        topics: [{ id: 12, name: 'Дробки' }],
        teacher_ids: [20],
        classroom_ids: [10],
      },
    ],
  });

  render(<AdminApp />);

  await waitFor(() => {
    expect(adminApi.me).toHaveBeenCalledTimes(1);
    expect(adminApi.adminSchoolDetails).toHaveBeenCalledWith('1');
    expect(adminApi.adminTeachers).toHaveBeenCalledWith({ limit: 100 });
    expect(adminApi.adminStudents).toHaveBeenCalledWith({ limit: 100 });
    expect(adminApi.adminStudents).toHaveBeenCalledWith({ limit: 25, offset: 0 });
    expect(adminApi.adminClassrooms).toHaveBeenCalledWith({ limit: 100 });
    expect(adminApi.adminSubjects).toHaveBeenCalledWith({ limit: 100 });
  });

  expect(
    screen.getByRole('heading', { name: 'ОУ Браќа Миладиновци' })
  ).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Додади ново училиште' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Overview' })).toHaveClass('is-active');
  await openAdminPeopleTab();
  expect(screen.getByText('Јована Георгиева')).toBeInTheDocument();
  expect(screen.getByText('Марија Стојанова')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'People' })).toHaveClass('is-active');
  expect(screen.getByRole('button', { name: 'Green palette' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

test('people students section paginates 25 per page without reloading teachers', async () => {
  window.history.replaceState({}, '', '/admin/dashboard');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.loggedIn, 'true');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  const students = Array.from({ length: 30 }, (_, index) => ({
    id: index + 1,
    full_name: `Ученик ${index + 1}`,
    email: `student${String(index + 1).padStart(3, '0')}@edu.mk`,
    invitation_status: 'accepted',
    active: true,
    classroom_ids: [],
  }));

  jest.spyOn(adminApi, 'me').mockResolvedValue({
    user: {
      id: 9,
      full_name: 'Админ Тест',
      roles: ['admin'],
    },
    schools: [{ id: 1, name: 'ОУ Браќа Миладиновци', code: 'OU-BM', city: 'Скопје' }],
  });
  jest.spyOn(adminApi, 'adminSchoolDetails').mockResolvedValue({
    id: 1,
    name: 'ОУ Браќа Миладиновци',
    code: 'OU-BM',
    city: 'Скопје',
    active: true,
    classrooms: [],
    subjects: [],
  });
  const adminTeachersSpy = jest.spyOn(adminApi, 'adminTeachers').mockResolvedValue({
    teachers: [
      {
        id: 20,
        full_name: 'Јована Георгиева',
        email: 'teacher@edu.mk',
        invitation_status: 'accepted',
        active: true,
        classroom_ids: [],
        subject_ids: [],
      },
    ],
  });
  const adminStudentsSpy = jest.spyOn(adminApi, 'adminStudents').mockImplementation((params = {}) => {
    if (params.offset !== undefined || params.limit === 25) {
      const offset = Number(params.offset || 0);
      const page = Math.floor(offset / 25) + 1;
      return Promise.resolve({
        students: students.slice((page - 1) * 25, page * 25),
      });
    }

    return Promise.resolve({
      students,
      meta: { total: students.length },
    });
  });
  jest.spyOn(adminApi, 'adminClassrooms').mockResolvedValue({ classrooms: [] });
  jest.spyOn(adminApi, 'adminSubjects').mockResolvedValue({ subjects: [] });

  render(<AdminApp />);

  await openAdminPeopleTab();
  expect(await screen.findByText('Ученик 1')).toBeInTheDocument();
  expect(screen.queryByText('Ученик 26')).not.toBeInTheDocument();
  expect(screen.getByText('Јована Георгиева')).toBeInTheDocument();
  expect(screen.getByText('Прикажани 1-25 од 30')).toBeInTheDocument();
  expect(within(screen.getByText('Ученик 1').closest('button')).queryByText('0 паралелки')).not.toBeInTheDocument();

  await act(async () => {
    await userEvent.click(screen.getByRole('button', { name: '2' }));
  });

  await waitFor(() => {
    expect(adminStudentsSpy).toHaveBeenCalledWith({ limit: 25, offset: 25 });
    expect(screen.getByText('Ученик 26')).toBeInTheDocument();
  });

  expect(screen.queryByText('Ученик 1')).not.toBeInTheDocument();
  expect(screen.getByText('Прикажани 26-30 од 30')).toBeInTheDocument();
  expect(adminTeachersSpy).toHaveBeenCalledTimes(1);
});

test('student assignment modal can navigate to the dedicated edit page and save basic fields', async () => {
  window.history.replaceState({}, '', '/admin/dashboard');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.loggedIn, 'true');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  jest.spyOn(adminApi, 'me').mockResolvedValue({
    user: { id: 9, full_name: 'Админ Тест', roles: ['admin'] },
    schools: [{ id: 1, name: 'ОУ Браќа Миладиновци', code: 'OU-BM', city: 'Скопје' }],
  });
  jest.spyOn(adminApi, 'adminSchoolDetails').mockResolvedValue({
    id: 1,
    name: 'ОУ Браќа Миладиновци',
    code: 'OU-BM',
    city: 'Скопје',
    active: true,
    classrooms: [],
    subjects: [],
  });
  jest.spyOn(adminApi, 'adminTeachers').mockResolvedValue({ teachers: [] });
  jest.spyOn(adminApi, 'adminStudents').mockResolvedValue({
    students: [
      {
        id: 30,
        full_name: 'Марија Стојанова',
        email: 'student@edu.mk',
        invitation_status: 'accepted',
        active: true,
        classroom_ids: [10],
      },
    ],
    meta: { total: 1 },
  });
  jest.spyOn(adminApi, 'adminClassrooms').mockResolvedValue({
    classrooms: [{ id: 10, name: '7-A', grade_level: '7', academic_year: '2025/2026' }],
  });
  jest.spyOn(adminApi, 'adminSubjects').mockResolvedValue({ subjects: [] });
  const adminStudentSpy = jest.spyOn(adminApi, 'adminStudent').mockResolvedValue({
    id: 30,
    email: 'student@edu.mk',
    first_name: 'Марија',
    last_name: 'Стојанова',
    full_name: 'Марија Стојанова',
    invitation_status: 'accepted',
    active: true,
    classroom_ids: [10],
    student_profile: { grade_level: '7', student_number: 'ST-30' },
  });
  const updateAdminStudentSpy = jest.spyOn(adminApi, 'updateAdminStudent').mockResolvedValue({
    id: 30,
  });

  render(<AdminApp />);

  await openAdminPeopleTab();
  const studentButton = (await screen.findByText('Марија Стојанова')).closest('button');
  await userEvent.click(studentButton);

  const dialog = await screen.findByRole('dialog');
  await act(async () => {
    await userEvent.click(within(dialog).getByLabelText('Отвори уредување за ученик'));
  });

  await waitFor(() => {
    expect(window.location.pathname).toBe('/admin/students/30/edit');
  });
  expect(await screen.findByRole('heading', { name: 'Уреди ученик' })).toBeInTheDocument();
  expect(adminStudentSpy).toHaveBeenCalledWith('30');

  const firstNameInput = screen.getByLabelText('Име');
  await userEvent.clear(firstNameInput);
  await userEvent.type(firstNameInput, 'Марија Ажурирана');
  await userEvent.click(screen.getByRole('button', { name: 'Сними ученик' }));

  await waitFor(() => {
    expect(updateAdminStudentSpy).toHaveBeenCalledWith('30', {
      email: 'student@edu.mk',
      first_name: 'Марија Ажурирана',
      last_name: 'Стојанова',
      student_profile: {
        grade_level: '7',
        student_number: 'ST-30',
      },
    });
  });
});

test('teacher edit page can load directly from route and save basic fields', async () => {
  window.history.replaceState({}, '', '/admin/teachers/20/edit');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.loggedIn, 'true');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  jest.spyOn(adminApi, 'me').mockResolvedValue({
    user: { id: 9, full_name: 'Админ Тест', roles: ['admin'] },
    schools: [{ id: 1, name: 'ОУ Браќа Миладиновци', code: 'OU-BM', city: 'Скопје' }],
  });
  jest.spyOn(adminApi, 'adminSchoolDetails').mockResolvedValue({
    id: 1,
    name: 'ОУ Браќа Миладиновци',
    code: 'OU-BM',
    city: 'Скопје',
    active: true,
    classrooms: [],
    subjects: [],
  });
  jest.spyOn(adminApi, 'adminTeachers').mockResolvedValue({ teachers: [] });
  jest.spyOn(adminApi, 'adminStudents').mockResolvedValue({ students: [], meta: { total: 0 } });
  jest.spyOn(adminApi, 'adminClassrooms').mockResolvedValue({ classrooms: [] });
  jest.spyOn(adminApi, 'adminSubjects').mockResolvedValue({ subjects: [] });
  const adminTeacherSpy = jest.spyOn(adminApi, 'adminTeacher').mockResolvedValue({
    id: 20,
    email: 'teacher@edu.mk',
    first_name: 'Јована',
    last_name: 'Георгиева',
    full_name: 'Јована Георгиева',
    invitation_status: 'accepted',
    active: true,
    classroom_ids: [10],
    subject_ids: [4],
    teacher_profile: { title: 'Проф.' },
  });
  const updateAdminTeacherSpy = jest.spyOn(adminApi, 'updateAdminTeacher').mockResolvedValue({
    id: 20,
  });

  await act(async () => {
    render(<AdminApp />);
  });

  expect(await screen.findByRole('heading', { name: 'Уреди наставник' })).toBeInTheDocument();
  expect(adminTeacherSpy).toHaveBeenCalledWith('20');

  const lastNameInput = screen.getByLabelText('Презиме');
  await userEvent.clear(lastNameInput);
  await userEvent.type(lastNameInput, 'Георгиевска');
  await userEvent.click(screen.getByRole('button', { name: 'Сними наставник' }));

  await waitFor(() => {
    expect(updateAdminTeacherSpy).toHaveBeenCalledWith('20', {
      email: 'teacher@edu.mk',
      first_name: 'Јована',
      last_name: 'Георгиевска',
      teacher_profile: {
        title: 'Проф.',
      },
    });
  });
});

test('pending teacher assignment modal shows resend invitation action and triggers resend endpoint', async () => {
  window.history.replaceState({}, '', '/admin/dashboard');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.loggedIn, 'true');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  jest.spyOn(adminApi, 'me').mockResolvedValue({
    user: { id: 9, full_name: 'Админ Тест', roles: ['admin'] },
    schools: [{ id: 1, name: 'ОУ Браќа Миладиновци', code: 'OU-BM', city: 'Скопје' }],
  });
  jest.spyOn(adminApi, 'adminSchoolDetails').mockResolvedValue({
    id: 1,
    name: 'ОУ Браќа Миладиновци',
    code: 'OU-BM',
    city: 'Скопје',
    active: true,
    classrooms: [],
    subjects: [],
  });
  const adminTeachersSpy = jest.spyOn(adminApi, 'adminTeachers').mockResolvedValue({
    teachers: [
      {
        id: 20,
        full_name: 'Јована Георгиева',
        email: 'teacher@edu.mk',
        invitation_status: 'pending',
        active: false,
        classroom_ids: [10],
        subject_ids: [4],
      },
    ],
  });
  jest.spyOn(adminApi, 'adminStudents').mockResolvedValue({ students: [] });
  jest.spyOn(adminApi, 'adminClassrooms').mockResolvedValue({
    classrooms: [{ id: 10, name: '7-A', grade_level: '7', academic_year: '2025/2026' }],
  });
  jest.spyOn(adminApi, 'adminSubjects').mockResolvedValue({
    subjects: [{ id: 4, name: 'Математика', code: 'MAT-7', teacher_ids: [20], classroom_ids: [10] }],
  });
  jest.spyOn(adminApi, 'adminTeacher').mockResolvedValue({
    id: 20,
    full_name: 'Јована Георгиева',
    email: 'teacher@edu.mk',
    invitation_status: 'pending',
    invitation_last_sent_at: '2026-03-21T08:00:00Z',
    active: false,
    classroom_ids: [10],
    subject_ids: [4],
  });
  const resendTeacherInvitationSpy = jest
    .spyOn(adminApi, 'resendAdminTeacherInvitation')
    .mockResolvedValue({
      id: 20,
      full_name: 'Јована Георгиева',
      email: 'teacher@edu.mk',
      invitation_status: 'pending',
      invitation_last_sent_at: '2026-03-21T09:00:00Z',
      active: false,
      classroom_ids: [10],
      subject_ids: [4],
    });

  render(<AdminApp />);

  await openAdminPeopleTab();
  const teacherButton = (await screen.findByText('Јована Георгиева')).closest('button');
  await userEvent.click(teacherButton);

  const dialog = await screen.findByRole('dialog');
  const resendButton = within(dialog).getByRole('button', {
    name: 'Испрати покана повторно за наставник',
  });
  expect(resendButton).toBeInTheDocument();

  await userEvent.click(resendButton);

  await waitFor(() => {
    expect(resendTeacherInvitationSpy).toHaveBeenCalledWith('20');
  });
  expect(adminTeachersSpy).toHaveBeenCalledTimes(2);
});

test('admin can open the teacher invite modal and submit an email invitation', async () => {
  window.history.replaceState({}, '', '/admin/dashboard');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.loggedIn, 'true');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  jest.spyOn(adminApi, 'me').mockResolvedValue({
    user: {
      id: 9,
      full_name: 'Админ Тест',
      roles: ['admin'],
    },
    schools: [{ id: 1, name: 'ОУ Браќа Миладиновци', code: 'OU-BM', city: 'Скопје' }],
  });
  jest.spyOn(adminApi, 'adminSchoolDetails').mockResolvedValue({
    id: 1,
    name: 'ОУ Браќа Миладиновци',
    code: 'OU-BM',
    city: 'Скопје',
    active: true,
    classrooms: [],
    subjects: [],
  });
  jest.spyOn(adminApi, 'adminTeachers').mockResolvedValue({
    teachers: [],
  });
  jest.spyOn(adminApi, 'adminStudents').mockResolvedValue({
    students: [],
  });
  jest.spyOn(adminApi, 'adminClassrooms').mockResolvedValue({
    classrooms: [],
  });
  jest.spyOn(adminApi, 'adminSubjects').mockResolvedValue({
    subjects: [],
  });
  const createTeacherSpy = jest
    .spyOn(adminApi, 'createAdminTeacher')
    .mockResolvedValue({ id: 99, email: 'newteacher@school.mk', invitation_status: 'pending' });

  render(<AdminApp />);

  await openAdminPeopleTab();
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'Teachers' })).toBeInTheDocument();
  });

  await userEvent.click(screen.getByLabelText('Покани наставник'));
  await userEvent.type(screen.getByLabelText('Е-пошта'), 'newteacher@school.mk');
  await userEvent.click(screen.getByRole('button', { name: 'Испрати покана' }));

  await waitFor(() => {
    expect(createTeacherSpy).toHaveBeenCalledWith({ email: 'newteacher@school.mk' });
  });
});

test('admin can switch the palette accent color', async () => {
  window.history.replaceState({}, '', '/admin/dashboard');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.loggedIn, 'true');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  jest.spyOn(adminApi, 'me').mockResolvedValue({
    user: {
      id: 9,
      full_name: 'Админ Тест',
      roles: ['admin'],
    },
    schools: [{ id: 1, name: 'ОУ Браќа Миладиновци', code: 'OU-BM', city: 'Скопје' }],
  });
  jest.spyOn(adminApi, 'adminSchoolDetails').mockResolvedValue({
    id: 1,
    name: 'ОУ Браќа Миладиновци',
    code: 'OU-BM',
    city: 'Скопје',
    active: true,
    classrooms: [],
    subjects: [],
  });
  jest.spyOn(adminApi, 'adminTeachers').mockResolvedValue({ teachers: [] });
  jest.spyOn(adminApi, 'adminStudents').mockResolvedValue({ students: [] });
  jest.spyOn(adminApi, 'adminClassrooms').mockResolvedValue({ classrooms: [] });
  jest.spyOn(adminApi, 'adminSubjects').mockResolvedValue({ subjects: [] });

  render(<AdminApp />);

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Green palette' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  await userEvent.click(screen.getByRole('button', { name: 'Blue palette' }));

  expect(screen.getByRole('button', { name: 'Blue palette' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

test('admin can create a subject from the setup tab create menu', async () => {
  window.history.replaceState({}, '', '/admin/dashboard');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.loggedIn, 'true');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  jest.spyOn(adminApi, 'me').mockResolvedValue({
    user: {
      id: 9,
      full_name: 'Админ Тест',
      roles: ['admin'],
    },
    schools: [{ id: 1, name: 'ОУ Браќа Миладиновци', code: 'OU-BM', city: 'Скопје' }],
  });
  jest.spyOn(adminApi, 'adminSchoolDetails').mockResolvedValue({
    id: 1,
    name: 'ОУ Браќа Миладиновци',
    code: 'OU-BM',
    city: 'Скопје',
    active: true,
    classrooms: [],
    subjects: [],
  });
  jest.spyOn(adminApi, 'adminTeachers').mockResolvedValue({ teachers: [] });
  jest.spyOn(adminApi, 'adminStudents').mockResolvedValue({ students: [] });
  jest.spyOn(adminApi, 'adminClassrooms').mockResolvedValue({ classrooms: [] });
  const adminSubjectsSpy = jest
    .spyOn(adminApi, 'adminSubjects')
    .mockResolvedValue({ subjects: [] });
  const createSubjectSpy = jest
    .spyOn(adminApi, 'createAdminSubject')
    .mockResolvedValue({ id: 41, name: 'Физика', code: 'PHY-8' });

  render(<AdminApp />);

  expect(await screen.findByRole('button', { name: 'Overview' })).toHaveClass('is-active');
  await openAdminSetupTab();
  await userEvent.click(screen.getByRole('button', { name: 'Create' }));
  await userEvent.click(screen.getByRole('button', { name: 'Subject' }));
  const dialog = screen.getByRole('dialog');
  await userEvent.type(within(dialog).getByLabelText('Име на предмет'), 'Физика');
  await userEvent.type(within(dialog).getByLabelText('Код'), 'PHY-8');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Креирај предмет' }));

  await waitFor(() => {
    expect(createSubjectSpy).toHaveBeenCalledWith({ name: 'Физика', code: 'PHY-8' });
  });

  expect(adminSubjectsSpy).toHaveBeenCalled();
});

test('admin can open the schedule editor from the setup create menu', async () => {
  window.history.replaceState({}, '', '/admin/dashboard');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.loggedIn, 'true');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  jest.spyOn(adminApi, 'me').mockResolvedValue({
    user: {
      id: 9,
      full_name: 'Админ Тест',
      roles: ['admin'],
    },
    schools: [{ id: 1, name: 'ОУ Браќа Миладиновци', code: 'OU-BM', city: 'Скопје' }],
  });
  jest.spyOn(adminApi, 'adminSchoolDetails').mockResolvedValue({
    id: 1,
    name: 'ОУ Браќа Миладиновци',
    code: 'OU-BM',
    city: 'Скопје',
    active: true,
    classrooms: [{ id: 10, name: '7-A', grade_level: '7', academic_year: '2025/2026' }],
    subjects: [{ id: 4, name: 'Физика', code: 'PHY-8' }],
  });
  jest.spyOn(adminApi, 'adminTeachers').mockResolvedValue({
    teachers: [
      {
        id: 20,
        full_name: 'Јована Георгиева',
        email: 'teacher@edu.mk',
        invitation_status: 'accepted',
        active: true,
        classroom_ids: [10],
        subject_ids: [4],
      },
    ],
  });
  jest.spyOn(adminApi, 'adminStudents').mockResolvedValue({ students: [] });
  jest.spyOn(adminApi, 'adminClassrooms').mockResolvedValue({
    classrooms: [
      {
        id: 10,
        name: '7-A',
        grade_level: '7',
        academic_year: '2025/2026',
        room_name: 'Кабинет 12',
        room_label: 'A-12',
      },
    ],
  });
  jest.spyOn(adminApi, 'adminSubjects').mockResolvedValue({
    subjects: [{ id: 4, name: 'Физика', code: 'PHY-8', teacher_ids: [20] }],
  });
  const scheduleSpy = jest.spyOn(adminApi, 'adminClassroomSchedule').mockResolvedValue({
    classroom: { id: 10, name: '7-A', room_name: 'Кабинет 12', room_label: 'A-12' },
    slots: [
      {
        id: 901,
        day_of_week: 'monday',
        period_number: 1,
        subject_id: 4,
        teacher_id: 20,
        display_room_name: 'Кабинет 12',
        display_room_label: 'A-12',
      },
    ],
    available_subjects: [{ id: 4, name: 'Физика', code: 'PHY-8', room_name: '', room_label: '' }],
    available_teachers: [
      {
        id: 20,
        full_name: 'Јована Георгиева',
        classroom_ids: [10],
        subject_ids: [4],
        room_name: '',
        room_label: '',
      },
    ],
  });

  render(<AdminApp />);

  expect(await screen.findByRole('button', { name: 'Overview' })).toHaveClass('is-active');
  await act(async () => {
    await openAdminSetupTab();
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    await userEvent.click(screen.getByRole('button', { name: 'Schedule' }));
  });

  await waitFor(() => {
    expect(scheduleSpy).toHaveBeenCalledWith('10');
  });

  expect(screen.getByRole('heading', { name: 'Распоред по паралелка' })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/admin/schedule');
  expect(screen.getByDisplayValue('Физика')).toBeInTheDocument();
});

test('schedule editor falls back to assigned teacher roster when schedule payload teacher options are incomplete', async () => {
  window.history.replaceState({}, '', '/admin/dashboard');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.loggedIn, 'true');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  jest.spyOn(adminApi, 'me').mockResolvedValue({
    user: {
      id: 9,
      full_name: 'Админ Тест',
      roles: ['admin'],
    },
    schools: [{ id: 1, name: 'ОУ Браќа Миладиновци', code: 'OU-BM', city: 'Скопје' }],
  });
  jest.spyOn(adminApi, 'adminSchoolDetails').mockResolvedValue({
    id: 1,
    name: 'ОУ Браќа Миладиновци',
    code: 'OU-BM',
    city: 'Скопје',
    active: true,
    classrooms: [{ id: 10, name: '2-A', grade_level: '2', academic_year: '2026-2027' }],
    subjects: [{ id: 4, name: 'Биологија 2', code: 'BIO-2' }],
  });
  jest.spyOn(adminApi, 'adminTeachers').mockResolvedValue({
    teachers: [
      {
        id: 20,
        full_name: 'Јована Георгиева',
        email: 'teacher@edu.mk',
        invitation_status: 'pending',
        active: false,
        classroom_ids: [],
        subject_ids: [],
      },
    ],
  });
  jest.spyOn(adminApi, 'adminStudents').mockResolvedValue({ students: [] });
  jest.spyOn(adminApi, 'adminClassrooms').mockResolvedValue({
    classrooms: [
      { id: 10, name: '2-A', grade_level: '2', academic_year: '2026-2027', teacher_ids: [20] },
    ],
  });
  jest.spyOn(adminApi, 'adminSubjects').mockResolvedValue({
    subjects: [{ id: 4, name: 'Биологија 2', code: 'BIO-2', teacher_ids: [20], classroom_ids: [10] }],
  });
  jest.spyOn(adminApi, 'adminClassroomSchedule').mockResolvedValue({
    classroom: { id: 10, name: '2-A' },
    slots: [
      {
        id: 901,
        day_of_week: 'monday',
        period_number: 1,
        subject_id: 4,
        teacher_id: '',
      },
    ],
    available_subjects: [{ id: 4, name: 'Биологија 2', code: 'BIO-2', teacher_ids: [20] }],
    available_teachers: [],
  });

  render(<AdminApp />);

  await openAdminSetupTab();
  await userEvent.click(screen.getByRole('button', { name: 'Create' }));
  await userEvent.click(screen.getByRole('button', { name: 'Schedule' }));

  expect(await screen.findByRole('heading', { name: 'Распоред по паралелка' })).toBeInTheDocument();
  expect(screen.getByDisplayValue('Биологија 2')).toBeInTheDocument();
  expect(screen.getAllByRole('option', { name: 'Јована Георгиева' }).length).toBeGreaterThan(0);
});

test('people tab does not show accepted but inactive users as active', async () => {
  window.history.replaceState({}, '', '/admin/dashboard');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.loggedIn, 'true');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  jest.spyOn(adminApi, 'me').mockResolvedValue({
    user: {
      id: 9,
      full_name: 'Админ Тест',
      roles: ['admin'],
    },
    schools: [{ id: 1, name: 'ОУ Браќа Миладиновци', code: 'OU-BM', city: 'Скопје' }],
  });
  jest.spyOn(adminApi, 'adminSchoolDetails').mockResolvedValue({
    id: 1,
    name: 'ОУ Браќа Миладиновци',
    code: 'OU-BM',
    city: 'Скопје',
    active: true,
    classrooms: [],
    subjects: [],
  });
  jest.spyOn(adminApi, 'adminTeachers').mockResolvedValue({
    teachers: [
      {
        id: 20,
        full_name: 'Јована Георгиева',
        email: 'teacher@edu.mk',
        invitation_status: 'accepted',
        active: false,
        classroom_ids: [10],
        subject_ids: [4],
      },
    ],
  });
  jest.spyOn(adminApi, 'adminStudents').mockResolvedValue({ students: [] });
  jest.spyOn(adminApi, 'adminClassrooms').mockResolvedValue({ classrooms: [] });
  jest.spyOn(adminApi, 'adminSubjects').mockResolvedValue({ subjects: [] });

  render(<AdminApp />);

  await openAdminPeopleTab();
  expect(await screen.findByText('Јована Георгиева')).toBeInTheDocument();
  expect(screen.getByText('Деактивиран')).toBeInTheDocument();
  expect(screen.queryByText('Активен')).not.toBeInTheDocument();
});

test('setup subject assignment modal updates teacher subject relations through admin endpoints', async () => {
  window.history.replaceState({}, '', '/admin/dashboard');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.loggedIn, 'true');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  jest.spyOn(adminApi, 'me').mockResolvedValue({
    user: {
      id: 9,
      full_name: 'Админ Тест',
      roles: ['admin'],
    },
    schools: [{ id: 1, name: 'ОУ Браќа Миладиновци', code: 'OU-BM', city: 'Скопје' }],
  });
  jest.spyOn(adminApi, 'adminSchoolDetails').mockResolvedValue({
    id: 1,
    name: 'ОУ Браќа Миладиновци',
    code: 'OU-BM',
    city: 'Скопје',
    active: true,
    classrooms: [{ id: 10, name: '7-A', grade_level: '7', academic_year: '2025/2026' }],
    subjects: [{ id: 4, name: 'Математика', code: 'MAT-7', topics: [] }],
  });
  jest.spyOn(adminApi, 'adminTeachers').mockResolvedValue({
    teachers: [
      {
        id: 20,
        full_name: 'Јована Георгиева',
        email: 'teacher@edu.mk',
        invitation_status: 'accepted',
        active: true,
        classroom_ids: [10],
        subject_ids: [],
      },
    ],
  });
  jest.spyOn(adminApi, 'adminStudents').mockResolvedValue({ students: [] });
  jest.spyOn(adminApi, 'adminClassrooms').mockResolvedValue({
    classrooms: [{ id: 10, name: '7-A', grade_level: '7', academic_year: '2025/2026' }],
  });
  jest.spyOn(adminApi, 'adminSubjects').mockResolvedValue({
    subjects: [{ id: 4, name: 'Математика', code: 'MAT-7', teacher_ids: [], classroom_ids: [] }],
  });
  const updateTeacherSubjectsSpy = jest
    .spyOn(adminApi, 'updateAdminTeacherSubjects')
    .mockResolvedValue({ success: true });

  render(<AdminApp />);

  await userEvent.click(await screen.findByRole('button', { name: 'Setup' }));
  await userEvent.click(screen.getByRole('button', { name: /Математика/i }));

  const dialog = await screen.findByRole('dialog');
  await userEvent.selectOptions(within(dialog).getByLabelText('Наставници'), '20');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Сними предмет' }));

  await waitFor(() => {
    expect(updateTeacherSubjectsSpy).toHaveBeenCalledWith(20, { subject_ids: [4] });
  });
});

test('setup subject modal shows assigned teachers from subject relations even when teacher payload lacks subject ids', async () => {
  window.history.replaceState({}, '', '/admin/dashboard');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.loggedIn, 'true');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  jest.spyOn(adminApi, 'me').mockResolvedValue({
    user: {
      id: 9,
      full_name: 'Админ Тест',
      roles: ['admin'],
    },
    schools: [{ id: 1, name: 'ОУ Браќа Миладиновци', code: 'OU-BM', city: 'Скопје' }],
  });
  jest.spyOn(adminApi, 'adminSchoolDetails').mockResolvedValue({
    id: 1,
    name: 'ОУ Браќа Миладиновци',
    code: 'OU-BM',
    city: 'Скопје',
    active: true,
    classrooms: [],
    subjects: [{ id: 4, name: 'Физика', code: 'PHY-BM', topics: [] }],
  });
  jest.spyOn(adminApi, 'adminTeachers').mockResolvedValue({
    teachers: [
      {
        id: 20,
        full_name: 'Јована Георгиева',
        email: 'teacher@edu.mk',
        invitation_status: 'accepted',
        active: true,
        classroom_ids: [],
      },
    ],
  });
  jest.spyOn(adminApi, 'adminStudents').mockResolvedValue({ students: [] });
  jest.spyOn(adminApi, 'adminClassrooms').mockResolvedValue({ classrooms: [] });
  jest.spyOn(adminApi, 'adminSubjects').mockResolvedValue({
    subjects: [{ id: 4, name: 'Физика', code: 'PHY-BM', teacher_ids: [20], classroom_ids: [] }],
  });

  render(<AdminApp />);

  await userEvent.click(await screen.findByRole('button', { name: 'Setup' }));
  await userEvent.click(screen.getByRole('button', { name: /Физика/i }));

  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByText('Јована Георгиева')).toBeInTheDocument();
  expect(
    within(dialog).queryByText('Сè уште нема наставници за овој предмет.')
  ).not.toBeInTheDocument();
});

test('setup classroom list uses classroom membership arrays for student counts', async () => {
  window.history.replaceState({}, '', '/admin/dashboard');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.loggedIn, 'true');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  jest.spyOn(adminApi, 'me').mockResolvedValue({
    user: {
      id: 9,
      full_name: 'Админ Тест',
      roles: ['admin'],
    },
    schools: [{ id: 1, name: 'ОУ Браќа Миладиновци', code: 'OU-BM', city: 'Скопје' }],
  });
  jest.spyOn(adminApi, 'adminSchoolDetails').mockResolvedValue({
    id: 1,
    name: 'ОУ Браќа Миладиновци',
    code: 'OU-BM',
    city: 'Скопје',
    active: true,
    classrooms: [{ id: 10, name: '7-A', grade_level: '7', academic_year: '2025/2026' }],
    subjects: [],
  });
  jest.spyOn(adminApi, 'adminTeachers').mockResolvedValue({ teachers: [] });
  jest.spyOn(adminApi, 'adminStudents').mockResolvedValue({ students: [] });
  jest.spyOn(adminApi, 'adminClassrooms').mockResolvedValue({
    classrooms: [
      {
        id: 10,
        name: '7-A',
        grade_level: '7',
        academic_year: '2025/2026',
        classroom_users: [{ student_id: 30 }, { student_id: 31 }],
        teacher_classrooms: [{ teacher_id: 20 }],
      },
    ],
  });
  jest.spyOn(adminApi, 'adminSubjects').mockResolvedValue({ subjects: [] });

  render(<AdminApp />);

  await userEvent.click(await screen.findByRole('button', { name: 'Setup' }));

  expect(screen.getByText('2 ученици')).toBeInTheDocument();
  expect(screen.getByText('1 наставници')).toBeInTheDocument();
});

test('people teacher row opens assignment modal and updates teacher relations through backend endpoints', async () => {
  window.history.replaceState({}, '', '/admin/dashboard');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.loggedIn, 'true');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  jest.spyOn(adminApi, 'me').mockResolvedValue({
    user: { id: 9, full_name: 'Админ Тест', roles: ['admin'] },
    schools: [{ id: 1, name: 'ОУ Браќа Миладиновци', code: 'OU-BM', city: 'Скопје' }],
  });
  jest.spyOn(adminApi, 'adminSchoolDetails').mockResolvedValue({
    id: 1,
    name: 'ОУ Браќа Миладиновци',
    code: 'OU-BM',
    city: 'Скопје',
    active: true,
    classrooms: [],
    subjects: [],
  });
  jest.spyOn(adminApi, 'adminTeachers').mockResolvedValue({
    teachers: [
      {
        id: 20,
        full_name: 'Јована Георгиева',
        email: 'teacher@edu.mk',
        invitation_status: 'accepted',
        active: true,
        classroom_ids: [10],
        subject_ids: [4],
      },
    ],
  });
  jest.spyOn(adminApi, 'adminStudents').mockResolvedValue({
    students: [{ id: 30, full_name: 'Марија Стојанова', email: 'student@edu.mk', classroom_ids: [10] }],
  });
  jest.spyOn(adminApi, 'adminClassrooms').mockResolvedValue({
    classrooms: [
      { id: 10, name: '7-A', grade_level: '7', academic_year: '2025/2026' },
      { id: 11, name: '7-B', grade_level: '7', academic_year: '2025/2026' },
    ],
  });
  jest.spyOn(adminApi, 'adminSubjects').mockResolvedValue({
    subjects: [
      { id: 4, name: 'Математика', code: 'MAT-7', teacher_ids: [20], classroom_ids: [10] },
      { id: 5, name: 'Физика', code: 'PHY-7', teacher_ids: [], classroom_ids: [] },
    ],
  });
  const updateTeacherClassroomsSpy = jest
    .spyOn(adminApi, 'updateAdminTeacherClassrooms')
    .mockResolvedValue({ success: true });
  const updateTeacherSubjectsSpy = jest
    .spyOn(adminApi, 'updateAdminTeacherSubjects')
    .mockResolvedValue({ success: true });
  const adminTeacherSpy = jest.spyOn(adminApi, 'adminTeacher').mockResolvedValue({
    id: 20,
    full_name: 'Јована Георгиева',
    email: 'teacher@edu.mk',
    invitation_status: 'accepted',
    active: true,
    classroom_ids: [10],
    subject_ids: [4],
  });

  render(<AdminApp />);

  await openAdminPeopleTab();
  const teacherButton = (await screen.findByText('Јована Георгиева')).closest('button');
  await userEvent.click(teacherButton);

  const dialog = await screen.findByRole('dialog');
  expect(adminTeacherSpy).toHaveBeenCalledWith('20');
  await userEvent.selectOptions(within(dialog).getByLabelText('Паралелки'), '11');
  await userEvent.selectOptions(within(dialog).getByLabelText('Предмети'), '5');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Сними наставник' }));

  await waitFor(() => {
    expect(updateTeacherClassroomsSpy).toHaveBeenCalledWith(20, { classroom_ids: [10, 11] });
    expect(updateTeacherSubjectsSpy).toHaveBeenCalledWith(20, { subject_ids: [4, 5] });
  });
});

test('people student row opens assignment modal with existing classrooms from full data and updates relations', async () => {
  window.history.replaceState({}, '', '/admin/dashboard');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.loggedIn, 'true');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolId, '1');
  window.localStorage.setItem(ADMIN_STORAGE_KEYS.schoolName, 'ОУ Браќа Миладиновци');

  jest.spyOn(adminApi, 'me').mockResolvedValue({
    user: { id: 9, full_name: 'Админ Тест', roles: ['admin'] },
    schools: [{ id: 1, name: 'ОУ Браќа Миладиновци', code: 'OU-BM', city: 'Скопје' }],
  });
  jest.spyOn(adminApi, 'adminSchoolDetails').mockResolvedValue({
    id: 1,
    name: 'ОУ Браќа Миладиновци',
    code: 'OU-BM',
    city: 'Скопје',
    active: true,
    classrooms: [],
    subjects: [],
  });
  jest.spyOn(adminApi, 'adminTeachers').mockResolvedValue({
    teachers: [
      {
        id: 20,
        full_name: 'Јована Георгиева',
        email: 'teacher@edu.mk',
        invitation_status: 'accepted',
        active: true,
        classroom_ids: [10, 11],
        subject_ids: [4],
      },
    ],
  });
  jest.spyOn(adminApi, 'adminStudents').mockImplementation((params = {}) => {
    if (params.limit === 25) {
      return Promise.resolve({
        students: [
          {
            id: 30,
            full_name: 'Марија Стојанова',
            email: 'student@edu.mk',
            invitation_status: 'accepted',
            active: true,
          },
        ],
      });
    }

    return Promise.resolve({
      students: [
        {
          id: 30,
          full_name: 'Марија Стојанова',
          email: 'student@edu.mk',
          invitation_status: 'accepted',
          active: true,
          classroom_ids: [10],
        },
      ],
    });
  });
  jest.spyOn(adminApi, 'adminClassrooms').mockResolvedValue({
    classrooms: [
      { id: 10, name: '7-A', grade_level: '7', academic_year: '2025/2026' },
      { id: 11, name: '7-B', grade_level: '7', academic_year: '2025/2026' },
    ],
  });
  jest.spyOn(adminApi, 'adminSubjects').mockResolvedValue({
    subjects: [{ id: 4, name: 'Математика', code: 'MAT-7', teacher_ids: [20], classroom_ids: [10, 11] }],
  });
  const updateStudentClassroomsSpy = jest
    .spyOn(adminApi, 'updateAdminStudentClassrooms')
    .mockResolvedValue({ success: true });
  const adminStudentSpy = jest.spyOn(adminApi, 'adminStudent').mockResolvedValue({
    id: 30,
    full_name: 'Марија Стојанова',
    email: 'student@edu.mk',
    invitation_status: 'accepted',
    active: true,
    classroom_ids: [10],
  });

  render(<AdminApp />);

  await openAdminPeopleTab();
  const studentButton = (await screen.findByText('Марија Стојанова')).closest('button');
  await userEvent.click(studentButton);

  const dialog = await screen.findByRole('dialog');
  expect(adminStudentSpy).toHaveBeenCalledWith('30');
  expect(within(dialog).getByText('7-A')).toBeInTheDocument();
  await userEvent.selectOptions(within(dialog).getByLabelText('Паралелки'), '11');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Сними ученик' }));

  await waitFor(() => {
    expect(updateStudentClassroomsSpy).toHaveBeenCalledWith(30, { classroom_ids: [10, 11] });
  });
});
