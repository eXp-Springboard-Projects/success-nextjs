import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './TaskWidget.module.css';

interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  due_date: string;
  due_time: string;
}

interface TaskWidgetProps {
  contactId?: string;
  dealId?: string;
  ticketId?: string;
  title?: string;
}

export default function TaskWidget({ contactId, dealId, ticketId, title = 'Tasks' }: TaskWidgetProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState('todo');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [contactId, dealId, ticketId]);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (contactId) params.append('contact', contactId);
      if (dealId) params.append('deal', dealId);
      if (ticketId) params.append('ticket', ticketId);

      const res = await fetch(`/api/admin/crm/tasks?${params}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTaskTitle.trim()) return;

    setCreating(true);

    try {
      const res = await fetch('/api/admin/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          type: newTaskType,
          priority: newTaskPriority,
          contactId: contactId || null,
          dealId: dealId || null,
          ticketId: ticketId || null,
        }),
      });

      if (res.ok) {
        setNewTaskTitle('');
        setNewTaskType('todo');
        setNewTaskPriority('medium');
        setShowNewTaskForm(false);
        fetchTasks();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleCompleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await fetch(`/api/admin/crm/tasks/${taskId}/complete`, {
        method: 'POST',
      });
      fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return '📞';
      case 'email': return '📧';
      case 'meeting': return '📅';
      case 'todo': return '✓';
      default: return '•';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return { bg: '#fef2f2', color: '#991b1b' };
      case 'high': return { bg: '#fef3c7', color: '#92400e' };
      case 'medium': return { bg: '#dbeafe', color: '#1e40af' };
      case 'low': return { bg: '#f3f4f6', color: '#6b7280' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  const formatDate = (date: string) => {
    if (!date) return null;
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate < today) {
      return <span style={{ color: '#ef4444', fontWeight: 600 }}>Overdue</span>;
    }

    if (taskDate.getTime() === today.getTime()) {
      return <span style={{ color: '#f59e0b', fontWeight: 600 }}>Today</span>;
    }

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <button
          className={styles.addButton}
          onClick={() => setShowNewTaskForm(!showNewTaskForm)}
        >
          {showNewTaskForm ? '✕' : '+ Add Task'}
        </button>
      </div>

      {showNewTaskForm && (
        <form onSubmit={handleCreateTask} className={styles.newTaskForm}>
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Task title..."
            className={styles.input}
            autoFocus
          />
          <div className={styles.formRow}>
            <select
              value={newTaskType}
              onChange={(e) => setNewTaskType(e.target.value)}
              className={styles.select}
            >
              <option value="call">📞 Call</option>
              <option value="email">📧 Email</option>
              <option value="meeting">📅 Meeting</option>
              <option value="todo">✓ To-Do</option>
            </select>
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value)}
              className={styles.select}
            >
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button
              type="submit"
              disabled={creating || !newTaskTitle.trim()}
              className={styles.createButton}
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className={styles.loading}>Loading tasks...</div>
      ) : (
        <>
          {pendingTasks.length > 0 && (
            <div className={styles.taskList}>
              {pendingTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/admin/crm/tasks/${task.id}`}
                  className={styles.taskItem}
                >
                  <div className={styles.taskLeft}>
                    <input
                      type="checkbox"
                      onClick={(e) => handleCompleteTask(task.id, e)}
                      className={styles.checkbox}
                      title="Mark as complete"
                    />
                    <span className={styles.typeIcon}>{getTypeIcon(task.type)}</span>
                    <div className={styles.taskContent}>
                      <div className={styles.taskTitle}>{task.title}</div>
                      {task.description && (
                        <div className={styles.taskDescription}>
                          {task.description.substring(0, 60)}
                          {task.description.length > 60 && '...'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={styles.taskRight}>
                    {task.due_date && (
                      <div className={styles.dueDate}>{formatDate(task.due_date)}</div>
                    )}
                    <span
                      className={styles.priority}
                      style={{
                        background: getPriorityColor(task.priority).bg,
                        color: getPriorityColor(task.priority).color,
                      }}
                    >
                      {task.priority}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {completedTasks.length > 0 && (
            <details className={styles.completedSection}>
              <summary className={styles.completedHeader}>
                ✓ {completedTasks.length} Completed
              </summary>
              <div className={styles.taskList}>
                {completedTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/admin/crm/tasks/${task.id}`}
                    className={`${styles.taskItem} ${styles.completedTask}`}
                  >
                    <div className={styles.taskLeft}>
                      <span className={styles.typeIcon}>{getTypeIcon(task.type)}</span>
                      <div className={styles.taskContent}>
                        <div className={styles.taskTitle}>{task.title}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </details>
          )}

          {tasks.length === 0 && (
            <div className={styles.empty}>
              No tasks yet. Click "Add Task" to create one.
            </div>
          )}
        </>
      )}
    </div>
  );
}
