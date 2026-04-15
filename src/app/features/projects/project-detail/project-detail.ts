import { Component, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';
import { Projects } from '../../../core/services/projects.service';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, DatePipe],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss',
})
export class ProjectDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private projectsService = inject(Projects);
  private sanitizer = inject(DomSanitizer);

  project = signal<Project | undefined>(undefined);
  loading = signal(true);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.projectsService.getProject(slug).subscribe(project => {
        this.project.set(project);
        this.loading.set(false);
      });
    } else {
      this.loading.set(false);
    }
  }

  parseContent(content: string): SafeHtml {
    if (!content) return '';
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const html = escaped
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[hul])(.+)$/gm, '<p>$1</p>');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
