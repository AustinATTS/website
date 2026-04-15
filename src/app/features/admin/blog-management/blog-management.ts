import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Blog } from '../../../core/services/blog.service';
import { BlogPost } from '../../../core/models/blog.model';
import { AuthService } from '../../../core/services/auth.service';
import { slugify } from '../../../shared/utils/slugify';

@Component({
  selector: 'app-blog-management',
  imports: [DatePipe, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './blog-management.html',
  styleUrl: './blog-management.scss',
})
export class BlogManagement implements OnInit {
  private blogService = inject(Blog);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  posts = signal<BlogPost[]>([]);
  showForm = signal(false);
  editingPost = signal<BlogPost | null>(null);
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  postForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    slug: ['', Validators.required],
    excerpt: ['', Validators.required],
    content: ['', Validators.required],
    tags: [''],
    imageUrl: [''],
  });

  ngOnInit() {
    this.loadPosts();
  }

  private loadPosts() {
    this.blogService.getPosts().subscribe(posts => this.posts.set(posts));
  }

  openNewForm() {
    this.editingPost.set(null);
    this.postForm.reset({ title: '', slug: '', excerpt: '', content: '', tags: '', imageUrl: '' });
    this.errorMessage.set(null);
    this.showForm.set(true);
  }

  openEditForm(post: BlogPost) {
    this.editingPost.set(post);
    this.postForm.patchValue({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      tags: post.tags?.join(', ') ?? '',
      imageUrl: post.imageUrl ?? '',
    });
    this.errorMessage.set(null);
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingPost.set(null);
    this.postForm.reset();
  }

  onTitleChange() {
    if (!this.editingPost()) {
      const title: string = this.postForm.get('title')?.value ?? '';
      const slug = slugify(title);
      this.postForm.patchValue({ slug });
    }
  }

  async savePost() {
    if (this.postForm.invalid) { this.postForm.markAllAsTouched(); return; }
    const user = this.authService.currentUser();
    if (!user) { this.errorMessage.set('You must be logged in.'); return; }
    this.saving.set(true);
    this.errorMessage.set(null);
    const v = this.postForm.value;
    const tags = v.tags ? v.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0) : [];
    try {
      const editing = this.editingPost();
      if (editing) {
        await this.blogService.updatePost(editing.id, { title: v.title, slug: v.slug, excerpt: v.excerpt, content: v.content, tags, imageUrl: v.imageUrl || undefined });
      } else {
        await this.blogService.createPost({ title: v.title, slug: v.slug, excerpt: v.excerpt, content: v.content, author: user.displayName, authorUid: user.uid, date: new Date().toISOString(), tags, imageUrl: v.imageUrl || undefined });
      }
      this.cancelForm();
      this.loadPosts();
    } catch {
      this.errorMessage.set('Failed to save post. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  async deletePost(id: string) {
    await this.blogService.deletePost(id);
    this.posts.update(posts => posts.filter(p => p.id !== id));
  }
}
