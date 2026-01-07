// Admin Workflows Dashboard
// Monitor and manage workflow automation

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/AdminLayout';

interface WorkflowStats {
  totalExecutions: number;
  activeWorkflows: number;
  completedToday: number;
  failedToday: number;
  pendingActions: number;
  pendingJobs: number;
}

interface RecentExecution {
  id: string;
  workflowName: string;
  workflowType: string;
  status: string;
  enrolledAt: string;
  completedAt: string | null;
  error: string | null;
}

export default function WorkflowsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [recentExecutions, setRecentExecutions] = useState<RecentExecution[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'failed'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (session?.user?.role === 'STAFF') {
      fetchWorkflowData();
    }
  }, [status, session, filter]);

  const fetchWorkflowData = async () => {
    try {
      const [statsRes, executionsRes] = await Promise.all([
        fetch('/api/admin/workflows/stats'),
        fetch(`/api/admin/workflows/executions?filter=${filter}&limit=50`),
      ]);

      const statsData = await statsRes.json();
      const executionsData = await executionsRes.json();

      setStats(statsData);
      setRecentExecutions(executionsData.executions || []);
    } catch (error) {
      console.error('Error fetching workflow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerManualSync = async (contactId: string) => {
    if (!confirm('Trigger WordPress sync for this contact?')) return;

    try {
      const res = await fetch('/api/sync/wordpress/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      });

      if (res.ok) {
        alert('Sync triggered successfully');
        fetchWorkflowData();
      } else {
        const error = await res.json();
        alert(`Sync failed: ${error.message}`);
      }
    } catch (error) {
      alert('Sync request failed');
    }
  };

  if (status === 'loading' || loading) {
    return <AdminLayout><div className="p-6">Loading...</div></AdminLayout>;
  }

  if (session?.user?.role !== 'STAFF') {
    return <AdminLayout><div className="p-6">Access denied</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Workflow Automation</h1>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Total Executions</div>
              <div className="text-2xl font-bold">{stats.totalExecutions.toLocaleString()}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Active Now</div>
              <div className="text-2xl font-bold text-blue-600">{stats.activeWorkflows}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Completed Today</div>
              <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Failed Today</div>
              <div className="text-2xl font-bold text-red-600">{stats.failedToday}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Pending Actions</div>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingActions}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Pending Jobs</div>
              <div className="text-2xl font-bold text-purple-600">{stats.pendingJobs}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded ${filter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded ${filter === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-4 py-2 rounded ${filter === 'failed' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              Failed
            </button>
            <button
              onClick={fetchWorkflowData}
              className="ml-auto px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Recent Executions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Recent Workflow Executions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Workflow</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Enrolled</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Completed</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentExecutions.map((execution) => (
                  <tr key={execution.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{execution.workflowName}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {execution.workflowType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        execution.status === 'completed' ? 'bg-green-100 text-green-800' :
                        execution.status === 'failed' ? 'bg-red-100 text-red-800' :
                        execution.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {execution.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(execution.enrolledAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {execution.completedAt ? new Date(execution.completedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {execution.completedAt ?
                        `${Math.round((new Date(execution.completedAt).getTime() - new Date(execution.enrolledAt).getTime()) / 1000)}s` :
                        '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
