import React, { useState } from 'react';
import api from '../../services/api';

const ProfilePictureUpload = ({ currentPicture, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentPicture);
  const [error, setError] = useState('');

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (PNG, JPG, or GIF)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/uploads/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        if (onUploadSuccess) {
          onUploadSuccess(response.data.file_url);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload profile picture');
      setPreviewUrl(currentPicture); // Revert to current picture
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    setUploading(true);
    setError('');

    try {
      await api.delete('/uploads/profile-picture');
      setPreviewUrl(null);
      if (onUploadSuccess) {
        onUploadSuccess(null);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete profile picture');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="profile-picture-upload" style={{textAlign: 'center'}}>
      <div style={{
        width: '150px',
        height: '150px',
        borderRadius: '50%',
        overflow: 'hidden',
        margin: '0 auto 20px',
        border: '4px solid #8b5cf6',
        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
        background: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt="Profile" 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div style={{
            fontSize: '48px',
            color: '#9ca3af'
          }}>
            👤
          </div>
        )}
      </div>

      {error && (
        <div style={{
          color: '#ef4444',
          fontSize: '14px',
          marginBottom: '15px',
          padding: '10px',
          background: '#fee2e2',
          borderRadius: '8px',
          border: '2px solid #ef4444'
        }}>
          {error}
        </div>
      )}

      <div style={{display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap'}}>
        <label htmlFor="profile-picture-input" className="btn-primary" style={{
          cursor: uploading ? 'not-allowed' : 'pointer',
          opacity: uploading ? 0.6 : 1,
          margin: 0
        }}>
          {uploading ? '⏳ Uploading...' : '📷 Upload Photo'}
        </label>
        <input
          id="profile-picture-input"
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/gif"
          onChange={handleFileChange}
          disabled={uploading}
          style={{display: 'none'}}
        />

        {previewUrl && (
          <button
            onClick={handleDelete}
            disabled={uploading}
            className="btn-secondary"
            style={{
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.6 : 1
            }}
          >
            🗑️ Remove
          </button>
        )}
      </div>

      <p style={{
        fontSize: '12px',
        color: '#6b7280',
        marginTop: '10px'
      }}>
        Max file size: 5MB | Formats: PNG, JPG, GIF
      </p>
    </div>
  );
};

export default ProfilePictureUpload;
