import { dueLabel } from '../utils/date';
import Icon from './icons';
import { PriorityBadge } from './ui';

export default function TaskCard({ task, onClick, draggable = false, dragging = false, onDragStart, onDragEnd }) {
  const due = dueLabel(task.dueDate, task.status);

  return (
    <article
      className={[
        'task-card',
        task.status === 'done' && 'task-card--done',
        dragging && 'task-card--dragging',
      ]
        .filter(Boolean)
        .join(' ')}
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
          <span className="chip" style={{ color: task.project.color, background: `${task.project.color}1f` }}>
            {task.project.name}
          </span>
        )}
      </div>

      <h4 className="task-card__title">{task.title}</h4>

      {task.tags?.length > 0 && (
        <div className="tag-list">
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
          {task.tags.length > 3 && <span className="tag">+{task.tags.length - 3}</span>}
        </div>
      )}

      <footer className="task-card__foot">
        <div className="task-card__meta">
          {due && (
            <span className={`due due--${due.tone}`}>
              <Icon name="calendar" />
              {due.text}
            </span>
          )}
          {task.comments?.length > 0 && (
            <span className="due">
              <Icon name="message" />
              {task.comments.length}
            </span>
          )}
        </div>
      </footer>
    </article>
  );
}
