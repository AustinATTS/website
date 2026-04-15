import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Forum } from '../../../core/services/forum.service';
import { AuthService } from '../../../core/services/auth.service';
import { ForumCategory, ForumThread } from '../../../core/models/forum.model';
import { slugify } from '../../../shared/utils/slugify';

@Component({
  selector: 'app-forum-management',
  imports: [ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './forum-management.html',
  styleUrl: './forum-management.scss',
})
export class ForumManagement implements OnInit {
  private forumService = inject(Forum);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  categories = signal<ForumCategory[]>([]);
  threads = signal<ForumThread[]>([]);

  showCategoryForm = signal(false);
  editingCategory = signal<ForumCategory | null>(null);
  savingCategory = signal(false);
  categoryError = signal<string | null>(null);

  categoryForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    icon: ['', Validators.required],
  });

  showThreadForm = signal(false);
  savingThread = signal(false);
  threadError = signal<string | null>(null);

  threadForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    categoryId: ['', Validators.required],
    content: ['', Validators.required],
  });

  ngOnInit() {
    this.loadCategories();
    this.loadThreads();
  }

  private loadCategories() {
    this.forumService.getCategories().subscribe(cats => this.categories.set(cats));
  }

  private loadThreads() {
    this.forumService.getAllThreads().subscribe(threads => this.threads.set(threads));
  }

  getCategoryName(categoryId: string): string {
    return this.categories().find(c => c.id === categoryId)?.name ?? categoryId;
  }

  openNewCategoryForm() {
    this.editingCategory.set(null);
    this.categoryForm.reset({ name: '', description: '', icon: '' });
    this.categoryError.set(null);
    this.showCategoryForm.set(true);
  }

  openEditCategoryForm(category: ForumCategory) {
    this.editingCategory.set(category);
    this.categoryForm.patchValue({ name: category.name, description: category.description, icon: category.icon });
    this.categoryError.set(null);
    this.showCategoryForm.set(true);
  }

  cancelCategoryForm() {
    this.showCategoryForm.set(false);
    this.editingCategory.set(null);
    this.categoryForm.reset();
  }

  async saveCategory() {
    if (this.categoryForm.invalid) { this.categoryForm.markAllAsTouched(); return; }
    this.savingCategory.set(true);
    this.categoryError.set(null);
    const v = this.categoryForm.value;
    try {
      const editing = this.editingCategory();
      if (editing) {
        await this.forumService.updateCategory(editing.id, { name: v.name, description: v.description, icon: v.icon });
      } else {
        await this.forumService.createCategory({ name: v.name, description: v.description, icon: v.icon, threadCount: 0 });
      }
      this.cancelCategoryForm();
      this.loadCategories();
    } catch {
      this.categoryError.set('Failed to save category. Please try again.');
    } finally {
      this.savingCategory.set(false);
    }
  }

  async deleteCategory(id: string) {
    try {
      await this.forumService.deleteCategory(id);
      this.categories.update(cats => cats.filter(c => c.id !== id));
    } catch {
      this.categoryError.set('Failed to delete category.');
    }
  }

  openNewThreadForm() {
    this.threadForm.reset({ title: '', categoryId: '', content: '' });
    this.threadError.set(null);
    this.showThreadForm.set(true);
  }

  cancelThreadForm() {
    this.showThreadForm.set(false);
    this.threadForm.reset();
  }

  async saveThread() {
    if (this.threadForm.invalid) { this.threadForm.markAllAsTouched(); return; }
    const user = this.authService.currentUser();
    if (!user) { this.threadError.set('You must be logged in.'); return; }
    this.savingThread.set(true);
    this.threadError.set(null);
    const v = this.threadForm.value;
    const now = new Date().toISOString();
    const slug = slugify(v.title);
    try {
      const threadId = await this.forumService.createThread({
        title: v.title, slug, categoryId: v.categoryId, author: user.displayName, authorUid: user.uid,
        createdAt: now, lastReplyAt: now, replyCount: 0, pinned: false,
      });
      await this.forumService.createPost({ threadId, author: user.displayName, authorUid: user.uid, content: v.content, createdAt: now });
      this.cancelThreadForm();
      this.loadThreads();
      this.loadCategories();
    } catch {
      this.threadError.set('Failed to create thread. Please try again.');
    } finally {
      this.savingThread.set(false);
    }
  }

  async togglePin(thread: ForumThread) {
    try {
      await this.forumService.updateThread(thread.id, { pinned: !thread.pinned });
      this.threads.update(threads => threads.map(t => t.id === thread.id ? { ...t, pinned: !t.pinned } : t));
    } catch {
      this.threadError.set('Failed to update pin status.');
    }
  }

  async deleteThread(id: string) {
    const thread = this.threads().find(t => t.id === id);
    if (!thread) return;
    try {
      await this.forumService.deleteThread(id, thread.categoryId);
      this.threads.update(threads => threads.filter(t => t.id !== id));
      this.loadCategories();
    } catch {
      this.threadError.set('Failed to delete thread.');
    }
  }
}
