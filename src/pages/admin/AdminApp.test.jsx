import { render, screen, waitFor, within } from '@testing-library/react';
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

test('admin login page renders on /admin/login without an active admin session', () => {
  window.history.replaceState({}, '', '/admin/login');

  const meSpy = jest.spyOn(adminApi, 'me');

  render(<AdminApp />);

  expect(screen.getByRole('heading', { name: 'Администраторски пристап' })).toBeInTheDocument();
  expect(meSpy).not.toHaveBeenCalled();
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
    expect(adminApi.adminClassrooms).toHaveBeenCalledWith({ limit: 100 });
    expect(adminApi.adminSubjects).toHaveBeenCalledWith({ limit: 100 });
  });

  expect(
    screen.getByRole('heading', { name: 'ОУ Браќа Миладиновци' })
  ).toBeInTheDocument();
  expect(screen.getByText('Јована Георгиева')).toBeInTheDocument();
  expect(screen.getByText('Марија Стојанова')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'People' })).toHaveClass('is-active');
  expect(screen.getByRole('button', { name: 'Green palette' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
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

  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'Teachers' })).toBeInTheDocument();
  });

  await userEvent.click(screen.getByLabelText('Покани наставник'));
  await userEvent.type(screen.getByLabelText('Е-пошта'), 'newteacher@school.mk');
  await userEvent.click(screen.getByRole('button', { name: 'Invite' }));

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

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'People' })).toHaveClass('is-active');
  });

  await userEvent.click(screen.getByRole('button', { name: 'Setup' }));
  await userEvent.click(screen.getByRole('button', { name: 'Create' }));
  await userEvent.click(screen.getByRole('button', { name: 'Subject' }));
  const dialog = screen.getByRole('dialog');
  await userEvent.type(within(dialog).getByLabelText('Име на предмет'), 'Физика');
  await userEvent.type(within(dialog).getByLabelText('Код'), 'PHY-8');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

  await waitFor(() => {
    expect(createSubjectSpy).toHaveBeenCalledWith({ name: 'Физика', code: 'PHY-8' });
  });

  expect(adminSubjectsSpy).toHaveBeenCalled();
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
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save assignments' }));

  await waitFor(() => {
    expect(updateTeacherSubjectsSpy).toHaveBeenCalledWith(20, { subject_ids: [4] });
  });
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

  render(<AdminApp />);

  const teacherButton = (await screen.findByText('Јована Георгиева')).closest('button');
  await userEvent.click(teacherButton);

  const dialog = await screen.findByRole('dialog');
  await userEvent.selectOptions(within(dialog).getByLabelText('Паралелки'), '11');
  await userEvent.selectOptions(within(dialog).getByLabelText('Предмети'), '5');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save assignments' }));

  await waitFor(() => {
    expect(updateTeacherClassroomsSpy).toHaveBeenCalledWith(20, { classroom_ids: [10, 11] });
    expect(updateTeacherSubjectsSpy).toHaveBeenCalledWith(20, { subject_ids: [4, 5] });
  });
});

test('people student row opens assignment modal and updates classroom relations through backend endpoints', async () => {
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

  render(<AdminApp />);

  const studentButton = (await screen.findByText('Марија Стојанова')).closest('button');
  await userEvent.click(studentButton);

  const dialog = await screen.findByRole('dialog');
  await userEvent.selectOptions(within(dialog).getByLabelText('Паралелки'), '11');
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save assignments' }));

  await waitFor(() => {
    expect(updateStudentClassroomsSpy).toHaveBeenCalledWith(30, { classroom_ids: [10, 11] });
  });
});
