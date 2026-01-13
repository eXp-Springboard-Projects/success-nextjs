import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import styles from './Plugins.module.css';
import { requireAdminAuth } from '@/lib/adminAuth';

interface Plugin {
  id: string;
  name: string;
  category: string;
  description: string;
  version: string;
  active: boolean;
  hasUpdate: boolean;
  isPro: boolean;
}

export default function PluginsManager() {
  const { data: session } = useSession();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Auth is handled by requireAdminAuth in getServerSideProps
    // Load plugins immediately since server-side auth already verified access
    loadPlugins();
  }, []);

  const handleTogglePlugin = (pluginId: string) => {
    setPlugins(plugins.map(p =>
      p.id === pluginId ? { ...p, active: !p.active } : p
    ));
  };

  const handleUpdatePlugin = (pluginId: string) => {
    setPlugins(plugins.map(p =>
      p.id === pluginId ? { ...p, hasUpdate: false, version: p.version + ' (updated)' } : p
    ));
  };

  const handleUpdateAll = () => {
    setPlugins(plugins.map(p =>
      p.hasUpdate ? { ...p, hasUpdate: false, version: p.version + ' (updated)' } : p
    ));
  };

  const handleSettings = (pluginName: string) => {
    alert(`Settings for ${pluginName}\n\nPlugin settings are managed in the WordPress admin panel.`);
  };

  const loadPlugins = () => {
    // Plugin data from SUCCESS WordPress site
    const pluginData: Plugin[] = [
      // CRM & Marketing
      { id: '1', name: 'WP Fusion', category: 'CRM & Marketing', description: 'Syncs with HubSpot and marketing automation', version: '3.42.9', active: true, hasUpdate: false, isPro: true },
      { id: '2', name: 'HubSpot All-In-One Marketing', category: 'CRM & Marketing', description: 'Complete HubSpot CRM integration', version: '11.1.84', active: true, hasUpdate: true, isPro: false },
      { id: '3', name: 'OptinMonster', category: 'CRM & Marketing', description: 'Lead generation and conversion optimization', version: '2.16.5', active: true, hasUpdate: false, isPro: true },
      { id: '4', name: 'Zapier for WordPress', category: 'CRM & Marketing', description: 'Connect WordPress to 5000+ apps', version: '2.8.0', active: true, hasUpdate: false, isPro: false },
      { id: '5', name: 'Magic Login Pro', category: 'CRM & Marketing', description: 'Passwordless authentication for WordPress', version: '1.5.2', active: true, hasUpdate: false, isPro: true },
      { id: '6', name: 'Mailchimp for WordPress', category: 'CRM & Marketing', description: 'Newsletter signup forms', version: '4.9.15', active: true, hasUpdate: false, isPro: false },

      // Page Builders
      { id: '10', name: 'Elementor', category: 'Page Builder', description: 'Drag and drop page builder', version: '3.25.8', active: true, hasUpdate: true, isPro: false },
      { id: '11', name: 'Elementor Pro', category: 'Page Builder', description: 'Professional features for Elementor', version: '3.25.4', active: true, hasUpdate: true, isPro: true },
      { id: '12', name: 'JetBlocks For Elementor', category: 'Page Builder', description: 'Header and footer builder', version: '1.3.11', active: true, hasUpdate: false, isPro: false },
      { id: '13', name: 'JetBlog For Elementor', category: 'Page Builder', description: 'Blog widgets for Elementor', version: '2.2.21', active: true, hasUpdate: false, isPro: false },
      { id: '14', name: 'JetElements For Elementor', category: 'Page Builder', description: 'Addon widgets for Elementor', version: '2.6.22', active: true, hasUpdate: false, isPro: false },
      { id: '15', name: 'JetEngine', category: 'Page Builder', description: 'Dynamic content and listings', version: '3.5.8', active: true, hasUpdate: true, isPro: true },
      { id: '16', name: 'JetFormBuilder', category: 'Page Builder', description: 'Form builder for Elementor', version: '3.4.5', active: true, hasUpdate: false, isPro: false },
      { id: '17', name: 'JetMenu', category: 'Page Builder', description: 'Mega menu builder', version: '2.0.10', active: true, hasUpdate: false, isPro: false },
      { id: '18', name: 'JetPopup', category: 'Page Builder', description: 'Popup and paywall system', version: '1.4.2', active: true, hasUpdate: false, isPro: false },
      { id: '19', name: 'JetSearch', category: 'Page Builder', description: 'Ajax search for Elementor', version: '3.5.3', active: true, hasUpdate: false, isPro: false },
      { id: '20', name: 'JetSmartFilters', category: 'Page Builder', description: 'Filtering for dynamic content', version: '3.5.5', active: true, hasUpdate: false, isPro: false },
      { id: '21', name: 'JetTabs For Elementor', category: 'Page Builder', description: 'Tabs and accordion widgets', version: '2.2.0', active: true, hasUpdate: false, isPro: false },

      // Advertising
      { id: '30', name: 'Advanced Ads', category: 'Advertising', description: 'Ad management platform', version: '1.57.3', active: true, hasUpdate: true, isPro: false },
      { id: '31', name: 'Advanced Ads Pro', category: 'Advertising', description: 'Professional ad features', version: '2.43.1', active: true, hasUpdate: false, isPro: true },
      { id: '32', name: 'Advanced Ads – AMP Ads', category: 'Advertising', description: 'AMP page advertising', version: '1.4.4', active: true, hasUpdate: false, isPro: true },
      { id: '33', name: 'Advanced Ads – Google Ad Manager', category: 'Advertising', description: 'Google Ad Manager integration', version: '1.8.9', active: true, hasUpdate: false, isPro: true },
      { id: '34', name: 'Advanced Ads – PopUp and Layer Ads', category: 'Advertising', description: 'Popup advertising', version: '1.8.2', active: true, hasUpdate: false, isPro: true },
      { id: '35', name: 'Advanced Ads – Selling Ads', category: 'Advertising', description: 'Sell ad space directly', version: '2.3.1', active: true, hasUpdate: false, isPro: true },
      { id: '36', name: 'Advanced Ads – Slider', category: 'Advertising', description: 'Rotating ad slider', version: '1.7.8', active: true, hasUpdate: false, isPro: true },
      { id: '37', name: 'Advanced Ads – Sticky Ads', category: 'Advertising', description: 'Sticky positioned ads', version: '1.13.6', active: true, hasUpdate: false, isPro: true },
      { id: '38', name: 'Advanced Ads – Tracking', category: 'Advertising', description: 'Ad performance tracking', version: '2.12.4', active: true, hasUpdate: false, isPro: true },

      // SEO & Performance
      { id: '40', name: 'Yoast SEO', category: 'SEO & Performance', description: 'Complete SEO optimization', version: '23.9', active: true, hasUpdate: true, isPro: false },
      { id: '41', name: 'Yoast SEO Premium', category: 'SEO & Performance', description: 'Professional SEO features', version: '23.9', active: true, hasUpdate: true, isPro: true },
      { id: '42', name: 'Yoast SEO Premium - SUCCESS Edition', category: 'SEO & Performance', description: 'Custom SUCCESS configuration', version: '1.0.0', active: true, hasUpdate: false, isPro: true },
      { id: '43', name: 'Yoast SEO: News', category: 'SEO & Performance', description: 'Google News sitemap', version: '14.9', active: true, hasUpdate: false, isPro: true },
      { id: '44', name: 'SEO Scout', category: 'SEO & Performance', description: 'SEO monitoring and alerts', version: '2.1.3', active: true, hasUpdate: false, isPro: false },
      { id: '45', name: 'Imagify', category: 'SEO & Performance', description: 'Image optimization', version: '2.2.4', active: true, hasUpdate: false, isPro: true },
      { id: '46', name: 'WP-Optimize', category: 'SEO & Performance', description: 'Clean, compress, cache', version: '3.7.2', active: true, hasUpdate: true, isPro: false },

      // Content & Publishing
      { id: '50', name: 'Duplicate Page', category: 'Content & Publishing', description: 'Clone posts and pages quickly', version: '4.6', active: true, hasUpdate: false, isPro: false },
      { id: '51', name: 'Post Type Switcher', category: 'Content & Publishing', description: 'Switch post types easily', version: '3.3.1', active: true, hasUpdate: false, isPro: false },
      { id: '52', name: 'Default featured image', category: 'Content & Publishing', description: 'Set default featured images', version: '1.7.4', active: true, hasUpdate: false, isPro: false },
      { id: '53', name: 'Recent Posts Widget With Thumbnails', category: 'Content & Publishing', description: 'Display recent posts with thumbnails', version: '7.1', active: true, hasUpdate: false, isPro: false },
      { id: '54', name: 'WordPress Popular Posts', category: 'Content & Publishing', description: 'Track and display popular content', version: '7.1.0', active: true, hasUpdate: false, isPro: false },
      { id: '55', name: 'Better Click To Tweet', category: 'Content & Publishing', description: 'Embeddable click to tweet quotes', version: '6.0.3', active: true, hasUpdate: false, isPro: false },
      { id: '56', name: 'Ultimate Blocks', category: 'Content & Publishing', description: 'Gutenberg blocks collection', version: '3.3.1', active: true, hasUpdate: false, isPro: false },
      { id: '57', name: 'Pods', category: 'Content & Publishing', description: 'Custom content types and fields', version: '3.2.8', active: true, hasUpdate: true, isPro: false },
      { id: '58', name: 'Molongui Authorship Pro', category: 'Content & Publishing', description: 'Guest authors and co-authors system', version: '4.9.2', active: true, hasUpdate: false, isPro: true },
      { id: '59', name: 'Add To Any Share Buttons', category: 'Content & Publishing', description: 'Social sharing buttons for all platforms', version: '1.8.14', active: true, hasUpdate: false, isPro: false },
      { id: '70', name: 'Advanced Custom Fields (ACF)', category: 'Content & Publishing', description: 'Custom fields for WordPress', version: '6.3.10', active: true, hasUpdate: false, isPro: false },
      { id: '71', name: 'Advanced Custom Fields Pro', category: 'Content & Publishing', description: 'Professional custom fields', version: '6.3.10', active: true, hasUpdate: false, isPro: true },
      { id: '72', name: 'TablePress', category: 'Content & Publishing', description: 'Create and manage tables', version: '2.4.3', active: true, hasUpdate: false, isPro: false },
      { id: '73', name: 'Redirection', category: 'Content & Publishing', description: 'Manage 301 redirects and track 404 errors', version: '5.5.0', active: true, hasUpdate: false, isPro: false },

      // Security & Maintenance
      { id: '60', name: 'Akismet Anti-spam', category: 'Security & Maintenance', description: 'Spam protection for comments and forms', version: '5.3.3', active: true, hasUpdate: false, isPro: false },
      { id: '61', name: 'BlogVault Backup & Security', category: 'Security & Maintenance', description: 'Automated daily backups and security scanning', version: '5.65', active: true, hasUpdate: false, isPro: true },
      { id: '62', name: 'Broken Link Checker', category: 'Security & Maintenance', description: 'Find and fix broken links and images', version: '2.4.3', active: true, hasUpdate: false, isPro: false },
      { id: '63', name: 'Auto Logout After 7 Days', category: 'Security & Maintenance', description: 'Auto logout inactive users for security', version: '1.2.0', active: true, hasUpdate: false, isPro: false },
      { id: '80', name: 'Wordfence Security', category: 'Security & Maintenance', description: 'Firewall and malware scanner', version: '8.0.1', active: true, hasUpdate: false, isPro: false },
      { id: '81', name: 'UpdraftPlus Backup', category: 'Security & Maintenance', description: 'Backup and restoration', version: '1.24.6', active: true, hasUpdate: false, isPro: false },

      // API & Development
      { id: '64', name: 'WPGraphQL', category: 'API & Development', description: 'GraphQL API for WordPress', version: '1.28.0', active: true, hasUpdate: true, isPro: false },
      { id: '65', name: 'WPGraphQL for ACF', category: 'API & Development', description: 'ACF support for GraphQL', version: '3.0.0', active: true, hasUpdate: false, isPro: false },
      { id: '66', name: 'WPGraphQL IDE', category: 'API & Development', description: 'GraphQL IDE in WordPress admin', version: '3.0.5', active: true, hasUpdate: false, isPro: false },
      { id: '82', name: 'Custom Post Type UI', category: 'API & Development', description: 'Create custom post types and taxonomies', version: '1.17.1', active: true, hasUpdate: false, isPro: false },
      { id: '83', name: 'WP REST API Controller', category: 'API & Development', description: 'Manage WordPress REST API endpoints', version: '2.4.0', active: true, hasUpdate: false, isPro: false },

      // E-Commerce & Payments
      { id: '90', name: 'WooCommerce', category: 'E-Commerce & Payments', description: 'Complete e-commerce solution', version: '9.5.2', active: true, hasUpdate: false, isPro: false },
      { id: '91', name: 'WooCommerce Stripe Gateway', category: 'E-Commerce & Payments', description: 'Accept credit cards with Stripe', version: '8.9.0', active: true, hasUpdate: false, isPro: false },
      { id: '92', name: 'WooCommerce Subscriptions', category: 'E-Commerce & Payments', description: 'Sell subscription products', version: '6.9.0', active: true, hasUpdate: false, isPro: true },
      { id: '93', name: 'PayKickstart Integration', category: 'E-Commerce & Payments', description: 'Connect with PayKickstart checkout', version: '2.1.5', active: true, hasUpdate: false, isPro: false },

      // Analytics & Tracking
      { id: '100', name: 'Google Analytics for WordPress by MonsterInsights', category: 'Analytics & Tracking', description: 'Connect Google Analytics to WordPress', version: '9.2.3', active: true, hasUpdate: false, isPro: false },
      { id: '101', name: 'Google Tag Manager', category: 'Analytics & Tracking', description: 'Add Google Tag Manager to your site', version: '1.20.2', active: true, hasUpdate: false, isPro: false },
      { id: '102', name: 'Pixel Caffeine', category: 'Analytics & Tracking', description: 'Facebook Pixel and event tracking', version: '5.6.1', active: true, hasUpdate: false, isPro: false },

      // Media & Files
      { id: '110', name: 'WP Smush', category: 'Media & Files', description: 'Image compression and optimization', version: '3.18.4', active: true, hasUpdate: false, isPro: false },
      { id: '111', name: 'Enable Media Replace', category: 'Media & Files', description: 'Replace media files easily', version: '4.2.1', active: true, hasUpdate: false, isPro: false },
      { id: '112', name: 'FileBird', category: 'Media & Files', description: 'Organize media library with folders', version: '6.0.1', active: true, hasUpdate: false, isPro: false },
    ];

    setPlugins(pluginData);
  };

  const categories = ['all', 'CRM & Marketing', 'Page Builder', 'Advertising', 'SEO & Performance', 'Content & Publishing', 'Security & Maintenance', 'API & Development', 'E-Commerce & Payments', 'Analytics & Tracking', 'Media & Files'];

  const filteredPlugins = plugins.filter(plugin => {
    const matchesCategory = filterCategory === 'all' || plugin.category === filterCategory;
    const matchesSearch = plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeCount = plugins.filter(p => p.active).length;
  const updateCount = plugins.filter(p => p.hasUpdate).length;

  if (loading) {
    return <AdminLayout><div className={styles.loading}>Loading...</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Plugins</h1>
            <p className={styles.subtitle}>
              {activeCount} active plugins | {updateCount} updates available
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.updateAllButton}
              onClick={handleUpdateAll}
              disabled={updateCount === 0}
            >
              Update All ({updateCount})
            </button>
            <button className={styles.addNewButton}>
              + Add New Plugin
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className={styles.toolbar}>
          <input
            type="text"
            placeholder="Search plugins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />

          <div className={styles.categoryFilter}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={cat === filterCategory ? styles.categoryActive : styles.categoryButton}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Plugins List */}
        <div className={styles.pluginsList}>
          {filteredPlugins.map(plugin => (
            <div key={plugin.id} className={styles.pluginCard}>
              <div className={styles.pluginHeader}>
                <div className={styles.pluginInfo}>
                  <h3 className={styles.pluginName}>
                    {plugin.name}
                    {plugin.isPro && <span className={styles.proBadge}>PRO</span>}
                    {plugin.hasUpdate && <span className={styles.updateBadge}>Update Available</span>}
                  </h3>
                  <p className={styles.pluginDescription}>{plugin.description}</p>
                </div>
                <div className={styles.pluginStatus}>
                  <span className={plugin.active ? styles.activeStatus : styles.inactiveStatus}>
                    {plugin.active ? '● Active' : '○ Inactive'}
                  </span>
                </div>
              </div>

              <div className={styles.pluginFooter}>
                <span className={styles.version}>Version {plugin.version}</span>
                <span className={styles.category}>{plugin.category}</span>
                <div className={styles.pluginActions}>
                  {plugin.active ? (
                    <button
                      className={styles.deactivateButton}
                      onClick={() => handleTogglePlugin(plugin.id)}
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      className={styles.activateButton}
                      onClick={() => handleTogglePlugin(plugin.id)}
                    >
                      Activate
                    </button>
                  )}
                  {plugin.hasUpdate && (
                    <button
                      className={styles.updateButton}
                      onClick={() => handleUpdatePlugin(plugin.id)}
                    >
                      Update
                    </button>
                  )}
                  <button
                    className={styles.settingsButton}
                    onClick={() => handleSettings(plugin.name)}
                  >
                    Settings
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

// Force SSR to prevent NextRouter errors during build

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
