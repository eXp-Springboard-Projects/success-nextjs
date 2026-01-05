import { useEffect, useState } from 'react';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import Link from 'next/link';
import {
  Users, Eye, MousePointer, Calendar,
  Inbox, FileEdit, Clock, CheckCircle,
  Mail, Newspaper, Edit, Trash2
} from 'lucide-react';

interface Newsletter {
  id: string;
  subject: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sent';
  scheduledFor?: string;
  sentAt?: string;
  recipientCount?: number;
  openRate?: number;
  clickRate?: number;
  createdAt: string;
  updatedAt: string;
}

export default function NewslettersPage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'scheduled' | 'sent'>('all');

  useEffect(() => {
    fetchNewsletters();
  }, []);

  const fetchNewsletters = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/success-plus/newsletters');
      if (res.ok) {
        const data = await res.json();
        setNewsletters(data.newsletters || []);
      }
    } catch (error) {
      console.error('Error fetching newsletters:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNewsletter = async (id: string) => {
    if (!confirm('Are you sure you want to delete this newsletter?')) return;

    try {
      const res = await fetch(`/api/admin/success-plus/newsletters/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setNewsletters(newsletters.filter(n => n.id !== id));
      }
    } catch (error) {
      console.error('Error deleting newsletter:', error);
    }
  };

  const filteredNewsletters = newsletters.filter(newsletter => {
    if (filter === 'all') return true;
    return newsletter.status === filter;
  });

  // Calculate stats
  const totalSubscribers = newsletters.reduce((sum, n) => sum + (n.recipientCount || 0), 0);
  const sentNewsletters = newsletters.filter(n => n.status === 'sent');
  const avgOpenRate = sentNewsletters.length > 0
    ? sentNewsletters.reduce((sum, n) => sum + (n.openRate || 0), 0) / sentNewsletters.length
    : 0;
  const avgClickRate = sentNewsletters.length > 0
    ? sentNewsletters.reduce((sum, n) => sum + (n.clickRate || 0), 0) / sentNewsletters.length
    : 0;
  const lastSent = sentNewsletters.length > 0
    ? sentNewsletters.sort((a, b) =>
        new Date(b.sentAt!).getTime() - new Date(a.sentAt!).getTime()
      )[0].sentAt
    : null;

  const stats = [
    {
      icon: Users,
      label: 'Total Subscribers',
      value: totalSubscribers > 0 ? totalSubscribers.toLocaleString() : '--',
      color: 'blue'
    },
    {
      icon: Eye,
      label: 'Avg Open Rate',
      value: avgOpenRate > 0 ? `${avgOpenRate.toFixed(1)}%` : '--',
      color: 'green'
    },
    {
      icon: MousePointer,
      label: 'Avg Click Rate',
      value: avgClickRate > 0 ? `${avgClickRate.toFixed(1)}%` : '--',
      color: 'purple'
    },
    {
      icon: Calendar,
      label: 'Last Sent',
      value: lastSent ? new Date(lastSent).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) : '--',
      color: 'orange'
    },
  ];

  const tabs = [
    { id: 'all' as const, label: 'All', icon: Inbox, count: newsletters.length },
    { id: 'draft' as const, label: 'Drafts', icon: FileEdit, count: newsletters.filter(n => n.status === 'draft').length },
    { id: 'scheduled' as const, label: 'Scheduled', icon: Clock, count: newsletters.filter(n => n.status === 'scheduled').length },
    { id: 'sent' as const, label: 'Sent', icon: CheckCircle, count: newsletters.filter(n => n.status === 'sent').length },
  ];

  return (
    <DepartmentLayout
      currentDepartment={Department.SUCCESS_PLUS}
      pageTitle="Newsletters"
      description="Create and manage SUCCESS+ newsletters"
    >
      {/* Page Background */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Newsletters</h1>
              <p className="text-gray-600">
                Create and send newsletters to SUCCESS+ members
              </p>
            </div>
            <Link
              href="/admin/success-plus/newsletters/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
            >
              <Mail size={20} />
              Create Newsletter
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              const colorClasses = {
                blue: 'bg-blue-50 text-blue-600',
                green: 'bg-green-50 text-green-600',
                purple: 'bg-purple-50 text-purple-600',
                orange: 'bg-orange-50 text-orange-600',
              };

              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                      <Icon size={24} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Content Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-200 bg-gray-50/50 px-6">
              <div className="flex gap-2 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = filter === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setFilter(tab.id)}
                      className={`
                        flex items-center gap-2 px-5 py-4 font-medium text-sm whitespace-nowrap
                        transition-all duration-200 border-b-2 -mb-px
                        ${isActive
                          ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                        }
                      `}
                    >
                      <Icon size={18} />
                      {tab.label}
                      <span className={`
                        px-2 py-0.5 rounded-full text-xs font-semibold
                        ${isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                        }
                      `}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Area */}
            <div className="p-8">
              {loading ? (
                <div className="text-center py-16">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
                  <p className="text-gray-600">Loading newsletters...</p>
                </div>
              ) : filteredNewsletters.length === 0 ? (
                /* Enhanced Empty State */
                <div className="text-center py-16 px-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 mb-6">
                    <Newspaper size={40} className="text-blue-600" />
                  </div>

                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Create Your First Newsletter
                  </h2>

                  <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                    Engage your SUCCESS+ members with curated content, updates, and exclusive insights.
                  </p>

                  {/* Feature Bullets */}
                  <div className="max-w-lg mx-auto mb-8 space-y-4">
                    <div className="flex items-center gap-3 text-left bg-gray-50 rounded-lg p-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Edit size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Drag-and-drop editor</p>
                        <p className="text-sm text-gray-600">Create beautiful newsletters with ease</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-left bg-gray-50 rounded-lg p-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Clock size={20} className="text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Schedule for optimal delivery</p>
                        <p className="text-sm text-gray-600">Send at the perfect time for your audience</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-left bg-gray-50 rounded-lg p-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <MousePointer size={20} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Track opens and clicks</p>
                        <p className="text-sm text-gray-600">Measure engagement and optimize content</p>
                      </div>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                      href="/admin/success-plus/newsletters/new"
                      className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 text-lg"
                    >
                      <Mail size={20} />
                      Create Newsletter
                    </Link>

                    <a
                      href="#"
                      className="text-blue-600 hover:text-blue-700 font-medium underline"
                    >
                      View newsletter best practices
                    </a>
                  </div>
                </div>
              ) : (
                /* Newsletters Table */
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Subject</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Recipients</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Open Rate</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Click Rate</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNewsletters.map((newsletter) => (
                        <tr key={newsletter.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-medium text-gray-900">{newsletter.subject}</div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`
                              inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                              ${newsletter.status === 'sent' ? 'bg-green-100 text-green-800' : ''}
                              ${newsletter.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : ''}
                              ${newsletter.status === 'draft' ? 'bg-gray-100 text-gray-800' : ''}
                            `}>
                              {newsletter.status.charAt(0).toUpperCase() + newsletter.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-700">{newsletter.recipientCount || 0}</td>
                          <td className="py-4 px-4 text-gray-700">
                            {newsletter.openRate !== undefined ? `${newsletter.openRate.toFixed(1)}%` : '-'}
                          </td>
                          <td className="py-4 px-4 text-gray-700">
                            {newsletter.clickRate !== undefined ? `${newsletter.clickRate.toFixed(1)}%` : '-'}
                          </td>
                          <td className="py-4 px-4 text-gray-700">
                            {newsletter.status === 'sent' && newsletter.sentAt
                              ? new Date(newsletter.sentAt).toLocaleDateString()
                              : newsletter.status === 'scheduled' && newsletter.scheduledFor
                              ? new Date(newsletter.scheduledFor).toLocaleDateString()
                              : new Date(newsletter.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/admin/success-plus/newsletters/${newsletter.id}`}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View"
                              >
                                <Eye size={18} />
                              </Link>
                              {newsletter.status === 'draft' && (
                                <>
                                  <Link
                                    href={`/admin/success-plus/newsletters/${newsletter.id}/edit`}
                                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Edit"
                                  >
                                    <Edit size={18} />
                                  </Link>
                                  <button
                                    onClick={() => deleteNewsletter(newsletter.id)}
                                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DepartmentLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireDepartmentAuth(Department.SUCCESS_PLUS);
