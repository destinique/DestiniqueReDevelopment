import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { BlogRoutingModule } from './blog-routing.module';
import { BlogListComponent } from './pages/blog-list/blog-list.component';
import { BlogPostComponent } from './pages/blog-post/blog-post.component';
import { PostCardComponent } from './components/post-card/post-card.component';

@NgModule({
  declarations: [BlogListComponent, BlogPostComponent, PostCardComponent],
  imports: [CommonModule, HttpClientModule, RouterModule, BlogRoutingModule]
})
export class BlogModule {}

