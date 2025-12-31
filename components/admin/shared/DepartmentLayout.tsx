import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { Department, UserRole } from '@/lib/types';
import { getDepartmentName, getDepartmentPath, getAccessibleDepartments } from '@/lib/departmentAuth';
import styles from './DepartmentLayout.module.css';
import { Sparkles, Menu } from 'lucide-react';

interface DepartmentLayoutProps {
  children: ReactNode;
  currentDepartment: Department;
  pageTitle: string;
  description?: string;
}

interface DepartmentSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    primaryDepartment?: Department | null;
    avatar?: string;
  };
}

export default function DepartmentLayout({
  children,
  currentDepartment,
  pageTitle,
  description,
}: DepartmentLayoutProps) {
  const { data: session, status } = useSession() as { data: DepartmentSession | null; status: string };
  const router = useRouter();

  // Persist sidebar open/closed state in localStorage
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_sidebar_open');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [notificationCount, setNotificationCount] = useState(0);

  // Save sidebar state when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_sidebar_open', String(sidebarOpen));
    }
  }, [sidebarOpen]);

  useEffect(() => {
    // Fetch notification count
    fetch('/api/admin/notifications/count')
      .then(res => res.json())
      .then(data => setNotificationCount(data.count))
      .catch(() => setNotificationCount(0));
  }, []);

  if (status === 'loading') {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const { user } = session;
  const accessibleDepartments = getAccessibleDepartments(user.role, user.primaryDepartment);

  // Navigation sections organized by category
  const navigationSections = getNavigationSections(user.role, user.primaryDepartment);

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/admin">
            <div className={styles.logo}>
              <span className={styles.logoText} style={{ color: "white" }}>SUCCESS</span>
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <div className={styles.navContainer}>
          {navigationSections.map((section) => (
            <CollapsibleSection
              key={section.title}
              title={section.title}
              items={section.items}
              router={router}
              notificationCount={section.title === 'OVERVIEW' ? notificationCount : 0}
            />
          ))}
        </div>

        {/* User Profile */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userProfile}>
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className={styles.userAvatar} />
            ) : (
              <div className={styles.userAvatarPlaceholder}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user.name}</div>
              <div className={styles.userRole}>{user.role}</div>
            </div>
          </div>
          <Link href="/api/auth/signout" className={styles.signOutButton}>
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`${styles.main} ${!sidebarOpen ? styles.mainShifted : ''}`}>
        {/* Header */}
        <header className={styles.header}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={styles.sidebarToggle}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.pageTitle}>{pageTitle}</h1>
              {description && <p className={styles.pageDescription}>{description}</p>}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}

