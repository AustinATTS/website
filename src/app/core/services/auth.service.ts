import { Injectable, signal, computed } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  Firestore,
} from 'firebase/firestore';
import { Firebase } from './firebase.service';
import { User } from '../models/user.model';

const DEFAULT_DISPLAY_NAME = 'User';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth | null;
  private db: Firestore | null;

  currentUser = signal<User | null>(null);
  loading = signal<boolean>(true);
  firebaseUser = signal<FirebaseUser | null>(null);

  isLoggedIn = computed(() => !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === 'admin');
  isAuthenticated = computed(() => !!this.firebaseUser());

  constructor(private firebase: Firebase) {
    this.auth = this.firebase.getAuth();
    this.db = this.firebase.getFirestore();

    if (this.auth) {
      onAuthStateChanged(this.auth, async (firebaseUser) => {
        this.firebaseUser.set(firebaseUser);
        if (firebaseUser && !firebaseUser.isAnonymous) {
          const user = await this.getUserProfile(firebaseUser.uid);
          this.currentUser.set(user);
        } else {
          this.currentUser.set(null);
        }
        this.loading.set(false);
      });
    } else {
      this.loading.set(false);
    }
  }

  async register(
    email: string,
    password: string,
    displayName: string,
  ): Promise<User> {
    if (!this.auth || !this.db) {
      throw new Error('Firebase is not configured');
    }

    const credential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password,
    );
    await updateProfile(credential.user, { displayName });

    const user: User = {
      uid: credential.user.uid,
      email,
      displayName,
      role: 'user',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    await setDoc(doc(this.db, 'users', user.uid), user);
    this.currentUser.set(user);
    return user;
  }

  async login(email: string, password: string): Promise<User> {
    if (!this.auth || !this.db) {
      throw new Error('Firebase is not configured');
    }

    const credential = await signInWithEmailAndPassword(
      this.auth,
      email,
      password,
    );
    const user = await this.getUserProfile(credential.user.uid);

    if (user) {
      await updateDoc(doc(this.db, 'users', user.uid), {
        lastLoginAt: new Date().toISOString(),
      });
      user.lastLoginAt = new Date().toISOString();
      this.currentUser.set(user);
      return user;
    }

    throw new Error('User profile not found');
  }

  async logout(): Promise<void> {
    if (this.auth) {
      await signOut(this.auth);
      this.currentUser.set(null);
    }
  }

  async getUserProfile(uid: string): Promise<User | null> {
    if (!this.db) return null;
    const snap = await getDoc(doc(this.db, 'users', uid));
    return snap.exists() ? (snap.data() as User) : null;
  }

  async listUsers(): Promise<User[]> {
    if (!this.db) return [];
    const snap = await getDocs(collection(this.db, 'users'));
    return snap.docs.map((d) => d.data() as User);
  }

  async setUserRole(uid: string, role: 'user' | 'admin'): Promise<void> {
    if (!this.db) return;
    await updateDoc(doc(this.db, 'users', uid), { role });
  }

  async deleteUserProfile(uid: string): Promise<void> {
    if (!this.db) return;
    await deleteDoc(doc(this.db, 'users', uid));
  }

  async signInWithGoogle(): Promise<User> {
    if (!this.auth || !this.db) {
      throw new Error('Firebase is not configured');
    }
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(this.auth, provider);
    return this.handleOAuthUser(credential);
  }

  async signInWithGithub(): Promise<User> {
    if (!this.auth || !this.db) {
      throw new Error('Firebase is not configured');
    }
    const provider = new GithubAuthProvider();
    const credential = await signInWithPopup(this.auth, provider);
    return this.handleOAuthUser(credential);
  }

  private async handleOAuthUser(credential: UserCredential): Promise<User> {
    const fbUser = credential.user;
    const existing = await this.getUserProfile(fbUser.uid);

    if (existing) {
      await updateDoc(doc(this.db!, 'users', existing.uid), {
        lastLoginAt: new Date().toISOString(),
      });
      existing.lastLoginAt = new Date().toISOString();
      this.currentUser.set(existing);
      return existing;
    }

    const user: User = {
      uid: fbUser.uid,
      email: fbUser.email ?? '',
      displayName: fbUser.displayName ?? DEFAULT_DISPLAY_NAME,
      photoURL: fbUser.photoURL ?? undefined,
      role: 'user',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    await setDoc(doc(this.db!, 'users', user.uid), user);
    this.currentUser.set(user);
    return user;
  }

  async ensureAnonymousUser(): Promise<string> {
    if (!this.auth) throw new Error('Firebase is not configured');
    const existing = this.firebaseUser();
    if (existing) return existing.uid;
    const credential = await signInAnonymously(this.auth);
    return credential.user.uid;
  }
}
