import { Avatar, PriorityBadge } from './ui';
import { dueLabel } from '../utils/date';

export default function TaskCard({ task, onClick, draggable = false, onDragStart, onDragEnd }) {
  const due = dueLabel(task.dueDate, task.status);

  return (
    <article
      className={`task-card${task.status === 'done' ? ' task-card--done' : ''}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={() => onClick?.(task)}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(task)}
      role="button"
      tabIndex={0}
    >
      <div className="task-card__top">
        <PriorityBadge priority={task.priority} />
        {task.project && (
          <span className="chip" style={{ color: task.project.color, background: `${task.project.color}1a` }}>
            {task.project.name}
          </span>
        )}
      </div>

      <h4 className="task-card__title">{task.title}</h4>

      {task.tags?.length > 0 && (
        <div className="tag-list">
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">#{tag}</span>
          ))}
        </div>
      )}

      <footer className="task-card__foot">
        <div className="task-card__meta">
          {due && <span className={`due due--${due.tone}`}>🗓 {due.text}</span>}
          {task.comments?.length > 0 && <span className="muted-sm">💬 {task.comments.length}</span>}
        </div>
        <Avatar user={task.assignee} size={26} />
      </footer>
    </article>
  );
}