// Collapsible section component
function CollapsibleSection({
  title,
  items,
  router,
  notificationCount
}: {
  title: string;
  items: Array<{ label: string; href: string; badge?: number }>;
  router: any;
  notificationCount?: number;
}) {
  // Initialize state from localStorage, default to true (open)
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`sidebar_section_${title}`);
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  // Save state to localStorage when it changes
  const toggleSection = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`sidebar_section_${title}`, String(newState));
    }
  };

  return (
    <div className={styles.navSection}>
      <button
        className={styles.navSectionTitle}
        onClick={toggleSection}
      >
        <span>{title}</span>
        <span className={styles.sectionToggle}>{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <nav className={styles.nav}>
          {items.map((item) => {
            const isExternal = item.href.startsWith('http');

            if (isExternal) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.navItem}
                >
                  <span className={styles.navLabel}>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className={styles.navBadge}>{item.badge}</span>
                  )}
                </a>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${router.pathname === item.href ? styles.navItemActive : ''}`}
              >
                <span className={styles.navLabel}>{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className={styles.navBadge}>{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

// Navigation sections based on user role
function getNavigationSections(role: UserRole, primaryDepartment?: Department | null) {
  const sections = [];

  // OVERVIEW section - always visible
  sections.push({
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', href: '/admin' },
      { label: 'Activity Feed', href: '/admin/activity' },
      { label: 'Announcements', href: '/admin/announcements' },
    ]
  });

  // SALES & CUSTOMER SERVICE section
  if (role === 'SUPER_ADMIN' || role === 'ADMIN' || primaryDepartment === Department.CUSTOMER_SERVICE) {
    sections.push({
      title: 'SALES & CUSTOMER SERVICE',
      items: [
        { label: 'CS Dashboard', href: '/admin/customer-service' },
        { label: 'Subscriptions', href: '/admin/customer-service/subscriptions' },
        { label: 'Orders', href: '/admin/orders' },
        { label: 'Refunds', href: '/admin/customer-service/refunds' },
        { label: 'Disputes', href: '/admin/customer-service/disputes' },
        { label: 'Members', href: '/admin/members' },
        { label: 'Sales', href: '/admin/sales' },
        { label: 'Revenue Analytics', href: '/admin/revenue-analytics' },
      ]
    });
  }

  // SUCCESS.COM section (Editorial)
  if (role === 'SUPER_ADMIN' || role === 'ADMIN' || primaryDepartment === Department.EDITORIAL) {
    sections.push({
      title: 'SUCCESS.COM',
      items: [
        { label: 'Editorial Dashboard', href: '/admin/editorial' },
        { label: 'Content Viewer', href: '/admin/content-viewer' },
        { label: 'Categories', href: '/admin/categories' },
        { label: 'Tags', href: '/admin/tags' },
        { label: 'Media Library', href: '/admin/media' },
        { label: 'Editorial Calendar', href: '/admin/editorial-calendar' },
        { label: 'SEO', href: '/admin/seo' },
        { label: 'Comments', href: '/admin/comments' },
      ]
    });
  }

  // SUCCESS+ section
  if (role === 'SUPER_ADMIN' || role === 'ADMIN' || primaryDepartment === Department.SUCCESS_PLUS) {
    sections.push({
      title: 'SUCCESS+',
      items: [
        { label: 'SUCCESS+ Dashboard', href: '/admin/success-plus' },
        { label: 'Resources', href: '/admin/resources' },
      ]
    });
  }

  // SUCCESS LABS - External link (appears for all)
  sections.push({
    title: 'SUCCESS LABS',
    items: [
      { label: 'Visit SUCCESS Labs →', href: 'https://labs.success.com/' },
    ]
  });

  // CRM & EMAIL section (Marketing only)
  if (role === 'SUPER_ADMIN' || role === 'ADMIN' || primaryDepartment === Department.MARKETING) {
    sections.push({
      title: 'CRM & EMAIL',
      items: [
        { label: 'CRM Dashboard', href: '/admin/crm' },
        { label: 'Contacts', href: '/admin/crm/contacts' },
        { label: 'Campaigns', href: '/admin/crm/campaigns' },
        { label: 'Deals', href: '/admin/crm/deals' },
        { label: 'Help Desk', href: '/admin/crm/tickets' },
        { label: 'Social Media', href: '/admin/social-media' },
        { label: 'CRM Analytics', href: '/admin/crm/analytics' },
      ]
    });
  }

  // MANAGEMENT section (Super Admin only)
  if (role === 'SUPER_ADMIN') {
    sections.push({
      title: 'MANAGEMENT',
      items: [
        { label: 'Super Admin Dashboard', href: '/admin/super' },
        { label: 'Staff', href: '/admin/staff' },
        { label: 'Users', href: '/admin/users' },
        { label: 'Permissions', href: '/admin/permissions' },
        { label: 'Activity Log', href: '/admin/activity-log' },
      ]
    });
  }

  // CONFIGURATION section (Super Admin only)
  if (role === 'SUPER_ADMIN') {
    sections.push({
      title: 'CONFIGURATION',
      items: [
        { label: 'Settings', href: '/admin/settings' },
        { label: 'Plugins', href: '/admin/plugins' },
        { label: 'Site Analytics', href: '/admin/analytics' },
        { label: 'Realtime Analytics', href: '/admin/analytics/realtime' },
        { label: 'Site Monitor', href: '/admin/site-monitor' },
        { label: 'Paylinks', href: '/admin/paylinks' },
      ]
    });
  }

  // DEVOPS & DEVELOPER section
  if (role === 'SUPER_ADMIN' || role === 'ADMIN' || primaryDepartment === Department.DEV) {
    sections.push({
      title: 'DEVOPS & DEVELOPER',
      items: [
        { label: 'Dev Dashboard', href: '/admin/dev' },
        { label: 'System Health', href: '/admin/devops/system-health' },
        { label: 'Cache Management', href: '/admin/devops/cache' },
        { label: 'Error Logs', href: '/admin/devops/error-logs' },
        { label: 'Safe Tools', href: '/admin/devops/safe-tools' },
        { label: 'Projects', href: '/admin/projects' },
      ]
    });
  }

  return sections;
}
