import { useEffect, useRef, useState } from 'react';

const STEP_LIMIT = 10;
const GRADE_LIMIT_OPTIONS = Array.from({ length: 20 }, (_, index) => String((index + 1) * 5));

function blocksToText(blocks) {
  return Array.isArray(blocks)
    ? blocks
        .map((block) => block?.text || block?.content || '')
        .filter(Boolean)
        .join('\n')
    : '';
}

function answerKeysToText(answerKeys) {
  return Array.isArray(answerKeys)
    ? answerKeys
        .map((item) => item?.value || '')
        .filter(Boolean)
        .join('\n')
    : '';
}

function createEmptyStep(position) {
  return {
    localId: `new-step-${Date.now()}-${position}`,
    id: '',
    title: '',
    content: '',
    prompt: '',
    resourceUrl: '',
    exampleAnswer: '',
    stepType: 'text',
    required: true,
    evaluationMode: 'manual',
    contentJsonText: '',
    answerKeysText: '',
    caseSensitive: false,
    tolerance: '',
  };
}

function mapInitialSteps(steps) {
  if (!Array.isArray(steps) || steps.length === 0) {
    return [createEmptyStep(1)];
  }

  return [...steps]
    .sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0))
    .slice(0, STEP_LIMIT)
    .map((step, index) => ({
      localId: String(step?.id ?? `existing-step-${index + 1}`),
      id: step?.id ? String(step.id) : '',
      title: step?.title || '',
      content: step?.content || '',
      prompt: step?.prompt || '',
      resourceUrl: step?.resource_url || '',
      exampleAnswer: step?.example_answer || '',
      stepType: step?.step_type || 'text',
      required: step?.required !== false,
      evaluationMode: step?.evaluation_mode || 'manual',
      contentJsonText: blocksToText(step?.content_json),
      answerKeysText: answerKeysToText(step?.answer_keys),
      caseSensitive: Boolean(
        Array.isArray(step?.answer_keys) && step.answer_keys.some((item) => item?.case_sensitive)
      ),
      tolerance:
        Array.isArray(step?.answer_keys) && step.answer_keys[0]?.tolerance !== undefined
          ? String(step.answer_keys[0].tolerance ?? '')
          : '',
    }));
}

function buildInitialForm(initialValues, subjects, classrooms) {
  const initialSubjectId = initialValues?.subjectId || (subjects[0] ? String(subjects[0].id) : '');

  return {
    title: initialValues?.title || '',
    topic: initialValues?.topic || '',
    subjectId: initialSubjectId,
    subjectTopicId: initialValues?.subjectTopicId || '',
    classroomId:
      initialValues?.classroomId || (classrooms[0] ? String(classrooms[0].id) : ''),
    description: initialValues?.description || '',
    teacherNotes: initialValues?.teacherNotes || '',
    contentJsonText: initialValues?.contentJsonText || '',
    dueDate: initialValues?.dueDate || '',
    type: initialValues?.type || 'homework',
    points: initialValues?.points || '5',
    resourceFiles: [],
    steps: mapInitialSteps(initialValues?.steps),
  };
}

