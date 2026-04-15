import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Firestore,
} from 'firebase/firestore';
import { Project } from '../models/project.model';
import { Firebase } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class Projects {
  private db: Firestore | null;

  constructor(private firebase: Firebase) {
    this.db = this.firebase.getFirestore();
  }

  getProjects(): Observable<Project[]> {
    if (!this.db) return of([]);
    const q = query(collection(this.db, 'projects'), orderBy('createdAt', 'desc'));
    return from(getDocs(q)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Project),
      ),
    );
  }

  getFeaturedProjects(): Observable<Project[]> {
    if (!this.db) return of([]);
    const q = query(
      collection(this.db, 'projects'),
      where('featured', '==', true),
      orderBy('createdAt', 'desc'),
    );
    return from(getDocs(q)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Project),
      ),
    );
  }

  getProject(slug: string): Observable<Project | undefined> {
    if (!this.db) return of(undefined);
    const q = query(collection(this.db, 'projects'), where('slug', '==', slug));
    return from(getDocs(q)).pipe(
      map((snap) => {
        if (snap.empty) return undefined;
        const d = snap.docs[0];
        return { id: d.id, ...d.data() } as Project;
      }),
    );
  }

  async createProject(project: Omit<Project, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Firestore is not configured');
    const ref = await addDoc(collection(this.db, 'projects'), project);
    return ref.id;
  }

  async updateProject(id: string, data: Partial<Project>): Promise<void> {
    if (!this.db) throw new Error('Firestore is not configured');
    await updateDoc(doc(this.db, 'projects', id), data);
  }

  async deleteProject(id: string): Promise<void> {
    if (!this.db) throw new Error('Firestore is not configured');
    await deleteDoc(doc(this.db, 'projects', id));
  }
}
