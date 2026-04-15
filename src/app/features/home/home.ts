import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ProjectCard } from '../../shared/components/project-card/project-card';
import { BlogCard } from '../../shared/components/blog-card/blog-card';
import { Projects } from '../../core/services/projects.service';
import { Blog } from '../../core/services/blog.service';
import { Project } from '../../core/models/project.model';
import { BlogPost } from '../../core/models/blog.model';

@Component({
  selector: 'app-home',
  imports: [MatButtonModule, MatIconModule, RouterLink, ProjectCard, BlogCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private projectsService = inject(Projects);
  private blogService = inject(Blog);

  featuredProjects: Project[] = [];
  latestPosts: BlogPost[] = [];

  ngOnInit(): void {
    this.projectsService.getFeaturedProjects().subscribe(projects => {
      this.featuredProjects = projects.slice(0, 4);
    });
    this.blogService.getPosts().subscribe(posts => {
      this.latestPosts = posts.slice(0, 2);
    });
  }
}
