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
import { BlogPost, BlogComment } from '../models/blog.model';
import { Firebase } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class Blog {
  private db: Firestore | null;

  constructor(private firebase: Firebase) {
    this.db = this.firebase.getFirestore();
  }

  getPosts(): Observable<BlogPost[]> {
    if (!this.db) return of([]);
    const q = query(collection(this.db, 'blogs'), orderBy('date', 'desc'));
    return from(getDocs(q)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BlogPost),
      ),
    );
  }

  getPost(slug: string): Observable<BlogPost | undefined> {
    if (!this.db) return of(undefined);
    const q = query(collection(this.db, 'blogs'), where('slug', '==', slug));
    return from(getDocs(q)).pipe(
      map((snap) => {
        if (snap.empty) return undefined;
        const d = snap.docs[0];
        return { id: d.id, ...d.data() } as BlogPost;
      }),
    );
  }

  getPostsByTag(tag: string): Observable<BlogPost[]> {
    if (!this.db) return of([]);
    const q = query(
      collection(this.db, 'blogs'),
      where('tags', 'array-contains', tag),
      orderBy('date', 'desc'),
    );
    return from(getDocs(q)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BlogPost),
      ),
    );
  }

  async createPost(
    post: Omit<BlogPost, 'id'>,
  ): Promise<string> {
    if (!this.db) throw new Error('Firestore is not configured');
    const ref = await addDoc(collection(this.db, 'blogs'), post);
    return ref.id;
  }

  async updatePost(
    id: string,
    data: Partial<BlogPost>,
  ): Promise<void> {
    if (!this.db) throw new Error('Firestore is not configured');
    await updateDoc(doc(this.db, 'blogs', id), data);
  }

  async deletePost(id: string): Promise<void> {
    if (!this.db) throw new Error('Firestore is not configured');
    await deleteDoc(doc(this.db, 'blogs', id));
  }

  getComments(postId: string): Observable<BlogComment[]> {
    if (!this.db) return of([]);
    const q = query(
      collection(this.db, 'blogs', postId, 'comments'),
      orderBy('createdAt', 'asc'),
    );
    return from(getDocs(q)).pipe(
      map((snap) =>
        snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as BlogComment,
        ),
      ),
    );
  }

  async addComment(
    postId: string,
    comment: Omit<BlogComment, 'id'>,
  ): Promise<string> {
    if (!this.db) throw new Error('Firestore is not configured');
    const ref = await addDoc(
      collection(this.db, 'blogs', postId, 'comments'),
      comment,
    );
    return ref.id;
  }

  async deleteComment(postId: string, commentId: string): Promise<void> {
    if (!this.db) throw new Error('Firestore is not configured');
    await deleteDoc(doc(this.db, 'blogs', postId, 'comments', commentId));
  }
}
