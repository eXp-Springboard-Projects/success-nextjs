import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import ProjectCard from '../../components/admin/ProjectCard';
import ProjectColumn from '../../components/admin/ProjectColumn';
import ProjectModal from '../../components/admin/ProjectModal';
import styles from './Projects.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  assignedToId: string | null;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
  notes: string | null;
  users: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
}

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterAssignedTo, setFilterAssignedTo] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const columns = [
    { id: 'BACKLOG', title: 'Backlog', color: '#94a3b8' },
    { id: 'TODO', title: 'To Do', color: '#3b82f6' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: '#f59e0b' },
    { id: 'REVIEW', title: 'Review', color: '#8b5cf6' },
    { id: 'DONE', title: 'Done', color: '#10b981' },
  ];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated') {
      fetchProjects();
      fetchStaff();
    }
  }, [status, router]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterAssignedTo && filterAssignedTo !== 'ALL') params.append('assignedToId', filterAssignedTo);
      if (filterPriority && filterPriority !== 'ALL') params.append('priority', filterPriority);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/projects?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch projects');
      }

      setProjects(data.projects || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/admin/staff');
      const data = await response.json();
      if (response.ok) {
        setStaff(data.staff || []);
      }
    } catch (err) {
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProjects();
    }
  }, [filterAssignedTo, filterPriority, searchQuery]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const projectId = active.id as string;
    const newStatus = over.id as string;

    // Check if it's a valid column drop
    if (!columns.find(col => col.id === newStatus)) return;

    const project = projects.find(p => p.id === projectId);
    if (!project || project.status === newStatus) return;

    // Optimistically update UI
    setProjects(prev =>
      prev.map(p => (p.id === projectId ? { ...p, status: newStatus } : p))
    );

    // Update on backend
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update project status');
      }

      const data = await response.json();
      setProjects(prev =>
        prev.map(p => (p.id === projectId ? data.project : p))
      );
    } catch (err: any) {
      setError(err.message);
      // Revert optimistic update
      setProjects(prev =>
        prev.map(p => (p.id === projectId ? project : p))
      );
    }
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setShowModal(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowModal(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveProject = async (projectData: any) => {
    try {
      if (editingProject) {
        // Update existing project
        const response = await fetch(`/api/projects/${editingProject.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectData),
        });

        if (!response.ok) {
          throw new Error('Failed to update project');
        }

        const data = await response.json();
        setProjects(prev =>
          prev.map(p => (p.id === editingProject.id ? data.project : p))
        );
      } else {
        // Create new project
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectData),
        });

        if (!response.ok) {
          throw new Error('Failed to create project');
        }

        const data = await response.json();
        setProjects(prev => [...prev, data.project]);
      }

      setShowModal(false);
      setEditingProject(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getProjectsByStatus = (status: string) => {
    return projects.filter(p => p.status === status);
  };

  const activeProject = activeId ? projects.find(p => p.id === activeId) : null;

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading projects...</div>
      </AdminLayout>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Project Management</h1>
            <p className={styles.subtitle}>
              Kanban board for team project tracking
            </p>
          </div>
          <button onClick={handleCreateProject} className={styles.createButton}>
            + New Project
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {/* Filters */}
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />

          <select
            value={filterAssignedTo}
            onChange={(e) => setFilterAssignedTo(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="ALL">All Staff</option>
            {staff.map(member => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className={styles.board}>
            {columns.map(column => (
              <ProjectColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                count={getProjectsByStatus(column.id).length}
              >
                <SortableContext
                  items={getProjectsByStatus(column.id).map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {getProjectsByStatus(column.id).map(project => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onEdit={() => handleEditProject(project)}
                      onDelete={() => handleDeleteProject(project.id)}
                    />
                  ))}
                </SortableContext>
              </ProjectColumn>
            ))}
          </div>

          <DragOverlay>
            {activeProject && (
              <ProjectCard
                project={activeProject}
                onEdit={() => {}}
                onDelete={() => {}}
                isDragging
              />
            )}
          </DragOverlay>
        </DndContext>

        {/* Project Modal */}
        {showModal && (
          <ProjectModal
            project={editingProject}
            staff={staff}
            onSave={handleSaveProject}
            onClose={() => {
              setShowModal(false);
              setEditingProject(null);
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// Force SSR for AWS Amplify deployment compatibility

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
