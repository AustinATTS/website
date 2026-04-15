import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Blog as BlogService } from '../../core/services/blog.service';
import { AuthService } from '../../core/services/auth.service';
import { BlogPost } from '../../core/models/blog.model';
import { BlogCard } from '../../shared/components/blog-card/blog-card';
import { slugify } from '../../shared/utils/slugify';

@Component({
  selector: 'app-blog',
  imports: [
    BlogCard, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
  ],
  templateUrl: './blog.html',
  styleUrl: './blog.scss',
})
export class Blog implements OnInit {
  private blogService = inject(BlogService);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  posts = signal<BlogPost[]>([]);
  selectedTag = signal<string | null>(null);

  showForm = signal(false);
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  postForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    excerpt: ['', Validators.required],
    content: ['', Validators.required],
    tags: [''],
    imageUrl: [''],
  });

  allTags = computed(() => {
    const tags = new Set<string>();
    for (const post of this.posts()) {
      for (const tag of post.tags) {
        tags.add(tag);
      }
    }
    return [...tags].sort();
  });

  filteredPosts = computed(() => {
    const tag = this.selectedTag();
    if (!tag) return this.posts();
    return this.posts().filter(p => p.tags.includes(tag));
  });

  ngOnInit() {
    this.blogService.getPosts().subscribe(posts => this.posts.set(posts));
  }

  selectTag(tag: string | null) {
    this.selectedTag.set(this.selectedTag() === tag ? null : tag);
  }

  openNewForm() {
    this.postForm.reset({ title: '', excerpt: '', content: '', tags: '', imageUrl: '' });
    this.errorMessage.set(null);
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.postForm.reset();
  }

  async savePost() {
    if (this.postForm.invalid) { this.postForm.markAllAsTouched(); return; }
    const user = this.auth.currentUser();
    if (!user || user.role !== 'admin') { this.errorMessage.set('Only admins can create posts.'); return; }
    this.saving.set(true);
    this.errorMessage.set(null);
    const v = this.postForm.value;
    const slug = slugify(v.title);
    const tags = v.tags ? v.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0) : [];
    try {
      await this.blogService.createPost({
        title: v.title, slug, excerpt: v.excerpt, content: v.content,
        author: user.displayName, authorUid: user.uid,
        date: new Date().toISOString(), tags, imageUrl: v.imageUrl || undefined,
      });
      this.cancelForm();
      this.blogService.getPosts().subscribe(posts => this.posts.set(posts));
    } catch {
      this.errorMessage.set('Failed to create post. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }
}
