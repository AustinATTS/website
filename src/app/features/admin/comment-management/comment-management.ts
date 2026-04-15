import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { Forum } from '../../../core/services/forum.service';
import { ForumPost, ForumThread } from '../../../core/models/forum.model';
import { Blog } from '../../../core/services/blog.service';
import { BlogComment, BlogPost } from '../../../core/models/blog.model';

interface ForumCommentRow {
  post: ForumPost;
  threadTitle: string;
}

interface BlogCommentRow {
  comment: BlogComment;
  postTitle: string;
}

type TabValue = 'forum' | 'blog';

@Component({
  selector: 'app-comment-management',
  imports: [DatePipe, MatCardModule, MatButtonModule, MatButtonToggleModule, MatIconModule],
  templateUrl: './comment-management.html',
  styleUrl: './comment-management.scss',
})
export class CommentManagement implements OnInit {
  private forumService = inject(Forum);
  private blogService = inject(Blog);

  activeTab = signal<TabValue>('forum');
  forumComments = signal<ForumCommentRow[]>([]);
  blogComments = signal<BlogCommentRow[]>([]);

  private threadsMap = new Map<string, ForumThread>();
  private blogPostsMap = new Map<string, BlogPost>();

  ngOnInit() {
    this.loadForumComments();
    this.loadBlogComments();
  }

  setTab(tab: TabValue) {
    this.activeTab.set(tab);
  }

  private loadForumComments() {
    forkJoin([this.forumService.getAllThreads(), this.forumService.getAllPosts()]).subscribe(([threads, posts]) => {
      for (const thread of threads) { this.threadsMap.set(thread.id, thread); }
      this.forumComments.set(posts.map(post => ({ post, threadTitle: this.threadsMap.get(post.threadId)?.title ?? post.threadId })));
    });
  }

  private loadBlogComments() {
    this.blogService.getPosts().subscribe(posts => {
      for (const post of posts) { this.blogPostsMap.set(post.id, post); }
      if (posts.length === 0) { this.blogComments.set([]); return; }
      forkJoin(posts.map(post => this.blogService.getComments(post.id))).subscribe(commentArrays => {
        const rows: BlogCommentRow[] = [];
        for (const comments of commentArrays) {
          for (const comment of comments) {
            rows.push({ comment, postTitle: this.blogPostsMap.get(comment.postId)?.title ?? comment.postId });
          }
        }
        this.blogComments.set(rows);
      });
    });
  }

  async deleteForumComment(postId: string, threadId: string) {
    await this.forumService.deletePost(postId, threadId);
    this.forumComments.update(rows => rows.filter(r => r.post.id !== postId));
  }

  async deleteBlogComment(postId: string, commentId: string) {
    await this.blogService.deleteComment(postId, commentId);
    this.blogComments.update(rows => rows.filter(r => r.comment.id !== commentId));
  }
}
