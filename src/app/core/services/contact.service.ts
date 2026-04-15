import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Firestore,
} from 'firebase/firestore';
import { ContactMessage } from '../models/contact.model';
import { Firebase } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private db: Firestore | null;

  constructor(private firebase: Firebase) {
    this.db = this.firebase.getFirestore();
  }

  getMessages(): Observable<ContactMessage[]> {
    if (!this.db) return of([]);
    const q = query(collection(this.db, 'contactMessages'), orderBy('createdAt', 'desc'));
    return from(getDocs(q)).pipe(
      map((snap) =>
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ContactMessage),
      ),
    );
  }

  async submitMessage(message: Omit<ContactMessage, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Firestore is not configured');
    const ref = await addDoc(collection(this.db, 'contactMessages'), message);
    return ref.id;
  }

  async markAsRead(id: string): Promise<void> {
    if (!this.db) throw new Error('Firestore is not configured');
    await updateDoc(doc(this.db, 'contactMessages', id), { read: true });
  }

  async deleteMessage(id: string): Promise<void> {
    if (!this.db) throw new Error('Firestore is not configured');
    await deleteDoc(doc(this.db, 'contactMessages', id));
  }
}
