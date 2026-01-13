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
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
        {/* User Profile at Top */}
        <div className={styles.sidebarHeader}>
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

        {/* Sign Out at Bottom */}
        <div className={styles.sidebarFooter}>
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

            {/* User Account Menu */}
            <div className={styles.headerUserMenu}>
              <button
                className={styles.headerUserButton}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                onBlur={() => setTimeout(() => setUserMenuOpen(false), 200)}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className={styles.headerUserAvatar} />
                ) : (
                  <div className={styles.headerUserAvatarPlaceholder}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={styles.headerUserInfo}>
                  <span className={styles.headerUserName}>{user.name}</span>
                  <span className={styles.headerUserRole}>{user.role}</span>
                </div>
                <svg className={styles.headerUserChevron} width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {userMenuOpen && (
                <div className={styles.headerUserDropdown}>
                  <div className={styles.dropdownHeader}>
                    <div className={styles.dropdownUserName}>{user.name}</div>
                    <div className={styles.dropdownUserEmail}>{user.email}</div>
                  </div>
                  <div className={styles.dropdownDivider} />
                  <Link href="/admin/account" className={styles.dropdownItem}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span>Account Settings</span>
                  </Link>
                  <Link href="/admin/account/password" className={styles.dropdownItem}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span>Change Password</span>
                  </Link>
                  <div className={styles.dropdownDivider} />
                  <Link href="/api/auth/signout" className={styles.dropdownItem}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                    </svg>
                    <span>Sign Out</span>
                  </Link>
                </div>
              )}
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
        { label: 'Articles', href: '/admin/posts' },
        { label: 'Content Viewer', href: '/admin/content-viewer' },
        { label: 'Categories', href: '/admin/categories' },
        { label: 'Tags', href: '/admin/tags' },
        { label: 'Media Library', href: '/admin/media' },
        { label: 'Editorial Calendar', href: '/admin/editorial-calendar' },
        { label: 'SEO', href: '/admin/seo' },
      ]
    });
  }

  // WEBSITE PAGES section - Manage static pages
  if (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'EDITOR') {
    sections.push({
      title: 'WEBSITE PAGES',
      items: [
        { label: 'Page Editor', href: '/admin/page-editor' },
        { label: 'About Us', href: '/admin/about/editor' },
        { label: 'Store Products', href: '/admin/store-products' },
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

  // CRM & EMAIL section (Marketing)
  if (role === 'SUPER_ADMIN' || role === 'ADMIN' || primaryDepartment === Department.MARKETING) {
    sections.push({
      title: 'CRM & EMAIL',
      items: [
        { label: 'CRM Dashboard', href: '/admin/crm' },
        { label: 'Contacts', href: '/admin/crm/contacts' },
        { label: 'Campaigns', href: '/admin/crm/campaigns' },
        { label: 'Deals', href: '/admin/crm/deals' },
        { label: 'Help Desk', href: '/admin/crm/tickets' },
        { label: 'CRM Analytics', href: '/admin/crm/analytics' }
      ]
    });
  }

  // SOCIAL MEDIA section (Marketing and Social Team)
  if (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'SOCIAL_TEAM' || primaryDepartment === Department.MARKETING) {
    sections.push({
      title: 'SOCIAL MEDIA',
      items: [
        { label: 'Dashboard', href: '/admin/social-media' },
        { label: 'Composer', href: '/admin/social-media/composer' },
        { label: 'Scheduler', href: '/admin/social-media/scheduler' },
        { label: 'Calendar', href: '/admin/social-media/calendar' },
        { label: 'Queue', href: '/admin/social-media/queue' },
        { label: 'Accounts', href: '/admin/social-media/accounts' },
        { label: 'Requests', href: '/admin/social-media/requests' },
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
