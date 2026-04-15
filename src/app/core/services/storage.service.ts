import { Injectable } from '@angular/core';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  FirebaseStorage,
  UploadMetadata,
} from 'firebase/storage';
import { Firebase } from './firebase.service';

export interface UploadResult {
  path: string;
  downloadUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private storage: FirebaseStorage | null;

  constructor(private firebase: Firebase) {
    this.storage = this.firebase.getStorage();
  }

  async uploadFile(
    file: File | Blob,
    path: string,
    metadata?: UploadMetadata,
  ): Promise<UploadResult> {
    if (!this.storage) {
      throw new Error('Firebase Storage is not configured');
    }
    const storageRef = ref(this.storage, path);
    await uploadBytes(storageRef, file, metadata);
    const downloadUrl = await getDownloadURL(storageRef);
    return { path, downloadUrl };
  }

  async getFileUrl(path: string): Promise<string> {
    if (!this.storage) {
      throw new Error('Firebase Storage is not configured');
    }
    return getDownloadURL(ref(this.storage, path));
  }

  async deleteFile(path: string): Promise<void> {
    if (!this.storage) {
      throw new Error('Firebase Storage is not configured');
    }
    await deleteObject(ref(this.storage, path));
  }
}
