import { Component, inject, signal, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Blog } from '../../../core/services/blog.service';
import { Forum } from '../../../core/services/forum.service';
import { AuthService } from '../../../core/services/auth.service';
import { Projects } from '../../../core/services/projects.service';
import { ContactService } from '../../../core/services/contact.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private blogService = inject(Blog);
  private forumService = inject(Forum);
  private authService = inject(AuthService);
  private projectsService = inject(Projects);
  private contactService = inject(ContactService);

  totalPosts = signal(0);
  totalThreads = signal(0);
  totalUsers = signal(0);
  totalComments = signal(0);
  totalProjects = signal(0);
  totalMessages = signal(0);

  ngOnInit() {
    this.blogService.getPosts().subscribe(posts => this.totalPosts.set(posts.length));

    this.forumService.getAllThreads().subscribe(threads =>
      this.totalThreads.set(threads.length),
    );

    this.authService.listUsers().then(users => this.totalUsers.set(users.length));

    this.forumService.getAllPosts().subscribe(posts =>
      this.totalComments.set(posts.length),
    );

    this.projectsService.getProjects().subscribe(projects =>
      this.totalProjects.set(projects.length),
    );

    this.contactService.getMessages().subscribe(messages =>
      this.totalMessages.set(messages.length),
    );
  }
}
