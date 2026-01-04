import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/AdminLayout';
import { requireAdminAuth } from '@/lib/adminAuth';
import styles from './PageEditor.module.css';

type PageOverride = {
  id?: string;
  page_path: string;
  overrides: Record<string, any>;
  updated_at?: string;
};

const AVAILABLE_PAGES = [
  { path: '/press', name: 'Press & Media' },
  { path: '/about', name: 'About Us' },
  { path: '/magazine', name: 'Magazine' },
  { path: '/subscribe', name: 'Subscribe' },
  { path: '/contact', name: 'Contact' },
  { path: '/terms', name: 'Terms of Service' },
  { path: '/privacy', name: 'Privacy Policy' },
  { path: '/advertise', name: 'Advertise' },
  { path: '/store', name: 'Store' },
  { path: '/help', name: 'Help Center' },
];

export default function PageEditorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [overrides, setOverrides] = useState<PageOverride | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Element selector and value inputs
  const [newSelector, setNewSelector] = useState('');
  const [newProperty, setNewProperty] = useState('');
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  const loadPageOverrides = async (pagePath: string) => {
    if (!pagePath) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/page-editor?page_path=${encodeURIComponent(pagePath)}`);
      const data = await response.json();

      if (response.ok) {
        setOverrides(data);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load overrides' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePageSelect = (pagePath: string) => {
    setSelectedPage(pagePath);
    setMessage(null);
    loadPageOverrides(pagePath);
  };

  const addOverride = () => {
    if (!newSelector || !newProperty || !newValue) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    const currentOverrides = overrides?.overrides || {};
    const selectorOverrides = currentOverrides[newSelector] || {};

    setOverrides({
      ...overrides,
      page_path: selectedPage,
      overrides: {
        ...currentOverrides,
        [newSelector]: {
          ...selectorOverrides,
          [newProperty]: newValue,
        },
      },
    } as PageOverride);

    // Clear inputs
    setNewSelector('');
    setNewProperty('');
    setNewValue('');
    setMessage({ type: 'success', text: 'Override added (click Save to apply)' });
  };

  const removeOverride = (selector: string, property: string) => {
    if (!overrides) return;

    const currentOverrides = { ...overrides.overrides };
    const selectorOverrides = { ...currentOverrides[selector] };

    delete selectorOverrides[property];

    if (Object.keys(selectorOverrides).length === 0) {
      delete currentOverrides[selector];
    } else {
      currentOverrides[selector] = selectorOverrides;
    }

    setOverrides({
      ...overrides,
      overrides: currentOverrides,
    });

    setMessage({ type: 'success', text: 'Override removed (click Save to apply)' });
  };

  const saveOverrides = async () => {
    if (!selectedPage || !overrides) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/page-editor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_path: selectedPage,
          overrides: overrides.overrides,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Page overrides saved successfully!' });
        setOverrides(data);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save overrides' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const resetOverrides = async () => {
    if (!selectedPage) return;
    if (!confirm('Are you sure you want to reset all overrides for this page?')) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/page-editor?page_path=${encodeURIComponent(selectedPage)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Page overrides reset successfully!' });
        setOverrides({ page_path: selectedPage, overrides: {} });
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to reset overrides' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading') {
    return <AdminLayout><div className={styles.loading}>Loading...</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Visual Page Editor</h1>
          <p className={styles.subtitle}>Edit any page on the site by adding CSS overrides</p>
        </header>

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        <div className={styles.grid}>
          {/* Page Selector */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Select Page</h2>
            <div className={styles.pageList}>
              {AVAILABLE_PAGES.map((page) => (
                <button
                  key={page.path}
                  className={`${styles.pageButton} ${selectedPage === page.path ? styles.active : ''}`}
                  onClick={() => handlePageSelect(page.path)}
                >
                  <span className={styles.pageName}>{page.name}</span>
                  <span className={styles.pagePath}>{page.path}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Editor */}
          {selectedPage && (
            <div className={styles.editor}>
              <div className={styles.editorHeader}>
                <h2 className={styles.cardTitle}>
                  Editing: {AVAILABLE_PAGES.find(p => p.path === selectedPage)?.name}
                </h2>
                <div className={styles.actions}>
                  <a
                    href={`https://www.success.com${selectedPage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.previewButton}
                  >
                    👁️ Preview Page
                  </a>
                  <button
                    onClick={saveOverrides}
                    disabled={saving || loading}
                    className={styles.saveButton}
                  >
                    {saving ? 'Saving...' : '💾 Save Changes'}
                  </button>
                  <button
                    onClick={resetOverrides}
                    disabled={saving || loading}
                    className={styles.resetButton}
                  >
                    🔄 Reset All
                  </button>
                </div>
              </div>

              {loading ? (
                <div className={styles.loading}>Loading overrides...</div>
              ) : (
                <>
                  {/* Add New Override */}
                  <div className={styles.addOverride}>
                    <h3 className={styles.sectionTitle}>Add New Override</h3>
                    <div className={styles.inputGrid}>
                      <div className={styles.inputGroup}>
                        <label className={styles.label}>CSS Selector</label>
                        <input
                          type="text"
                          placeholder=".title, #header, etc."
                          value={newSelector}
                          onChange={(e) => setNewSelector(e.target.value)}
                          className={styles.input}
                        />
                        <small className={styles.hint}>e.g., .title, #header, .hero h1</small>
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.label}>CSS Property</label>
                        <input
                          type="text"
                          placeholder="color, font-size, etc."
                          value={newProperty}
                          onChange={(e) => setNewProperty(e.target.value)}
                          className={styles.input}
                        />
                        <small className={styles.hint}>e.g., color, fontSize, backgroundColor</small>
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.label}>Value</label>
                        <input
                          type="text"
                          placeholder="#FF0000, 24px, etc."
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                          className={styles.input}
                        />
                        <small className={styles.hint}>e.g., #FF0000, 24px, bold</small>
                      </div>
                      <button onClick={addOverride} className={styles.addButton}>
                        ➕ Add Override
                      </button>
                    </div>
                  </div>

                  {/* Current Overrides */}
                  <div className={styles.overridesList}>
                    <h3 className={styles.sectionTitle}>Current Overrides</h3>
                    {overrides && Object.keys(overrides.overrides).length > 0 ? (
                      <div className={styles.overridesGrid}>
                        {Object.entries(overrides.overrides).map(([selector, properties]) => (
                          <div key={selector} className={styles.overrideItem}>
                            <h4 className={styles.selector}>{selector}</h4>
                            <div className={styles.properties}>
                              {Object.entries(properties as Record<string, string>).map(([prop, value]) => (
                                <div key={prop} className={styles.property}>
                                  <span className={styles.propName}>{prop}:</span>
                                  <span className={styles.propValue}>{value}</span>
                                  <button
                                    onClick={() => removeOverride(selector, prop)}
                                    className={styles.removeButton}
                                    title="Remove this override"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.empty}>No overrides yet. Add your first override above.</p>
                    )}
                  </div>

                  {/* Help Section */}
                  <div className={styles.help}>
                    <h3 className={styles.sectionTitle}>How to Use</h3>
                    <ol className={styles.helpList}>
                      <li>Open the page you want to edit in a new tab</li>
                      <li>Right-click the element you want to change and select "Inspect"</li>
                      <li>Find the CSS class or ID (e.g., <code>.title</code> or <code>#header</code>)</li>
                      <li>Add an override above with the selector, property, and new value</li>
                      <li>Click "Save Changes" to apply your overrides</li>
                      <li>Refresh the page to see your changes</li>
                    </ol>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// Server-side authentication check
export const getServerSideProps = requireAdminAuth;
