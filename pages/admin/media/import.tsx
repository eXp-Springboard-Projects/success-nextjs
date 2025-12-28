import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/AdminLayout';
import { requireAdminAuth } from '@/lib/adminAuth';
import styles from './MediaImport.module.css';

interface ImportStats {
  page: number;
  totalPages: number;
  total: number;
  processed: number;
  imported: number;
  skipped: number;
  errors: number;
}

interface ImportProgress {
  isRunning: boolean;
  currentPage: number;
  stats: ImportStats | null;
  log: string[];
  errors: any[];
}

export default function MediaImport() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dryRunStats, setDryRunStats] = useState<any>(null);
  const [progress, setProgress] = useState<ImportProgress>({
    isRunning: false,
    currentPage: 0,
    stats: null,
    log: [],
    errors: []
  });
  const [perPage, setPerPage] = useState(100);
  const [batchSize, setBatchSize] = useState(5);
  const [autoMode, setAutoMode] = useState(true);
  const [useBulkImport, setUseBulkImport] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  const addLog = (message: string) => {
    setProgress(prev => ({
      ...prev,
      log: [...prev.log, `[${new Date().toLocaleTimeString()}] ${message}`]
    }));
  };

  const runDryRun = async () => {
    setLoading(true);
    setDryRunStats(null);
    addLog('Starting dry run...');

    try {
      addLog('Making API request to /api/admin/media/scrape-wordpress...');
      const res = await fetch('/api/admin/media/scrape-wordpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 1, perPage, dryRun: true })
      });

      addLog(`Response status: ${res.status} ${res.statusText}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        addLog(`ERROR Response: ${JSON.stringify(errorData)}`);
        throw new Error(`Dry run failed: ${errorData.message || res.statusText}`);
      }

      const data = await res.json();
      addLog(`Success! Response data: ${JSON.stringify(data).substring(0, 200)}...`);
      setDryRunStats(data);
      addLog(`Dry run complete: ${data.stats.total} total media items found across ${data.stats.totalPages} pages`);
    } catch (error: any) {
      addLog(`EXCEPTION: ${error.message}`);
      console.error('Dry run error:', error);
      alert(`Dry run failed: ${error.message}\n\nCheck the Import Log below for details.`);
    } finally {
      setLoading(false);
    }
  };

  const importPage = async (page: number): Promise<any> => {
    addLog(`Fetching page ${page}...`);

    const res = await fetch('/api/admin/media/scrape-wordpress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page, perPage, dryRun: false })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      addLog(`ERROR: API returned ${res.status}: ${JSON.stringify(errorData)}`);
      throw new Error(`Failed to import page ${page}: ${errorData.message || res.statusText}`);
    }

    return await res.json();
  };

  const importBatch = async (startPage: number): Promise<any> => {
    addLog(`Fetching batch starting at page ${startPage} (${batchSize} pages)...`);

    const res = await fetch('/api/admin/media/bulk-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startPage, batchSize, perPage })
    });

    if (!res.ok) {
      throw new Error(`Failed to import batch at page ${startPage}`);
    }

    return await res.json();
  };

  const startImport = async () => {
    if (!confirm('This will import all WordPress media to your database. Continue?')) {
      return;
    }

    setProgress({
      isRunning: true,
      currentPage: 0,
      stats: null,
      log: [],
      errors: []
    });

    addLog('Starting full import...');

    try {
      if (useBulkImport) {
        // Use bulk import for faster processing
        let page = 1;
        let hasMore = true;
        let totalImported = 0;
        let totalSkipped = 0;
        let totalErrors = 0;
        let totalPages = 0;

        while (hasMore && progress.isRunning !== false) {
          setProgress(prev => ({ ...prev, currentPage: page }));

          const result = await importBatch(page);

          totalImported += result.totalImported;
          totalSkipped += result.totalSkipped;
          totalErrors += result.totalErrors;
          totalPages = result.totalPages;

          addLog(`Batch completed: Pages ${page}-${page + result.pagesProcessed - 1}/${totalPages}`);
          addLog(`  → Imported: ${result.totalImported}, Skipped: ${result.totalSkipped}, Errors: ${result.totalErrors}`);

          // Collect errors from batch
          result.details.forEach((detail: any) => {
            if (detail.errors && detail.errors.length > 0) {
              setProgress(prev => ({
                ...prev,
                errors: [...prev.errors, ...detail.errors]
              }));
            }
          });

          setProgress(prev => ({
            ...prev,
            stats: {
              page: result.nextPage - 1,
              totalPages: result.totalPages,
              total: result.totalAvailable,
              processed: (result.nextPage - 1) * perPage,
              imported: totalImported,
              skipped: totalSkipped,
              errors: totalErrors
            }
          }));

          hasMore = result.hasMore;

          if (hasMore && autoMode) {
            page = result.nextPage;
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            hasMore = false;
          }
        }

        addLog(`✅ Bulk import complete! Total imported: ${totalImported}, Skipped: ${totalSkipped}, Errors: ${totalErrors}`);
        alert(`Import complete!\n\nImported: ${totalImported}\nSkipped: ${totalSkipped}\nErrors: ${totalErrors}`);

      } else {
        // Use page-by-page import (slower but more granular)
        let page = 1;
        let hasMore = true;
        let totalImported = 0;
        let totalSkipped = 0;
        let totalErrors = 0;

        while (hasMore && progress.isRunning !== false) {
          setProgress(prev => ({ ...prev, currentPage: page }));

          const result = await importPage(page);

          totalImported += result.imported.length;
          totalSkipped += result.skipped.length;
          totalErrors += result.errors.length;

          addLog(`Page ${page}/${result.stats.totalPages}: Imported ${result.imported.length}, Skipped ${result.skipped.length}, Errors ${result.errors.length}`);

          if (result.errors.length > 0) {
            setProgress(prev => ({
              ...prev,
              errors: [...prev.errors, ...result.errors]
            }));
          }

          setProgress(prev => ({
            ...prev,
            stats: {
              page: result.stats.page,
              totalPages: result.stats.totalPages,
              total: result.stats.total,
              processed: page * perPage,
              imported: totalImported,
              skipped: totalSkipped,
              errors: totalErrors
            }
          }));

          hasMore = result.hasMore;

          if (hasMore && autoMode) {
            page++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            hasMore = false;
          }
        }

        addLog(`✅ Import complete! Total imported: ${totalImported}, Skipped: ${totalSkipped}, Errors: ${totalErrors}`);
        alert(`Import complete!\n\nImported: ${totalImported}\nSkipped: ${totalSkipped}\nErrors: ${totalErrors}`);
      }

    } catch (error: any) {
      addLog(`❌ FATAL ERROR: ${error.message}`);
      alert(`Import failed: ${error.message}`);
    } finally {
      setProgress(prev => ({ ...prev, isRunning: false }));
    }
  };

  const stopImport = () => {
    if (confirm('Stop the import process?')) {
      setProgress(prev => ({ ...prev, isRunning: false }));
      addLog('Import stopped by user');
    }
  };

  if (status === 'loading') {
    return (
      <AdminLayout>
        <div className={styles.loading}>Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>WordPress Media Import</h1>
            <p className={styles.subtitle}>
              Import all media files from WordPress REST API to your local media library
            </p>
          </div>
        </div>

        {/* Configuration */}
        <div className={styles.section}>
          <h2>⚙️ Configuration</h2>
          <div className={styles.configGrid}>
            <div className={styles.configItem}>
              <label>Items per page:</label>
              <input
                type="number"
                value={perPage}
                onChange={(e) => setPerPage(parseInt(e.target.value))}
                min="1"
                max="100"
                disabled={progress.isRunning}
                className={styles.input}
              />
              <small>WordPress API limit: max 100</small>
            </div>
            <div className={styles.configItem}>
              <label>
                <input
                  type="checkbox"
                  checked={useBulkImport}
                  onChange={(e) => setUseBulkImport(e.target.checked)}
                  disabled={progress.isRunning}
                />
                {' '}Use bulk import (faster)
              </label>
            </div>
            {useBulkImport && (
              <div className={styles.configItem}>
                <label>Batch size (pages per request):</label>
                <input
                  type="number"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value))}
                  min="1"
                  max="10"
                  disabled={progress.isRunning}
                  className={styles.input}
                />
                <small>Process multiple pages in one request</small>
              </div>
            )}
            <div className={styles.configItem}>
              <label>
                <input
                  type="checkbox"
                  checked={autoMode}
                  onChange={(e) => setAutoMode(e.target.checked)}
                  disabled={progress.isRunning}
                />
                {' '}Auto-process all pages
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.section}>
          <h2>🚀 Actions</h2>
          <div className={styles.actionButtons}>
            <button
              onClick={runDryRun}
              disabled={loading || progress.isRunning}
              className={styles.button}
            >
              {loading ? '🔄 Running...' : '🔍 Run Dry Run'}
            </button>
            {!progress.isRunning ? (
              <button
                onClick={startImport}
                disabled={loading}
                className={`${styles.button} ${styles.primaryButton}`}
              >
                ▶️ Start Full Import
              </button>
            ) : (
              <button
                onClick={stopImport}
                className={`${styles.button} ${styles.dangerButton}`}
              >
                ⏹️ Stop Import
              </button>
            )}
          </div>
        </div>

        {/* Dry Run Results */}
        {dryRunStats && (
          <div className={styles.section}>
            <h2>📊 Dry Run Results</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{dryRunStats.stats.total}</div>
                <div className={styles.statLabel}>Total Media Items</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{dryRunStats.stats.totalPages}</div>
                <div className={styles.statLabel}>Total Pages</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{dryRunStats.stats.itemsOnPage}</div>
                <div className={styles.statLabel}>Items on First Page</div>
              </div>
            </div>

            {dryRunStats.sample && (
              <div className={styles.samplePreview}>
                <h3>Sample Items:</h3>
                <div className={styles.sampleGrid}>
                  {dryRunStats.sample.map((item: any) => (
                    <div key={item.id} className={styles.sampleItem}>
                      <img
                        src={item.url}
                        alt={item.title}
                        className={styles.sampleImage}
                      />
                      <div className={styles.sampleInfo}>
                        <strong>WP ID:</strong> {item.id}<br />
                        <strong>Type:</strong> {item.type}<br />
                        <strong>Title:</strong> {item.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress */}
        {progress.stats && (
          <div className={styles.section}>
            <h2>📈 Import Progress</h2>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${(progress.stats.page / progress.stats.totalPages) * 100}%`
                }}
              ></div>
            </div>
            <div className={styles.progressText}>
              Page {progress.stats.page} of {progress.stats.totalPages}
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: '#28a745' }}>
                  {progress.stats.imported}
                </div>
                <div className={styles.statLabel}>Imported</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: '#ffc107' }}>
                  {progress.stats.skipped}
                </div>
                <div className={styles.statLabel}>Skipped</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{ color: '#dc3545' }}>
                  {progress.stats.errors}
                </div>
                <div className={styles.statLabel}>Errors</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{progress.stats.total}</div>
                <div className={styles.statLabel}>Total Available</div>
              </div>
            </div>
          </div>
        )}

        {/* Import Log */}
        {progress.log.length > 0 && (
          <div className={styles.section}>
            <h2>📝 Import Log</h2>
            <div className={styles.logContainer}>
              {progress.log.map((entry, index) => (
                <div key={index} className={styles.logEntry}>
                  {entry}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Errors */}
        {progress.errors.length > 0 && (
          <div className={styles.section}>
            <h2>⚠️ Errors ({progress.errors.length})</h2>
            <div className={styles.errorContainer}>
              {progress.errors.map((error, index) => (
                <div key={index} className={styles.errorItem}>
                  <strong>WP ID {error.wpId}:</strong> {error.error}
                  <br />
                  <small>{error.url}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className={styles.section}>
          <h2>ℹ️ How It Works</h2>
          <ol className={styles.instructions}>
            <li>
              <strong>Dry Run:</strong> Click "Run Dry Run" to preview what will be imported
              without making any changes. This shows you the total number of media items
              available and a sample of the first few items.
            </li>
            <li>
              <strong>Configuration:</strong> Set the number of items to process per page
              (1-100). Higher numbers are faster but use more memory.
            </li>
            <li>
              <strong>Import:</strong> Click "Start Full Import" to begin importing all media.
              The process will automatically paginate through all available media and import
              each item to your database.
            </li>
            <li>
              <strong>Duplicates:</strong> Media items that already exist (by WordPress ID or URL)
              will be automatically skipped.
            </li>
            <li>
              <strong>Progress:</strong> Watch the progress bar and log to monitor the import.
              You can stop the import at any time.
            </li>
          </ol>
        </div>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps = requireAdminAuth;
