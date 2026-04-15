import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ContactService } from '../../../core/services/contact.service';
import { ContactMessage } from '../../../core/models/contact.model';

@Component({
  selector: 'app-message-management',
  imports: [DatePipe, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './message-management.html',
  styleUrl: './message-management.scss',
})
export class MessageManagement implements OnInit {
  private contactService = inject(ContactService);

  messages = signal<ContactMessage[]>([]);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    this.loadMessages();
  }

  private loadMessages() {
    this.contactService.getMessages().subscribe(messages => this.messages.set(messages));
  }

  async markAsRead(id: string) {
    try {
      await this.contactService.markAsRead(id);
      this.messages.update(msgs => msgs.map(m => (m.id === id ? { ...m, read: true } : m)));
    } catch {
      this.errorMessage.set('Failed to mark message as read.');
    }
  }

  async deleteMessage(id: string) {
    try {
      await this.contactService.deleteMessage(id);
      this.messages.update(msgs => msgs.filter(m => m.id !== id));
    } catch {
      this.errorMessage.set('Failed to delete message.');
    }
  }

  get unreadCount(): number {
    return this.messages().filter(m => !m.read).length;
  }
}
