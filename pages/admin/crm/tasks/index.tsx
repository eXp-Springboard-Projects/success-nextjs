import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DepartmentLayout from '../../../../components/admin/shared/DepartmentLayout';
import { Department } from '@prisma/client';
import styles from './Tasks.module.css';

interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  due_date: string;
  due_time: string;
  contact_email: string;
  contact_first_name: string;
  contact_last_name: string;
  deal_name: string;
  ticket_subject: string;
  assigned_to_name: string;
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my');
  const [filters, setFilters] = useState({
    type: '',
    priority: '',
  });

  useEffect(() => {
    fetchTasks();
  }, [activeTab, filters]);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      params.append('filter', activeTab);
      if (filters.type) params.append('type', filters.type);
      if (filters.priority) params.append('priority', filters.priority);

      const res = await fetch(`/api/admin/crm/tasks?${params}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string, e: React.MouseEvent) => {
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

  const formatDate = (date: string) => {
    if (!date) return '-';
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate < today) {
      return <span className={styles.overdue}>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>;
    }

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: taskDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getContactName = (task: Task) => {
    if (task.contact_first_name || task.contact_last_name) {
      return `${task.contact_first_name} ${task.contact_last_name}`.trim();
    }
    if (task.contact_email) return task.contact_email;
    if (task.deal_name) return task.deal_name;
    if (task.ticket_subject) return task.ticket_subject;
    return '-';
  };

  if (loading) {
    return (
      <DepartmentLayout currentDepartment={Department.CUSTOMER_SERVICE} pageTitle="Tasks">
        <div className={styles.loading}>Loading tasks...</div>
      </DepartmentLayout>
    );
  }

  return (
    <DepartmentLayout currentDepartment={Department.CUSTOMER_SERVICE} pageTitle="Tasks">
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Tasks</h1>
          <a href="/admin/crm/tasks/new" className={styles.addButton}>
            + Add Task
          </a>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'my' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('my')}
          >
            My Tasks
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Tasks
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'overdue' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('overdue')}
          >
            Overdue
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'completed' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed
          </button>
        </div>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Type</label>
            <select
              className={styles.filterSelect}
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="">All Types</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
              <option value="todo">To-Do</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Priority</label>
            <select
              className={styles.filterSelect}
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th style={{ width: '40px' }}></th>
                <th>Title</th>
                <th>Related To</th>
                <th>Due</th>
                <th>Priority</th>
                <th>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => router.push(`/admin/crm/tasks/${task.id}`)}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    {task.status === 'pending' && (
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        onChange={(e) => handleCompleteTask(task.id, e as any)}
                      />
                    )}
                  </td>
                  <td>
                    <span className={styles.typeIcon}>{getTypeIcon(task.type)}</span>
                  </td>
                  <td>
                    <div className={styles.taskTitle}>{task.title}</div>
                    {task.description && (
                      <div className={styles.taskDescription}>
                        {task.description.substring(0, 100)}
                        {task.description.length > 100 && '...'}
                      </div>
                    )}
                  </td>
                  <td>{getContactName(task)}</td>
                  <td>{formatDate(task.due_date)}</td>
                  <td>
                    <span
                      className={`${styles.priorityBadge} ${
                        task.priority === 'high'
                          ? styles.priorityHigh
                          : task.priority === 'medium'
                          ? styles.priorityMedium
                          : styles.priorityLow
                      }`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td>{task.assigned_to_name || 'Unassigned'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && (
            <div className={styles.empty}>
              No tasks found. Click "Add Task" to create your first task.
            </div>
          )}
        </div>
      </div>
    </DepartmentLayout>
  );
}
