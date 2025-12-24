import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DepartmentLayout from '../../../../components/admin/shared/DepartmentLayout';
import { Department } from '@/lib/types';
import styles from '../../editorial/Editorial.module.css';

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
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    type: '',
    priority: '',
    contact: '',
    deal: '',
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
      if (filters.contact) params.append('contact', filters.contact);
      if (filters.deal) params.append('deal', filters.deal);

      const res = await fetch(`/api/admin/crm/tasks?${params}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(tasks.map(t => t.id));
    } else {
      setSelectedTasks([]);
    }
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks([...selectedTasks, taskId]);
    } else {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    }
  };

  const handleBulkComplete = async () => {
    if (selectedTasks.length === 0) return;
    if (!confirm(`Complete ${selectedTasks.length} selected tasks?`)) return;

    try {
      await Promise.all(
        selectedTasks.map(taskId =>
          fetch(`/api/admin/crm/tasks/${taskId}/complete`, { method: 'POST' })
        )
      );
      setSelectedTasks([]);
      fetchTasks();
    } catch (error) {
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;
    if (!confirm(`Delete ${selectedTasks.length} selected tasks? This cannot be undone.`)) return;

    try {
      await Promise.all(
        selectedTasks.map(taskId =>
          fetch(`/api/admin/crm/tasks/${taskId}`, { method: 'DELETE' })
        )
      );
      setSelectedTasks([]);
      fetchTasks();
    } catch (error) {
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
      return <span style={{ color: '#ef4444', fontWeight: 600 }}>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>;
    }

    if (taskDate.getTime() === today.getTime()) {
      return <span style={{ color: '#f59e0b', fontWeight: 600 }}>Today</span>;
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return { bg: '#fef2f2', color: '#991b1b' };
      case 'high': return { bg: '#fef3c7', color: '#92400e' };
      case 'medium': return { bg: '#dbeafe', color: '#1e40af' };
      case 'low': return { bg: '#f3f4f6', color: '#6b7280' };
      default: return { bg: '#f3f4f6', color: '#6b7280' };
    }
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
          <div>
            <h1>Tasks</h1>
            <p>Manage and track all tasks</p>
          </div>
          <button
            className={styles.primaryButton}
            onClick={() => router.push('/admin/crm/tasks/new')}
          >
            + Add Task
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
          <button
            className={activeTab === 'my' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('my')}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: activeTab === 'my' ? '#3b82f6' : 'transparent',
              color: activeTab === 'my' ? 'white' : '#6b7280',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            My Tasks
          </button>
          <button
            className={activeTab === 'all' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('all')}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: activeTab === 'all' ? '#3b82f6' : 'transparent',
              color: activeTab === 'all' ? 'white' : '#6b7280',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            All Tasks
          </button>
          <button
            className={activeTab === 'overdue' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('overdue')}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: activeTab === 'overdue' ? '#3b82f6' : 'transparent',
              color: activeTab === 'overdue' ? 'white' : '#6b7280',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Overdue
          </button>
          <button
            className={activeTab === 'today' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('today')}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: activeTab === 'today' ? '#3b82f6' : 'transparent',
              color: activeTab === 'today' ? 'white' : '#6b7280',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Today
          </button>
          <button
            className={activeTab === 'upcoming' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('upcoming')}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: activeTab === 'upcoming' ? '#3b82f6' : 'transparent',
              color: activeTab === 'upcoming' ? 'white' : '#6b7280',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Upcoming
          </button>
          <button
            className={activeTab === 'completed' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('completed')}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: activeTab === 'completed' ? '#3b82f6' : 'transparent',
              color: activeTab === 'completed' ? 'white' : '#6b7280',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Completed
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <select
            className={styles.input}
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            style={{ maxWidth: '150px' }}
          >
            <option value="">All Types</option>
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
            <option value="todo">To-Do</option>
          </select>

          <select
            className={styles.input}
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            style={{ maxWidth: '150px' }}
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {selectedTasks.length > 0 && (
          <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>{selectedTasks.length} selected</span>
            <button className={styles.secondaryButton} onClick={handleBulkComplete}>
              Complete
            </button>
            <button className={`${styles.secondaryButton} ${styles.deleteButton}`} onClick={handleBulkDelete}>
              Delete
            </button>
            <button className={styles.secondaryButton} onClick={() => setSelectedTasks([])}>
              Clear
            </button>
          </div>
        )}

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedTasks.length === tasks.length && tasks.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
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
                  style={{ cursor: 'pointer' }}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task.id)}
                      onChange={(e) => handleSelectTask(task.id, e.target.checked)}
                    />
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {task.status === 'pending' && (
                      <input
                        type="checkbox"
                        onChange={(e) => handleCompleteTask(task.id, e as any)}
                        title="Mark as complete"
                      />
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '1.25rem' }}>{getTypeIcon(task.type)}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{task.title}</div>
                    {task.description && (
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        {task.description.substring(0, 100)}
                        {task.description.length > 100 && '...'}
                      </div>
                    )}
                  </td>
                  <td>{getContactName(task)}</td>
                  <td>{formatDate(task.due_date)}</td>
                  <td>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: getPriorityColor(task.priority).bg,
                        color: getPriorityColor(task.priority).color,
                        textTransform: 'capitalize',
                      }}
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
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>✓</div>
              <div>No tasks found. Click "Add Task" to create your first task.</div>
            </div>
          )}
        </div>
      </div>
    </DepartmentLayout>
  );
}
