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
  limit,
  increment,
  Firestore,
  runTransaction,
} from 'firebase/firestore';
import { ForumCategory, ForumThread, ForumPost } from '../models/forum.model';
import { Firebase } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class Forum {
  private db: Firestore | null;

  constructor(private firebase: Firebase) {
    this.db = this.firebase.getFirestore();
  }

  getCategories(): Observable<ForumCategory[]> {
    if (!this.db) return of([]);
    const q = query(collection(this.db, 'forumCategories'), orderBy('name'));
    return from(getDocs(q)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ForumCategory),
      ),
    );
  }

  async createCategory(
    category: Omit<ForumCategory, 'id'>,
  ): Promise<string> {
    if (!this.db) throw new Error('Firestore is not configured');
    const ref = await addDoc(collection(this.db, 'forumCategories'), category);
    return ref.id;
  }

  async updateCategory(
    id: string,
    data: Partial<ForumCategory>,
  ): Promise<void> {
    if (!this.db) throw new Error('Firestore is not configured');
    await updateDoc(doc(this.db, 'forumCategories', id), data);
  }

  async deleteCategory(id: string): Promise<void> {
    if (!this.db) throw new Error('Firestore is not configured');
    await deleteDoc(doc(this.db, 'forumCategories', id));
  }

  getThreads(categoryId: string): Observable<ForumThread[]> {
    if (!this.db) return of([]);
    const q = query(
      collection(this.db, 'forumThreads'),
      where('categoryId', '==', categoryId),
      orderBy('lastReplyAt', 'desc'),
    );
    return from(getDocs(q)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ForumThread),
      ),
    );
  }

  getAllThreads(): Observable<ForumThread[]> {
    if (!this.db) return of([]);
    const q = query(
      collection(this.db, 'forumThreads'),
      orderBy('lastReplyAt', 'desc'),
    );
    return from(getDocs(q)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ForumThread),
      ),
    );
  }

  getThread(threadId: string): Observable<ForumThread | undefined> {
    if (!this.db) return of(undefined);
    return from(getDoc(doc(this.db, 'forumThreads', threadId))).pipe(
      map((snap) =>
        snap.exists()
          ? ({ id: snap.id, ...snap.data() } as ForumThread)
          : undefined,
      ),
    );
  }

  getThreadBySlug(slug: string): Observable<ForumThread | undefined> {
    if (!this.db) return of(undefined);
    const q = query(
      collection(this.db, 'forumThreads'),
      where('slug', '==', slug),
      limit(1),
    );
    return from(getDocs(q)).pipe(
      map((snap) => {
        if (snap.empty) return undefined;
        const d = snap.docs[0];
        return { id: d.id, ...d.data() } as ForumThread;
      }),
    );
  }

  async updateThread(id: string, data: Partial<ForumThread>): Promise<void> {
    if (!this.db) throw new Error('Firestore is not configured');
    await updateDoc(doc(this.db, 'forumThreads', id), data);
  }

  async createThread(    thread: Omit<ForumThread, 'id'>,
  ): Promise<string> {
    if (!this.db) throw new Error('Firestore is not configured');
    const db = this.db;
    const threadRef = doc(collection(db, 'forumThreads'));
    const categoryRef = doc(db, 'forumCategories', thread.categoryId);
    await runTransaction(db, async (tx) => {
      tx.set(threadRef, thread);
      tx.update(categoryRef, { threadCount: increment(1) });
    });
    return threadRef.id;
  }

  async deleteThread(id: string, categoryId: string): Promise<void> {
    if (!this.db) throw new Error('Firestore is not configured');
    const db = this.db;
    const threadRef = doc(db, 'forumThreads', id);
    const categoryRef = doc(db, 'forumCategories', categoryId);
    await runTransaction(db, async (tx) => {
      tx.delete(threadRef);
      tx.update(categoryRef, { threadCount: increment(-1) });
    });
  }

  getPosts(threadId: string): Observable<ForumPost[]> {
    if (!this.db) return of([]);
    const q = query(
      collection(this.db, 'forumPosts'),
      where('threadId', '==', threadId),
      orderBy('createdAt', 'asc'),
    );
    return from(getDocs(q)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ForumPost),
      ),
    );
  }

  getAllPosts(): Observable<ForumPost[]> {
    if (!this.db) return of([]);
    const q = query(
      collection(this.db, 'forumPosts'),
      orderBy('createdAt', 'desc'),
    );
    return from(getDocs(q)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ForumPost),
      ),
    );
  }

  async createPost(post: Omit<ForumPost, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Firestore is not configured');
    const db = this.db;
    const postRef = doc(collection(db, 'forumPosts'));
    const threadRef = doc(db, 'forumThreads', post.threadId);
    await runTransaction(db, async (tx) => {
      tx.set(postRef, post);
      tx.update(threadRef, {
        replyCount: increment(1),
        lastReplyAt: post.createdAt,
      });
    });
    return postRef.id;
  }

  async deletePost(id: string, threadId: string): Promise<void> {
    if (!this.db) throw new Error('Firestore is not configured');
    const db = this.db;
    const postRef = doc(db, 'forumPosts', id);
    const threadRef = doc(db, 'forumThreads', threadId);
    await runTransaction(db, async (tx) => {
      tx.delete(postRef);
      tx.update(threadRef, { replyCount: increment(-1) });
    });
  }
}
