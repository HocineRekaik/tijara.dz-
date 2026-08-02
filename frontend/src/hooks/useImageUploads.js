import { useCallback, useState } from 'react';
import { readFileAsDataUrl, uploadImageFile } from '../utils/imageUpload';

const useImageUploads = ({ existingMainUrl = '', existingGalleryUrls = [] }) => {
  const [mainFile, setMainFile] = useState(null);
  const [mainPreview, setMainPreview] = useState('');
  const [mainUrl, setMainUrl] = useState(existingMainUrl || '');
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [galleryUrls, setGalleryUrls] = useState(Array.isArray(existingGalleryUrls) ? existingGalleryUrls : []);
  const [uploading, setUploading] = useState(false);

  const reset = useCallback((nextMainUrl = '', nextGalleryUrls = []) => {
    setMainFile(null);
    setMainPreview('');
    setMainUrl(nextMainUrl || '');
    setGalleryFiles([]);
    setGalleryPreviews([]);
    setGalleryUrls(Array.isArray(nextGalleryUrls) ? nextGalleryUrls : []);
  }, []);

  const handleMainSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setMainFile(file);
    readFileAsDataUrl(file)
      .then(setMainPreview)
      .catch(() => setMainPreview(''));
    event.target.value = '';
  };

  const handleMainRemove = () => {
    setMainFile(null);
    setMainPreview('');
    setMainUrl('');
  };

  const handleGallerySelect = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      return;
    }
    setGalleryFiles((prev) => [...prev, ...files]);
    Promise.all(files.map(readFileAsDataUrl))
      .then((results) => setGalleryPreviews((prev) => [...prev, ...results]))
      .catch(() => {});
    event.target.value = '';
  };

  const handleGalleryRemove = (index) => {
    setGalleryUrls((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handlePendingRemove = (index) => {
    setGalleryFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setGalleryPreviews((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const uploadPending = async () => {
    let finalMainUrl = mainUrl;
    let finalGalleryUrls = [...galleryUrls];

    if (mainFile) {
      setUploading(true);
      try {
        finalMainUrl = await uploadImageFile(mainFile);
      } finally {
        setUploading(false);
      }
    }

    if (galleryFiles.length > 0) {
      setUploading(true);
      try {
        const uploadedUrls = await Promise.all(galleryFiles.map(uploadImageFile));
        finalGalleryUrls = [...finalGalleryUrls, ...uploadedUrls];
      } finally {
        setUploading(false);
      }
    }

    return { mainUrl: finalMainUrl, galleryUrls: finalGalleryUrls };
  };

  return {
    mainFile,
    mainPreview,
    mainUrl,
    galleryFiles,
    galleryPreviews,
    galleryUrls,
    uploading,
    reset,
    handleMainSelect,
    handleMainRemove,
    handleGallerySelect,
    handleGalleryRemove,
    handlePendingRemove,
    uploadPending,
  };
};

export default useImageUploads;