function AssignmentEditorPage({
  mode = 'create',
  loading = false,
  error = '',
  classrooms = [],
  subjects = [],
  initialValues = null,
  existingResources = [],
  onCreateTopic,
  onSave,
  onCancel,
}) {
  const initKeyRef = useRef('');
  const [form, setForm] = useState(() =>
    buildInitialForm(initialValues, subjects, classrooms)
  );
  const [newTopicName, setNewTopicName] = useState('');
  const [topicError, setTopicError] = useState('');
  const [topicLoading, setTopicLoading] = useState(false);

  useEffect(() => {
    const initKey = JSON.stringify({
      mode,
      title: initialValues?.title || '',
      assignmentId: initialValues?.assignmentId || initialValues?.title || '',
    });
    const nextForm = buildInitialForm(initialValues, subjects, classrooms);

    setForm((previous) => {
      const shouldReset = initKeyRef.current !== initKey;
      initKeyRef.current = initKey;

      if (shouldReset) {
        return nextForm;
      }

      const nextSubjectStillExists = subjects.some(
        (subject) => String(subject.id) === String(previous.subjectId)
      );
      const nextClassroomStillExists = classrooms.some(
        (classroom) => String(classroom.id) === String(previous.classroomId)
      );

      return {
        ...previous,
        subjectId: nextSubjectStillExists ? previous.subjectId : nextForm.subjectId,
        classroomId: nextClassroomStillExists ? previous.classroomId : nextForm.classroomId,
      };
    });
  }, [initialValues, subjects, classrooms, mode]);

  const updateField = (key, value) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const handleSubjectChange = (subjectId) => {
    const selectedSubject = subjects.find((subject) => String(subject.id) === String(subjectId));
    const nextTopics = Array.isArray(selectedSubject?.topics) ? selectedSubject.topics : [];
    const keepCurrentTopic = nextTopics.some(
      (topic) => String(topic.id) === String(form.subjectTopicId)
    );

    setForm((previous) => ({
      ...previous,
      subjectId,
      subjectTopicId: keepCurrentTopic ? previous.subjectTopicId : '',
      topic: keepCurrentTopic
        ? previous.topic
        : '',
    }));
    setTopicError('');
    setNewTopicName('');
  };

  const updateStep = (localId, key, value) =>
    setForm((previous) => ({
      ...previous,
      steps: previous.steps.map((step) =>
        step.localId === localId ? { ...step, [key]: value } : step
      ),
    }));

  const handleFilesChange = (event) => {
    updateField('resourceFiles', Array.from(event.target.files || []));
  };

  const handleAddStep = () => {
    setForm((previous) => {
      if (previous.steps.length >= STEP_LIMIT) {
        return previous;
      }

      return {
        ...previous,
        steps: [...previous.steps, createEmptyStep(previous.steps.length + 1)],
      };
    });
  };

  const handleRemoveStep = (localId) => {
    setForm((previous) => {
      if (previous.steps.length <= 1) {
        return previous;
      }

      return {
        ...previous,
        steps: previous.steps.filter((step) => step.localId !== localId),
      };
    });
  };

  const handleSave = () => {
    onSave?.(form);
  };

  const selectedSubject =
    subjects.find((subject) => String(subject.id) === String(form.subjectId)) || null;
  const availableTopics = Array.isArray(selectedSubject?.topics) ? selectedSubject.topics : [];

  const handleTopicChange = (topicId) => {
    const selectedTopic =
      availableTopics.find((topic) => String(topic.id) === String(topicId)) || null;

    setForm((previous) => ({
      ...previous,
      subjectTopicId: topicId,
      topic: selectedTopic?.name || '',
    }));
  };

  const handleCreateTopic = async () => {
    if (!onCreateTopic) {
      return;
    }

    setTopicLoading(true);
    setTopicError('');

    try {
      const createdTopic = await onCreateTopic(form.subjectId, newTopicName);
      setForm((previous) => ({
        ...previous,
        subjectTopicId: String(createdTopic?.id || ''),
        topic: createdTopic?.name || previous.topic,
      }));
      setNewTopicName('');
    } catch (error) {
      setTopicError(error.message || 'Не успеа креирањето на темата.');
    } finally {
      setTopicLoading(false);
    }
  };

  return (
    <section className="dashboard-card content-card assignment-editor-page">
      <div className="assignment-editor-header">
        <div>
          <p className="hero-eyebrow">Задачи</p>
          <h1 className="section-title">
            {mode === 'edit' ? 'Измени задача' : 'Нова задача'}
          </h1>
          <p className="item-meta">
            Прво намести ги основните детали, а подолу додади материјали, насоки и чекори за
            решавање.
          </p>
        </div>
        <div className="hero-actions assignment-editor-actions">
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading
              ? 'Се зачувува...'
              : mode === 'edit'
                ? 'Зачувај промени'
                : 'Зачувај задача'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Назад
          </button>
        </div>
      </div>

      <div className="assignment-editor-meta-strip">
        <span>{mode === 'edit' ? 'Измени постоечка задача' : 'Креирај нова задача'}</span>
        <span>Предмети: {subjects.length}</span>
        <span>Класови: {classrooms.length}</span>
        <span>Чекори: {form.steps.length}</span>
      </div>

      <section className="task-detail-block assignment-editor-panel assignment-editor-basic-panel">
        <div className="assignment-editor-basic-head">
          <div>
            <h2 className="section-title">Основни информации</h2>
            <p className="item-meta">
              Постави наслов, краток опис и каде треба да се додели задачата.
            </p>
          </div>
          <div className="assignment-editor-basic-badges">
            <span>{mode === 'edit' ? 'Измени задача' : 'Нова задача'}</span>
            <span>Лимит: {form.points || '5'}</span>
          </div>
        </div>

        <div className="assignment-editor-basic-grid">
          <label className="assignment-editor-title-field">
            Наслов
            <input
              type="text"
              placeholder="Наслов на задача"
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
            />
          </label>
          <label className="assignment-editor-description-field">
            Основен опис
            <textarea
              rows={4}
              placeholder="Краток опис што учениците ќе го видат веднаш."
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
            />
          </label>
        </div>

        <div className="assignment-editor-subject-topic-row">
          <label>
            Предмет
            <select
              value={form.subjectId}
              onChange={(event) => handleSubjectChange(event.target.value)}
              disabled={subjects.length === 0}
            >
              {subjects.length === 0 ? (
                <option value="">Нема предмети</option>
              ) : (
                subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))
              )}
            </select>
          </label>

          <label>
            Тема
            <select
              value={form.subjectTopicId}
              onChange={(event) => handleTopicChange(event.target.value)}
              disabled={!form.subjectId}
            >
              {!form.subjectId ? (
                <option value="">Прво избери предмет</option>
              ) : availableTopics.length === 0 ? (
                <option value="">Нема теми за овој предмет</option>
              ) : (
                <>
                  <option value="">Без тема</option>
                  {availableTopics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </label>

          <div className="assignment-editor-topic-create">
            <label>
              Нова тема
              <input
                type="text"
                placeholder="На пример: Дробки"
                value={newTopicName}
                onChange={(event) => setNewTopicName(event.target.value)}
                disabled={!form.subjectId || topicLoading}
              />
            </label>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCreateTopic}
              disabled={!form.subjectId || !newTopicName.trim() || topicLoading}
            >
              {topicLoading ? 'Се креира...' : 'Креирај тема'}
            </button>
          </div>
        </div>

        <div className="assignment-editor-controls-row">
          <label>
            Клас
            <select
              value={form.classroomId}
              onChange={(event) => updateField('classroomId', event.target.value)}
              disabled={classrooms.length === 0}
            >
              {classrooms.length === 0 ? (
                <option value="">Нема класови</option>
              ) : (
                classrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </option>
                ))
              )}
            </select>
          </label>
          <label>
            Рок
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) => updateField('dueDate', event.target.value)}
            />
          </label>
          <label>
            Лимит на оценка
            <select
              value={form.points}
              onChange={(event) => updateField('points', event.target.value)}
            >
              {GRADE_LIMIT_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        {topicError ? <p className="form-error">{topicError}</p> : null}
      </section>

      <div className="assignment-editor-scroll-hint">
        <span>Подолу</span>
        <p>Додај материјали, дополнителни насоки и чекори за решавање.</p>
      </div>

      <div className="assignment-editor-grid">
        <div className="task-detail-block assignment-editor-panel">
          <h2 className="section-title">Поставки и насоки</h2>
          <div className="modal-form">
            <label>
              Тип
              <select
                value={form.type}
                onChange={(event) => updateField('type', event.target.value)}
              >
                <option value="homework">Домашна задача</option>
                <option value="project">Проект</option>
                <option value="quiz">Квиз</option>
                <option value="test">Тест</option>
                <option value="exercise">Вежба</option>
              </select>
            </label>
            <label>
              Наставнички белешки
              <textarea
                rows={3}
                placeholder="Внатрешни белешки за наставник..."
                value={form.teacherNotes}
                onChange={(event) => updateField('teacherNotes', event.target.value)}
              />
            </label>
            <label>
              Структурирана содржина
              <textarea
                rows={5}
                placeholder="Секој нов ред ќе се испрати како block."
                value={form.contentJsonText}
                onChange={(event) => updateField('contentJsonText', event.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="task-detail-block assignment-editor-panel">
          <h2 className="section-title">Материјали</h2>
          <div className="modal-form">
            <div className="teacher-file-upload-field">
              <span className="teacher-file-upload-label">Прикачи материјали</span>
              <div className="teacher-file-upload">
                <input
                  className="teacher-file-upload-input"
                  id="assignment-editor-files"
                  type="file"
                  multiple
                  onChange={handleFilesChange}
                />
                <label htmlFor="assignment-editor-files" className="teacher-file-upload-trigger">
                  <span className="teacher-file-upload-icon" aria-hidden="true">
                    +
                  </span>
                  <span className="teacher-file-upload-copy">
                    <strong>Прикачи материјали</strong>
                    <span>
                      {form.resourceFiles.length > 0
                        ? `Избрани датотеки: ${form.resourceFiles.length}`
                        : 'PDF, слики или други прилози за задачата'}
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>
          {mode === 'edit' && existingResources.length > 0 ? (
            <div className="task-detail-block">
              <h3 className="section-title">Постоечки материјали</h3>
              <ul className="list-reset profile-activity-list">
                {existingResources.map((resource) => (
                  <li key={resource.id || resource.title} className="profile-activity-item">
                    {resource.title}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {form.resourceFiles.length > 0 ? (
            <div className="task-detail-block">
              <h3 className="section-title">Нови датотеки</h3>
              <ul className="list-reset profile-activity-list">
                {form.resourceFiles.map((file) => (
                  <li key={`${file.name}-${file.size}`} className="profile-activity-item">
                    {file.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div className="assignment-editor-steps">
        <div className="assignment-editor-steps-header">
          <div>
            <h2 className="section-title">Чекори</h2>
            <p className="item-meta">
              {form.steps.length}/{STEP_LIMIT} чекори
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAddStep}
            disabled={form.steps.length >= STEP_LIMIT}
          >
            Додај чекор
          </button>
        </div>

        <div className="teacher-assignment-list">
          {form.steps.map((step, index) => {
            const canRemove = form.steps.length > 1 && (mode === 'create' || !step.id);
            const usesAutoCheck = step.evaluationMode !== 'manual';

            return (
              <section key={step.localId} className="teacher-assignment-item assignment-step-card">
                <div className="assignment-step-header">
                  <div>
                    <h3 className="section-title">Чекор {index + 1}</h3>
                    {mode === 'edit' && step.id ? (
                      <p className="item-meta">Постоечки чекор #{step.id}</p>
                    ) : null}
                    <p className="assignment-step-chip">
                      {usesAutoCheck ? 'Автоматска проверка' : 'Потребен преглед'}
                    </p>
                  </div>
                  <div className="hero-actions">
                    {canRemove ? (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleRemoveStep(step.localId)}
                      >
                        Отстрани
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="modal-form">
                  <label>
                    Наслов на чекор
                    <input
                      type="text"
                      value={step.title}
                      onChange={(event) => updateStep(step.localId, 'title', event.target.value)}
                    />
                  </label>
                  <label>
                    Тип на чекор
                    <select
                      value={step.stepType}
                      onChange={(event) =>
                        updateStep(step.localId, 'stepType', event.target.value)
                      }
                    >
                      <option value="text">Текст</option>
                      <option value="reading">Читање</option>
                      <option value="exercise">Вежба</option>
                    </select>
                  </label>
                  <label>
                    Содржина
                    <textarea
                      rows={3}
                      value={step.content}
                      onChange={(event) => updateStep(step.localId, 'content', event.target.value)}
                    />
                  </label>
                  <label>
                    Поттик / прашање
                    <textarea
                      rows={2}
                      value={step.prompt}
                      onChange={(event) => updateStep(step.localId, 'prompt', event.target.value)}
                    />
                  </label>
                  <label>
                    Структурирана содржина на чекор
                    <textarea
                      rows={3}
                      value={step.contentJsonText}
                      onChange={(event) =>
                        updateStep(step.localId, 'contentJsonText', event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Ресурс URL
                    <input
                      type="url"
                      placeholder="https://..."
                      value={step.resourceUrl}
                      onChange={(event) =>
                        updateStep(step.localId, 'resourceUrl', event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Пример одговор
                    <textarea
                      rows={2}
                      value={step.exampleAnswer}
                      onChange={(event) =>
                        updateStep(step.localId, 'exampleAnswer', event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Проверка
                    <select
                      value={step.evaluationMode}
                      onChange={(event) =>
                        updateStep(step.localId, 'evaluationMode', event.target.value)
                      }
                    >
                      <option value="manual">Рачна проверка</option>
                      <option value="normalized_text">Нормализиран текст</option>
                      <option value="numeric">Број</option>
                      <option value="regex">Regex</option>
                    </select>
                  </label>
                  <label className="assignment-checkbox-row">
                    <input
                      type="checkbox"
                      checked={step.required}
                      onChange={(event) =>
                        updateStep(step.localId, 'required', event.target.checked)
                      }
                    />
                    Задолжителен чекор
                  </label>
                </div>

                {usesAutoCheck ? (
                  <div className="task-detail-block">
                    <h4 className="section-title">Точни одговори</h4>
                    <label className="modal-form">
                      Одговори, по еден во секој ред
                      <textarea
                        rows={3}
                        placeholder="x=5"
                        value={step.answerKeysText}
                        onChange={(event) =>
                          updateStep(step.localId, 'answerKeysText', event.target.value)
                        }
                      />
                    </label>
                    {step.evaluationMode === 'numeric' ? (
                      <label className="modal-form">
                        Толеранција
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.5"
                          value={step.tolerance}
                          onChange={(event) =>
                            updateStep(step.localId, 'tolerance', event.target.value)
                          }
                        />
                      </label>
                    ) : null}
                    {step.evaluationMode === 'normalized_text' || step.evaluationMode === 'regex' ? (
                      <label className="assignment-checkbox-row">
                        <input
                          type="checkbox"
                          checked={step.caseSensitive}
                          onChange={(event) =>
                            updateStep(step.localId, 'caseSensitive', event.target.checked)
                          }
                        />
                        Разликувај мали и големи букви
                      </label>
                    ) : null}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>

      {error ? <p className="auth-error">{error}</p> : null}
    </section>
  );
}

export default AssignmentEditorPage;
