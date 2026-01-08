import { useState, useRef } from 'react';
import styles from './MediaUploader.module.css';

interface MediaUploaderProps {
  onUploadComplete?: (media: any) => void;
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
}

export default function MediaUploader({
  onUploadComplete,
  accept = 'image/jpeg,image/png,image/webp',
  maxSize = 10,
  multiple = false,
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File too large. Maximum size: ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (!accept.split(',').includes(file.type)) {
      setError('Invalid file type');
      return;
    }

    setError('');
    setPreview(URL.createObjectURL(file));

    // Upload file
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', file.name.replace(/\.[^/.]+$/, ''));

      // Simulate progress (Vercel Blob doesn't provide upload progress)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();

      if (onUploadComplete) {
        onUploadComplete(data);
      }

      // Reset after 2 seconds
      setTimeout(() => {
        setPreview(null);
        setProgress(0);
        setUploading(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
        handleFileSelect({ target: fileInputRef.current } as any);
      }
    }
  };

  return (
    <div className={styles.uploader}>
      {!preview ? (
        <div
          className={styles.dropzone}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className={styles.dropzoneIcon}>📁</div>
          <div className={styles.dropzoneText}>
            <strong>Click to upload</strong> or drag and drop
          </div>
          <div className={styles.dropzoneHint}>
            {accept.split(',').map(type => type.split('/')[1]).join(', ')} (max {maxSize}MB)
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileSelect}
            className={styles.fileInput}
          />
        </div>
      ) : (
        <div className={styles.preview}>
          <img src={preview} alt="Preview" className={styles.previewImage} />

          {uploading && (
            <div className={styles.progressOverlay}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className={styles.progressText}>
                {progress === 100 ? 'Upload complete!' : `Uploading... ${progress}%`}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className={styles.errorClose}>×</button>
        </div>
      )}
    </div>
  );
}
