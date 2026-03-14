function ProfileInfoCard({ student }) {
  return (
    <section className="dashboard-card profile-info-card">
      <div className="profile-avatar" aria-hidden="true">
        {student.initials || '?'}
      </div>
      <div>
        <p className="profile-eyebrow">Профил</p>
        <h1 className="profile-name">{student.fullName}</h1>
        <p className="profile-meta">
          {[student.className, student.school].filter(Boolean).join(' · ') || 'Нема податок'}
        </p>
        <p className="profile-meta">Е-пошта: {student.email}</p>
        <p className="profile-meta">
          Ученички број: {student.studentId || 'Нема податок'} · Класен раководител:{' '}
          {student.mentor || 'Нема податок'}
        </p>
        {student.aiSessionLabel ? (
          <p className="profile-meta">{student.aiSessionLabel}</p>
        ) : null}
      </div>
    </section>
  );
}

export default ProfileInfoCard;
