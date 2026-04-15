import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore as getFs, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Firebase {
  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;
  private authInstance: Auth | null = null;
  private storageInstance: FirebaseStorage | null = null;

  constructor() {
    if (this.isConfigured()) {
      this.app = initializeApp(environment.firebase);
      this.db = getFs(this.app);
      this.authInstance = getAuth(this.app);
      this.storageInstance = getStorage(this.app);
    }
  }

  isConfigured(): boolean {
    return !!environment.firebase.apiKey;
  }

  getFirestore(): Firestore | null {
    return this.db;
  }

  getAuth(): Auth | null {
    return this.authInstance;
  }

  getStorage(): FirebaseStorage | null {
    return this.storageInstance;
  }
}
