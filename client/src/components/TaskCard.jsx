import { dueLabel } from '../utils/date';
import Icon from './icons';
import { PriorityBadge } from './ui';

export default function TaskCard({
  task,
  onClick,
  onToggleComplete,
  draggable = false,
  dragging = false,
  onDragStart,
  onDragEnd,
}) {
  const due = dueLabel(task.dueDate, task.status);
  const isDone = task.status === 'done';

  return (
    <article
      className={[
        'task-card',
        isDone && 'task-card--done',
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
          <span
            className="chip chip--project"
            style={{
              color: task.project.color,
              background: `color-mix(in srgb, ${task.project.color} 12%, transparent)`,
              borderColor: `color-mix(in srgb, ${task.project.color} 25%, transparent)`,
            }}
          >
            <i className="dot" style={{ background: task.project.color }} />
            {task.project.name}
          </span>
        )}

        {onToggleComplete && (
          <button
            type="button"
            className={`task-card__check-btn ${isDone ? 'checked' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(task);
            }}
            title={isDone ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
            aria-label="Đổi trạng thái"
          >
            <Icon name={isDone ? 'check' : 'check'} />
          </button>
        )}
      </div>

      <h4 className="task-card__title">{task.title}</h4>

      {task.description && (
        <p className="task-card__desc">{task.description}</p>
      )}

      {task.tags?.length > 0 && (
        <div className="tag-list">
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
          {task.tags.length > 3 && <span className="tag tag--more">+{task.tags.length - 3}</span>}
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
            <span className="comment-badge" title={`${task.comments.length} ghi chú`}>
              <Icon name="message" />
              {task.comments.length}
            </span>
          )}
        </div>
      </footer>
    </article>
  );
}
