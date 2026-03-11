import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfilePictureUpload from './ProfilePictureUpload';
import api from '../../services/api';

// Mock the api module
jest.mock('../../services/api');

describe('ProfilePictureUpload Component', () => {
  const mockOnUploadSuccess = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders upload component', () => {
    render(<ProfilePictureUpload currentPicture={null} onUploadSuccess={mockOnUploadSuccess} />);
    expect(screen.getByText(/upload photo/i)).toBeInTheDocument();
  });

  test('displays current profile picture when provided', () => {
    const pictureUrl = 'http://example.com/picture.jpg';
    render(<ProfilePictureUpload currentPicture={pictureUrl} onUploadSuccess={mockOnUploadSuccess} />);
    
    const img = screen.getByRole('img', { name: /profile/i });
    expect(img).toHaveAttribute('src', pictureUrl);
  });

  test('shows error for invalid file type', async () => {
    render(<ProfilePictureUpload currentPicture={null} onUploadSuccess={mockOnUploadSuccess} />);
    
    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
    const input = document.querySelector('#profile-picture-input');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/valid image file/i)).toBeInTheDocument();
    });
  });

  test('shows error for file size exceeding limit', async () => {
    render(<ProfilePictureUpload currentPicture={null} onUploadSuccess={mockOnUploadSuccess} />);
    
    // Create a file larger than 5MB
    const largeFile = new File(['a'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('#profile-picture-input');
    
    fireEvent.change(input, { target: { files: [largeFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/less than 5MB/i)).toBeInTheDocument();
    });
  });

  test('uploads valid image successfully', async () => {
    const mockResponse = {
      data: {
        success: true,
        file_url: 'http://example.com/uploaded.jpg'
      }
    };
    api.post.mockResolvedValue(mockResponse);
    
    render(<ProfilePictureUpload currentPicture={null} onUploadSuccess={mockOnUploadSuccess} />);
    
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('#profile-picture-input');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/uploads/profile-picture',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      );
      expect(mockOnUploadSuccess).toHaveBeenCalledWith('http://example.com/uploaded.jpg');
    });
  });

  test('handles upload failure', async () => {
    const mockError = {
      response: {
        data: {
          error: 'Upload failed'
        }
      }
    };
    api.post.mockRejectedValue(mockError);
    
    render(<ProfilePictureUpload currentPicture={null} onUploadSuccess={mockOnUploadSuccess} />);
    
    const file = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('#profile-picture-input');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
    });
  });

  test('deletes profile picture with confirmation', async () => {
    window.confirm = jest.fn(() => true);
    api.delete.mockResolvedValue({ data: { success: true } });
    
    render(<ProfilePictureUpload currentPicture="http://example.com/pic.jpg" onUploadSuccess={mockOnUploadSuccess} />);
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/uploads/profile-picture');
      expect(mockOnUploadSuccess).toHaveBeenCalledWith(null);
    });
  });

  test('cancels delete when user dismisses confirmation', async () => {
    window.confirm = jest.fn(() => false);
    
    render(<ProfilePictureUpload currentPicture="http://example.com/pic.jpg" onUploadSuccess={mockOnUploadSuccess} />);
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    expect(api.delete).not.toHaveBeenCalled();
  });
});
