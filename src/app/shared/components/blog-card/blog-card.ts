import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { BlogPost } from '../../../core/models/blog.model';

@Component({
  selector: 'app-blog-card',
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink, DatePipe],
  templateUrl: './blog-card.html',
  styleUrl: './blog-card.scss',
})
export class BlogCard {
  post = input.required<BlogPost>();
}
