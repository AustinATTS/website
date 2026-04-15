import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DatePipe } from '@angular/common';
import { Forum } from '../../core/services/forum.service';
import { AuthService } from '../../core/services/auth.service';
import { ForumThread as ForumThreadModel, ForumPost } from '../../core/models/forum.model';

@Component({
  selector: 'app-forum-thread',
  imports: [
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, ReactiveFormsModule,
    RouterLink, DatePipe,
  ],
  templateUrl: './forum-thread.html',
  styleUrl: './forum-thread.scss',
})
export class ForumThread implements OnInit {
  private route = inject(ActivatedRoute);
  private forumService = inject(Forum);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  thread = signal<ForumThreadModel | undefined>(undefined);
  posts = signal<ForumPost[]>([]);
  submittingReply = signal(false);

  replyForm: FormGroup = this.fb.group({
    content: ['', Validators.required],
    displayName: [''],
  });

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.forumService.getThreadBySlug(slug).subscribe(t => {
        if (t) {
          this.thread.set(t);
          this.forumService.getPosts(t.id).subscribe(p => this.posts.set(p));
        } else {
          this.forumService.getThread(slug).subscribe(fallback => {
            this.thread.set(fallback);
            if (fallback) {
              this.forumService.getPosts(fallback.id).subscribe(p => this.posts.set(p));
            }
          });
        }
      });
    }
  }

  async submitReply() {
    if (this.replyForm.invalid) { this.replyForm.markAllAsTouched(); return; }
    const t = this.thread();
    if (!t) return;
    this.submittingReply.set(true);
    try {
      const uid = await this.auth.ensureAnonymousUser();
      const user = this.auth.currentUser();
      const displayName = user?.displayName
        || this.replyForm.value.displayName?.trim()
        || 'Anonymous';
      await this.forumService.createPost({
        threadId: t.id,
        author: displayName,
        authorUid: uid,
        content: this.replyForm.value.content,
        createdAt: new Date().toISOString(),
      });
      this.replyForm.reset({ content: '', displayName: '' });
      this.forumService.getPosts(t.id).subscribe(p => this.posts.set(p));
    } catch {
    } finally {
      this.submittingReply.set(false);
    }
  }
}
