/**
 * ProfilePictureUpload Component
 * 
 * Handles profile picture upload, preview, and deletion with client-side validation.
 * 
 * Features:
 * - File type validation (PNG, JPG, GIF only)
 * - Size validation (max 5MB)
 * - Real-time preview before upload
 * - Upload progress indication
 * - Delete with confirmation
 * - Error handling and user feedback
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string|null} props.currentPicture - Current profile picture URL from server
 * @param {Function} props.onUploadSuccess - Callback when upload/delete succeeds
 *                                            Called with new URL or null on delete
 * 
 * @example
 * <ProfilePictureUpload 
 *   currentPicture={user.profile_picture}
 *   onUploadSuccess={(url) => updateUserProfile(url)}
 * />
 */
import React, { useState } from 'react';
import api from '../../services/api';

const ProfilePictureUpload = ({ currentPicture, onUploadSuccess }) => {
  // State: uploading - boolean flag for loading/disabled states during API calls
  const [uploading, setUploading] = useState(false);
  
  // State: previewUrl - Local preview of selected image before/after upload
  const [previewUrl, setPreviewUrl] = useState(currentPicture);
  
  // State: error - Error message to display to user (validation or server errors)
  const [error, setError] = useState('');

  /**
   * Handle file selection and upload
   * 
   * Process:
   * 1. Validate file type (only images)
   * 2. Validate file size (< 5MB to prevent server overload)
   * 3. Generate local preview using FileReader API
   * 4. Upload to server via multipart/form-data
   * 5. Update parent component on success
   * 
   * @param {Event} event - File input change event
   */
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // === Client-side validation ===
    // Prevents unnecessary server requests and improves UX with instant feedback
    
    // Validate file type - only allow common image formats
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (PNG, JPG, or GIF)');
      return;
    }

    // Validate file size - 5MB limit prevents:
    // - Server resource exhaustion
    // - Slow page loads from large images
    // - Excessive storage costs
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError('File size must be less than 5MB');
      return;
    }

    // Show preview using FileReader API
    // Provides instant visual feedback before upload completes
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);  // Base64 data URL for preview
    };
    reader.readAsDataURL(file);

    // Upload file to server
    setUploading(true);  // Disable buttons during upload
    setError('');  // Clear previous errors

    try {
      // Use FormData for multipart/form-data encoding (required for file uploads)
      const formData = new FormData();
      formData.append('file', file);

      // POST to upload endpoint with multipart content type
      const response = await api.post('/uploads/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Notify parent component of successful upload
      if (response.data.success) {
        if (onUploadSuccess) {
          onUploadSuccess(response.data.file_url);
        }
      }
    } catch (err) {
      // Display server error or fallback message
      setError(err.response?.data?.error || 'Failed to upload profile picture');
      setPreviewUrl(currentPicture); // Revert preview on failure
    } finally {
      setUploading(false);  // Re-enable UI
    }
  };

  /**
   * Handle profile picture deletion
   * 
   * Shows confirmation dialog to prevent accidental deletion,
   * then sends DELETE request to server and updates UI.
   */
  const handleDelete = async () => {
    // Confirmation dialog prevents accidental deletion
    if (!window.confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    setUploading(true);
    setError('');

    try {
      // DELETE request removes file from server and database
      await api.delete('/uploads/profile-picture');
      
      // Update local preview and parent component
      setPreviewUrl(null);
      if (onUploadSuccess) {
        onUploadSuccess(null);  // null indicates no picture
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
