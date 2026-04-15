import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DatePipe } from '@angular/common';
import { Blog } from '../../core/services/blog.service';
import { AuthService } from '../../core/services/auth.service';
import { BlogPost as BlogPostModel, BlogComment } from '../../core/models/blog.model';

@Component({
  selector: 'app-blog-post',
  imports: [
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, ReactiveFormsModule,
    RouterLink, DatePipe,
  ],
  templateUrl: './blog-post.html',
  styleUrl: './blog-post.scss',
})
export class BlogPost implements OnInit {
  private route = inject(ActivatedRoute);
  private blogService = inject(Blog);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  post = signal<BlogPostModel | undefined>(undefined);
  comments = signal<BlogComment[]>([]);
  submittingComment = signal(false);
  commentError = signal<string | null>(null);

  commentForm: FormGroup = this.fb.group({
    content: ['', Validators.required],
    displayName: [''],
  });

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.blogService.getPost(slug).subscribe(post => {
        this.post.set(post);
        if (post) {
          this.blogService.getComments(post.id).subscribe(c => this.comments.set(c));
        }
      });
    }
  }

  async submitComment() {
    if (this.commentForm.invalid) { this.commentForm.markAllAsTouched(); return; }
    const p = this.post();
    if (!p) return;
    this.submittingComment.set(true);
    this.commentError.set(null);
    try {
      const uid = await this.auth.ensureAnonymousUser();
      const user = this.auth.currentUser();
      const displayName = user?.displayName
        || this.commentForm.value.displayName?.trim()
        || 'Anonymous';
      await this.blogService.addComment(p.id, {
        postId: p.id,
        author: displayName,
        authorUid: uid,
        content: this.commentForm.value.content,
        createdAt: new Date().toISOString(),
      });
      this.commentForm.reset({ content: '', displayName: '' });
      // Reload comments
      this.blogService.getComments(p.id).subscribe(c => this.comments.set(c));
    } catch (e) {
      console.error('Failed to post comment:', e);
      this.commentError.set(
        'Failed to post comment. If you are not logged in, make sure Anonymous Authentication is enabled in the Firebase Console.',
      );
    } finally {
      this.submittingComment.set(false);
    }
  }
}
