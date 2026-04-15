import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Forum as ForumService } from '../../core/services/forum.service';
import { AuthService } from '../../core/services/auth.service';
import { ForumCategory, ForumThread } from '../../core/models/forum.model';
import { slugify } from '../../shared/utils/slugify';

@Component({
  selector: 'app-forum',
  imports: [
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, ReactiveFormsModule,
    RouterLink, DatePipe,
  ],
  templateUrl: './forum.html',
  styleUrl: './forum.scss',
})
export class Forum implements OnInit {
  private forumService = inject(ForumService);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  categories = signal<ForumCategory[]>([]);
  selectedCategory = signal<ForumCategory | null>(null);
  threads = signal<ForumThread[]>([]);

  showThreadForm = signal(false);
  savingThread = signal(false);
  threadError = signal<string | null>(null);

  threadForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    content: ['', Validators.required],
  });

  ngOnInit() {
    this.forumService.getCategories().subscribe(cats => this.categories.set(cats));
  }

  selectCategory(category: ForumCategory) {
    this.selectedCategory.set(category);
    this.forumService.getThreads(category.id).subscribe(threads => {
      const sorted = [...threads].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.lastReplyAt).getTime() - new Date(a.lastReplyAt).getTime();
      });
      this.threads.set(sorted);
    });
  }

  openNewThreadForm() {
    this.threadForm.reset({ title: '', content: '' });
    this.threadError.set(null);
    this.showThreadForm.set(true);
  }

  cancelThreadForm() {
    this.showThreadForm.set(false);
    this.threadForm.reset();
  }

  async saveThread() {
    if (this.threadForm.invalid) { this.threadForm.markAllAsTouched(); return; }
    const user = this.auth.currentUser();
    if (!user) { this.threadError.set('You must be signed in to create a thread.'); return; }
    const cat = this.selectedCategory();
    if (!cat) { this.threadError.set('Select a category first.'); return; }
    this.savingThread.set(true);
    this.threadError.set(null);
    const v = this.threadForm.value;
    const slug = slugify(v.title);
    const now = new Date().toISOString();
    try {
      const threadId = await this.forumService.createThread({
        title: v.title,
        slug,
        categoryId: cat.id,
        author: user.displayName,
        authorUid: user.uid,
        createdAt: now,
        lastReplyAt: now,
        replyCount: 0,
        pinned: false,
      });
      await this.forumService.createPost({
        threadId,
        author: user.displayName,
        authorUid: user.uid,
        content: v.content,
        createdAt: now,
      });
      this.cancelThreadForm();
      this.selectCategory(cat); // reload threads
    } catch {
      this.threadError.set('Failed to create thread. Please try again.');
    } finally {
      this.savingThread.set(false);
    }
  }
}
