# How to Add Blog-Style Posts to This Astro Site

## 1. Create a Blog Directory
Create a new directory for your blog posts:
- For simple Markdown: `src/pages/blog/`
- For Astro Content Collections (recommended): `src/content/blog/`

## 2. Choose a Content Format
- **Markdown (`.md` or `.mdx`)**: Easiest for content-focused posts.
- **Astro (`.astro`)**: More flexibility, but more code.

*Markdown is recommended for most blogs.*

## 3. Add Your First Post
Create a file like `src/pages/blog/my-first-post.md` (or `src/content/blog/my-first-post.md` if using collections):

```markdown
---
title: "My First Blog Post"
pubDate: 2024-05-01
author: "Your Name"
description: "A short summary of this post."
tags: ["news", "books"]
---

Welcome to the first blog post on Born Again Books!  
Here you can share news, stories, or book recommendations.
```

## 4. Create a Blog Index Page
Create `src/pages/blog/index.astro` to list all posts:

```astro
---
import { getCollection } from 'astro:content';
const posts = await getCollection('blog');
---

<Layout title="Blog - Born Again Books">
  <h1>Blog</h1>
  <ul>
    {posts.map(post => (
      <li>
        <a href={`/blog/${post.slug}/`}>{post.data.title}</a>
        <span>{post.data.pubDate}</span>
        <p>{post.data.description}</p>
      </li>
    ))}
  </ul>
</Layout>
```

## 5. Configure Content Collections (Astro v2+ recommended)
If you want to use Astro's content collections (recommended for type safety and easy querying):

- Create `src/content/config.ts`:

  ```typescript
  import { defineCollection, z } from 'astro:content';

  const blog = defineCollection({
    schema: z.object({
      title: z.string(),
      pubDate: z.string(),
      author: z.string(),
      description: z.string(),
      tags: z.array(z.string()).optional(),
    }),
  });

  export const collections = { blog };
  ```

- Place your posts in `src/content/blog/` instead of `src/pages/blog/`.
- Update your index page to use `getCollection('blog')`.

## 6. Style Your Blog
- Use your existing layout and Tailwind classes for visual consistency.
- You can create a `BlogPost.astro` component for post details.

## 7. Link to Your Blog
- Add a link to `/blog/` in your navigation.

---

## Summary Table

| Step                | What to Do                                 |
|---------------------|--------------------------------------------|
| 1. Create Directory | `src/pages/blog/` or `src/content/blog/`   |
| 2. Add Posts        | Markdown files with frontmatter            |
| 3. Blog Index       | `src/pages/blog/index.astro`               |
| 4. (Optional) Collections | Use Astro content collections        |
| 5. Style            | Use Tailwind and your Layout               |
| 6. Link             | Add `/blog/` to your nav                   |

---

*For a working example or further customization, see the Astro documentation or ask for a scaffolded setup!*
