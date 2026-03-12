function ProjectsCard({ projects }) {
  return (
    <section className="dashboard-card content-card">
      <h2 className="section-title">Проекти и задачи</h2>
      <ul className="list-reset projects-list">
        {projects.map((project) => (
          <li key={project.title} className="project-item">
            <div className="project-header">
              <p className="item-title">{project.title}</p>
              <span className="project-percent">{project.progress}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <p className="item-meta">{project.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ProjectsCard;
