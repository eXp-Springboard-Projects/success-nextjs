import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Department } from '@/lib/types';
import DepartmentLayout from '@/components/admin/shared/DepartmentLayout';
import { requireDepartmentAuth } from '@/lib/departmentAuth';
import { GetServerSidePropsContext } from 'next';

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
}

interface AnnouncementsPageProps {
  userDepartment: Department;
}

export default function AnnouncementsPage({ userDepartment }: AnnouncementsPageProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/admin/announcements');
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete announcement "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setAnnouncements(announcements.filter(a => a.id !== id));
        alert('✓ Announcement deleted successfully');
      } else {
        const data = await res.json();
        alert(`✗ Failed to delete: ${data.error}`);
      }
    } catch (error) {
      alert('✗ Failed to delete announcement');
    }
  };

  const handleDuplicate = async (announcement: Announcement) => {
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${announcement.title} (Copy)`,
          content: announcement.content,
          isActive: false,
        }),
      });

      if (res.ok) {
        fetchAnnouncements();
        alert('✓ Announcement duplicated successfully');
      }
    } catch (error) {
      alert('✗ Failed to duplicate announcement');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (res.ok) {
        fetchAnnouncements();
      }
    } catch (error) {
      alert('✗ Failed to update announcement');
    }
  };

  const getStatus = (announcement: Announcement) => {
    if (!announcement.isActive) return 'archived';
    if (announcement.expiresAt) {
      const expiresAt = new Date(announcement.expiresAt);
      const now = new Date();
      if (expiresAt > now && expiresAt < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
        return 'scheduled';
      }
      if (expiresAt < now) return 'expired';
    }
    return 'active';
  };

  const activeCount = announcements.filter(a => getStatus(a) === 'active').length;
  const scheduledCount = announcements.filter(a => getStatus(a) === 'scheduled').length;
  const archivedCount = announcements.filter(a => getStatus(a) === 'archived' || getStatus(a) === 'expired').length;

  const templates = [
    {
      title: 'Welcome Message',
      icon: '👋',
      description: 'Greet new team members',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Policy Update',
      icon: '📋',
      description: 'Share important policy changes',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Team Milestone',
      icon: '🎉',
      description: 'Celebrate achievements',
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <DepartmentLayout
      currentDepartment={userDepartment}
      pageTitle="Announcements"
      description="Company-wide announcements and updates"
    >
      <div className="min-h-screen relative">
        {/* Subtle dot pattern background */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-8">
          {/* Header Section with Frosted Glass Card */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl blur-xl" />
            <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm shadow-indigo-500/5 p-8">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
                      Announcements
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage company-wide announcements and updates</p>
                  </div>
                </div>
                <Link
                  href="/admin/announcements/new"
                  className="group relative px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <span className="relative z-10">+ New Announcement</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </div>

              {/* Stats Bar */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <span className="text-lg">✓</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</div>
                    <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium">Active</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <span className="text-lg">📅</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{scheduledCount}</div>
                    <div className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">Scheduled</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                  <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
                    <span className="text-lg">📦</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{archivedCount}</div>
                    <div className="text-xs text-gray-600/70 dark:text-gray-400/70 font-medium">Archived</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="relative border-l-4 border-indigo-500 pl-8">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
              </div>
            ) : announcements.length === 0 ? (
              <div className="relative">
                <div className="text-center py-12 px-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm shadow-gray-200/50 dark:shadow-gray-800/50">
                  {/* Animated Icon */}
                  <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 animate-pulse">
                    <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>

                  <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                    No announcements yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                    Get started by creating your first announcement to keep your team informed and engaged
                  </p>

                  <Link
                    href="/admin/announcements/new"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:-translate-y-0.5 mb-12"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Your First Announcement
                  </Link>

                  {/* Quick Start Templates */}
                  <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6">
                      Quick Start Templates
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {templates.map((template) => (
                        <Link
                          key={template.title}
                          href="/admin/announcements/new"
                          className="group relative overflow-hidden p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-transparent transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-200 dark:hover:shadow-gray-900"
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${template.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                          <div className="relative">
                            <div className="text-2xl mb-3">{template.icon}</div>
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">{template.title}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => {
                  const status = getStatus(announcement);
                  return (
                    <div
                      key={announcement.id}
                      className="group relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:shadow-gray-200 dark:hover:shadow-gray-900/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                    >
                      {/* Status Color Accent */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                        status === 'active' ? 'bg-emerald-500' :
                        status === 'scheduled' ? 'bg-blue-500' :
                        status === 'expired' ? 'bg-orange-500' :
                        'bg-gray-400'
                      }`} />

                      <div className="p-6 pl-8">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{announcement.title}</h3>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                status === 'scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                status === 'expired' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                              }`}>
                                {status === 'active' ? '● Active' :
                                 status === 'scheduled' ? '◐ Scheduled' :
                                 status === 'expired' ? '○ Expired' :
                                 '◌ Archived'}
                              </span>
                            </div>
                            <div
                              className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 line-clamp-2"
                              dangerouslySetInnerHTML={{ __html: announcement.content }}
                            />
                          </div>

                          {/* Quick Actions on Hover */}
                          <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/admin/announcements/${announcement.id}/edit`}
                              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => handleDuplicate(announcement)}
                              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                              title="Duplicate"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleToggleActive(announcement.id, announcement.isActive)}
                              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                              title={announcement.isActive ? 'Archive' : 'Activate'}
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {announcement.createdBy}
                          </span>
                          <span>•</span>
                          <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                          {announcement.expiresAt && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Expires {new Date(announcement.expiresAt).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DepartmentLayout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const result = await requireDepartmentAuth(Department.CUSTOMER_SERVICE)(context);

  if ('redirect' in result) {
    return result;
  }

  if ('notFound' in result) {
    return result;
  }

  const userDepartment = (result.props as any).session?.user?.primaryDepartment || Department.CUSTOMER_SERVICE;

  return {
    props: {
      userDepartment,
    },
  };
}
