/**
 * Media Library Picker Modal
 *
 * WordPress-style media library for selecting/uploading images
 * Integrates with TipTap editor for inline image insertion
 */

import { useState, useEffect, useRef } from 'react';
import styles from './MediaLibraryPicker.module.css';

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  createdAt: string;
  uploadedBy?: string;
}

interface MediaLibraryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem) => void;
  allowMultiple?: boolean;
  filterType?: 'image' | 'video' | 'audio' | 'all';
}

export default function MediaLibraryPicker({
  isOpen,
  onClose,
  onSelect,
  allowMultiple = false,
  filterType = 'image',
}: MediaLibraryPickerProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen]);

  useEffect(() => {
    filterMedia();
  }, [searchQuery, media, filterType]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/media?per_page=200&orderBy=createdAt&order=desc');
      if (res.ok) {
        const data = await res.json();
        setMedia(data);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const filterMedia = () => {
    let filtered = media;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(item => {
        if (filterType === 'image') return item.mimeType?.startsWith('image/');
        if (filterType === 'video') return item.mimeType?.startsWith('video/');
        if (filterType === 'audio') return item.mimeType?.startsWith('audio/');
        return true;
      });
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.filename?.toLowerCase().includes(query) ||
        item.alt?.toLowerCase().includes(query) ||
        item.caption?.toLowerCase().includes(query)
      );
    }

    setFilteredMedia(filtered);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await uploadFile(file);
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      // Refresh media list
      await fetchMedia();

      // Switch to library tab to show uploaded files
      setActiveTab('library');
    } catch (error) {
      alert('Failed to upload some files');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('alt', file.name.replace(/\.[^/.]+$/, '')); // Remove extension for alt text

    const res = await fetch('/api/media/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Failed to upload ${file.name}`);
    }

    return await res.json();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);

    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        await uploadFile(files[i]);
        setUploadProgress(((i + 1) / files.length) * 100);
      }
      await fetchMedia();
      setActiveTab('library');
    } catch (error) {
      alert('Failed to upload some files');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleMediaClick = (item: MediaItem) => {
    setSelectedMedia(item);
    if (allowMultiple) {
      const newSelected = new Set(selectedItems);
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id);
      } else {
        newSelected.add(item.id);
      }
      setSelectedItems(newSelected);
    }
  };

  const handleInsert = () => {
    if (allowMultiple) {
      // Insert all selected items
      const selected = media.filter(item => selectedItems.has(item.id));
      selected.forEach(item => onSelect(item));
    } else if (selectedMedia) {
      onSelect(selectedMedia);
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedItems(new Set());
    setSelectedMedia(null);
    setSearchQuery('');
    setActiveTab('library');
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Media Library</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'library' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('library')}
          >
            📚 Media Library
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'upload' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            ⬆️ Upload Files
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'library' ? (
            <>
              <div className={styles.toolbar}>
                <input
                  type="search"
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                <span className={styles.resultCount}>
                  {filteredMedia.length} item{filteredMedia.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className={styles.gridContainer}>
                {loading ? (
                  <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading media...</p>
                  </div>
                ) : filteredMedia.length === 0 ? (
                  <div className={styles.empty}>
                    <p>No media files found</p>
                    {searchQuery && <button onClick={() => setSearchQuery('')}>Clear search</button>}
                  </div>
                ) : (
                  <div className={styles.grid}>
                    {filteredMedia.map((item) => {
                      const isSelected = allowMultiple
                        ? selectedItems.has(item.id)
                        : selectedMedia?.id === item.id;

                      return (
                        <div
                          key={item.id}
                          className={`${styles.gridItem} ${isSelected ? styles.selected : ''}`}
                          onClick={() => handleMediaClick(item)}
                        >
                          {item.mimeType?.startsWith('image/') ? (
                            <img src={item.url} alt={item.alt || item.filename} />
                          ) : (
                            <div className={styles.fileIcon}>
                              {item.mimeType?.startsWith('video/') ? '🎥' : '📄'}
                            </div>
                          )}
                          <div className={styles.itemInfo}>
                            <span className={styles.filename} title={item.filename}>
                              {item.filename}
                            </span>
                          </div>
                          {isSelected && (
                            <div className={styles.selectedBadge}>✓</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedMedia && (
                <div className={styles.details}>
                  <h3>Media Details</h3>
                  {selectedMedia.mimeType?.startsWith('image/') && (
                    <img
                      src={selectedMedia.url}
                      alt={selectedMedia.alt || selectedMedia.filename}
                      className={styles.detailsImage}
                    />
                  )}
                  <div className={styles.detailsInfo}>
                    <div className={styles.detailRow}>
                      <strong>Filename:</strong>
                      <span>{selectedMedia.filename}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <strong>File Type:</strong>
                      <span>{selectedMedia.mimeType}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <strong>File Size:</strong>
                      <span>{formatFileSize(selectedMedia.size)}</span>
                    </div>
                    {selectedMedia.width && selectedMedia.height && (
                      <div className={styles.detailRow}>
                        <strong>Dimensions:</strong>
                        <span>{selectedMedia.width} × {selectedMedia.height}px</span>
                      </div>
                    )}
                    <div className={styles.detailRow}>
                      <strong>Uploaded:</strong>
                      <span>{formatDate(selectedMedia.createdAt)}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <strong>URL:</strong>
                      <input
                        type="text"
                        value={selectedMedia.url}
                        readOnly
                        className={styles.urlInput}
                        onClick={(e) => e.currentTarget.select()}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div
              className={styles.uploadZone}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={filterType === 'image' ? 'image/*' : filterType === 'video' ? 'video/*' : '*'}
                onChange={handleFileSelect}
                className={styles.fileInput}
                id="file-upload"
              />

              {uploading ? (
                <div className={styles.uploadProgress}>
                  <div className={styles.spinner}></div>
                  <p>Uploading files...</p>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
              ) : (
                <>
                  <div className={styles.uploadIcon}>📤</div>
                  <h3>Drop files to upload</h3>
                  <p>or</p>
                  <label htmlFor="file-upload" className={styles.uploadButton}>
                    Select Files
                  </label>
                  <p className={styles.uploadHint}>
                    Maximum file size: 10MB
                    {filterType !== 'all' && ` • ${filterType} files only`}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={handleClose}>
            Cancel
          </button>
          <button
            className={styles.insertButton}
            onClick={handleInsert}
            disabled={!selectedMedia && selectedItems.size === 0}
          >
            {allowMultiple && selectedItems.size > 0
              ? `Insert ${selectedItems.size} item${selectedItems.size !== 1 ? 's' : ''}`
              : 'Insert into Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
