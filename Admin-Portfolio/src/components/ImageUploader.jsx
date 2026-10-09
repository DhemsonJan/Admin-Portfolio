import { useRef, useState } from 'react';
import api from 'shared/lib/api.js';
import { compressImage, IMAGE_ACCEPT, IMAGE_MAX_BYTES } from '../lib/image.js';
import { useToast } from 'shared/components/Toast.jsx';

const MAX_BYTES = IMAGE_MAX_BYTES;
const ACCEPT = IMAGE_ACCEPT;

/**
 * Drag-and-drop image input.
 *
 * Validation here is a convenience layer for immediate feedback. The server
 * independently enforces file type and size, and verifies the actual image
 * bytes before anything is stored.
 *
 * Selected files are downscaled in the browser first (see lib/image.js) so a
 * 6 MB screenshot goes up as a fraction of that. The size check runs against
 * the original file, which is the one the operator actually chose.
 */
export default function ImageUploader({
  value,
  onChange,
  gallery = [],
  onGalleryChange,
  maxGallery = 8,
  label = 'PROJECT IMAGE',
  hint = 'Main thumbnail shown on the project card and detail page.',
  dropTitle = 'Drop your project image here',
  dropHint = 'or click to upload · PNG, JPG, JPEG, WEBP — up to 8 MB',
  invalid = false,
}) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  const uploadOne = async (file) => {
    if (!file) return;
    if (!ACCEPT.includes(file.type)) {
      toast.error('Invalid file type', `${file.name} is not a JPG, PNG or WEBP image.`);
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('File too large', `${file.name} exceeds the 8 MB limit.`);
      return;
    }

    setBusy(true);
    try {
      const result = await api.admin.uploadImage(await compressImage(file));
      onChange(result.url);
      toast.success('Image uploaded');
    } catch (error) {
      toast.fromError(error, 'Upload failed. Please try again.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const uploadMany = async (files) => {
    const list = Array.from(files ?? []);
    if (list.length === 0) return;

    const invalidFile = list.find((file) => !ACCEPT.includes(file.type));
    if (invalidFile) {
      toast.error('Invalid file type', `${invalidFile.name} is not a JPG, PNG or WEBP image.`);
      return;
    }
    const oversized = list.find((file) => file.size > MAX_BYTES);
    if (oversized) {
      toast.error('File too large', `${oversized.name} exceeds the 8 MB limit.`);
      return;
    }
    if (gallery.length + list.length > maxGallery) {
      toast.error('Gallery full', `You can attach up to ${maxGallery} images.`);
      return;
    }

    setBusy(true);
    try {
      const shrunk = await Promise.all(list.map(compressImage));
      const result = await api.admin.uploadGallery(shrunk);
      onGalleryChange([...gallery, ...result.urls]);
      toast.success(`${result.urls.length} image(s) uploaded`);
    } catch (error) {
      toast.fromError(error, 'Upload failed. Please try again.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="field">
      <span className="field-label">{label}</span>

      <div
        className={`dropzone ${over ? 'is-over' : ''} ${busy ? 'is-busy' : ''}`}
        style={invalid ? { borderColor: 'rgba(248,113,113,0.6)' } : undefined}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          uploadOne(event.dataTransfer.files?.[0]);
        }}
      >
        <div className="dropzone-icon" aria-hidden="true">
          {busy ? '⏳' : '⬆'}
        </div>
        <div className="dropzone-title">
          {busy ? 'Uploading…' : dropTitle}
        </div>
        <div className="dropzone-hint">{dropHint}</div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={(event) => uploadOne(event.target.files?.[0])}
        />
      </div>

      {value ? (
        <div className="preview-frame">
          <img src={value} alt="Selected project thumbnail preview" />
          <div className="preview-frame-actions">
            <button
              type="button"
              className="btn btn-quiet btn-sm"
              onClick={(event) => {
                event.stopPropagation();
                inputRef.current?.click();
              }}
            >
              Replace image
            </button>
            <button
              type="button"
              className="btn btn-quiet btn-sm"
              onClick={(event) => {
                event.stopPropagation();
                onChange('');
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ) : null}

      {onGalleryChange ? (
        <>
          <span className="field-label" style={{ marginTop: '0.9rem' }}>
            ADDITIONAL SCREENSHOTS
          </span>

          <div
            className={`dropzone ${over ? 'is-over' : ''} ${busy ? 'is-busy' : ''}`}
            style={{ minHeight: 92 }}
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              const picker = event.currentTarget.querySelector('input[type=file]');
              picker?.click();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.click();
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setOver(false);
              uploadMany(event.dataTransfer.files);
            }}
          >
            <div className="dropzone-hint">
              Optional gallery — select up to {maxGallery} images
            </div>
            <input
              type="file"
              accept={ACCEPT}
              multiple
              onChange={(event) => uploadMany(event.target.files)}
            />
          </div>

          {gallery.length > 0 ? (
            <div className="thumb-grid">
              {gallery.map((url) => (
                <div className="thumb" key={url}>
                  <img src={url} alt="" loading="lazy" />
                  <button
                    type="button"
                    onClick={() => onGalleryChange(gallery.filter((item) => item !== url))}
                    aria-label="Remove image from gallery"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      {hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}