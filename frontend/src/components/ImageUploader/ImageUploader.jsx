import React from 'react';
import './ImageUploader.css';
import { ImagePlus, Trash2, RefreshCw } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';

export const MainImageField = ({ upload, label }) => {
  const { t } = useI18n();
  const resolvedLabel = label || t('upload.mainImageLabel');
  const hasImage = Boolean(upload.mainPreview || upload.mainUrl);

  return (
    <div className="upload-field">
      <span className="upload-field-label">{resolvedLabel}</span>
      <div className="upload-row">
        {hasImage ? (
          <>
            <div className="upload-preview upload-preview--main">
              <img src={upload.mainPreview || upload.mainUrl} alt={t('upload.mainImageAlt')} />
              <button
                type="button"
                className="upload-preview-remove"
                onClick={upload.handleMainRemove}
                title={t('upload.remove')}
              >
                <Trash2 size={14} />
                {t('upload.removeBtn')}
              </button>
            </div>
            <label className="upload-btn">
              <RefreshCw size={16} />
              {t('upload.replace')}
              <input type="file" accept="image/*" onChange={upload.handleMainSelect} hidden />
            </label>
          </>
        ) : (
          <label className="upload-btn upload-btn--primary">
            <ImagePlus size={17} />
            {t('upload.addMain')}
            <input type="file" accept="image/*" onChange={upload.handleMainSelect} hidden />
          </label>
        )}
      </div>
    </div>
  );
};

export const GalleryImageField = ({ upload, label }) => {
  const { t } = useI18n();
  const resolvedLabel = label || t('upload.galleryLabel');
  const hasImages = upload.galleryUrls.length + upload.galleryPreviews.length > 0;

  return (
    <div className="upload-field">
      <span className="upload-field-label">{resolvedLabel}</span>
      {hasImages && (
        <div className="upload-gallery">
          {upload.galleryUrls.map((url, index) => (
            <div key={`existing-${index}`} className="upload-gallery-item">
              <img src={url} alt={t('upload.galleryAlt', { index: index + 1 })} />
              <button
                type="button"
                className="upload-gallery-remove"
                onClick={() => upload.handleGalleryRemove(index)}
                title={t('upload.remove')}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {upload.galleryPreviews.map((src, index) => (
            <div key={`pending-${index}`} className="upload-gallery-item">
              <img src={src} alt={t('upload.newImageAlt', { index: index + 1 })} />
              <button
                type="button"
                className="upload-gallery-remove"
                onClick={() => upload.handlePendingRemove(index)}
                title={t('upload.remove')}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
      <label className="upload-btn">
        <ImagePlus size={16} />
        {t('upload.addFromDevice')}
        <input type="file" accept="image/*" multiple onChange={upload.handleGallerySelect} hidden />
      </label>
    </div>
  );
};
