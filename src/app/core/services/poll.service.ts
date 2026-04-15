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
import { Poll, PollVote } from '../models/poll.model';
import { Firebase } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class PollService {
  private db: Firestore | null;

  constructor(private firebase: Firebase) {
    this.db = this.firebase.getFirestore();
  }

  getPolls(): Observable<Poll[]> {
    if (!this.db) return of([]);
    const q = query(
      collection(this.db, 'polls'),
      orderBy('createdAt', 'desc'),
    );
    return from(getDocs(q)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Poll),
      ),
    );
  }

  getPoll(pollId: string): Observable<Poll | undefined> {
    if (!this.db) return of(undefined);
    return from(getDoc(doc(this.db, 'polls', pollId))).pipe(
      map((snap) =>
        snap.exists()
          ? ({ id: snap.id, ...snap.data() } as Poll)
          : undefined,
      ),
    );
  }

  async createPoll(poll: Omit<Poll, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Firestore is not configured');
    const ref = await addDoc(collection(this.db, 'polls'), poll);
    return ref.id;
  }

  async updatePoll(id: string, data: Partial<Poll>): Promise<void> {
    if (!this.db) throw new Error('Firestore is not configured');
    await updateDoc(doc(this.db, 'polls', id), data);
  }

  async deletePoll(id: string): Promise<void> {
    if (!this.db) throw new Error('Firestore is not configured');
    await deleteDoc(doc(this.db, 'polls', id));
  }

  getVotes(pollId: string): Observable<PollVote[]> {
    if (!this.db) return of([]);
    const q = query(collection(this.db, 'polls', pollId, 'votes'));
    return from(getDocs(q)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PollVote),
      ),
    );
  }

  getUserVote(
    pollId: string,
    userUid: string,
  ): Observable<PollVote | undefined> {
    if (!this.db) return of(undefined);
    const q = query(
      collection(this.db, 'polls', pollId, 'votes'),
      where('userUid', '==', userUid),
    );
    return from(getDocs(q)).pipe(
      map((snap) =>
        snap.empty
          ? undefined
          : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as PollVote),
      ),
    );
  }

  async vote(pollId: string, vote: Omit<PollVote, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Firestore is not configured');
    const ref = await addDoc(
      collection(this.db, 'polls', pollId, 'votes'),
      vote,
    );
    return ref.id;
  }
}
