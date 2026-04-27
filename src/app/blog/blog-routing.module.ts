import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BlogListComponent } from './pages/blog-list/blog-list.component';
import { BlogPostComponent } from './pages/blog-post/blog-post.component';

const routes: Routes = [
  { path: '', component: BlogListComponent },
  { path: ':slug', component: BlogPostComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BlogRoutingModule {}

