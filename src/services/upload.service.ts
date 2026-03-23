import { apiRequestJson } from './api';

export interface UploadPhotoResponse {
  url: string;
}

export const uploadService = {
  async uploadPhoto(file: File): Promise<UploadPhotoResponse> {
    const formData = new FormData();
    formData.append('photo', file);

    const res = await fetch('/api/upload-photo', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }

    return res.json();
  },
};

