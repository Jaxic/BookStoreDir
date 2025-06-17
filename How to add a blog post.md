# How to Add a Blog Post to Your Astro Site

This guide will walk you through adding a new blog post to your Astro project using Content Collections.

---

## 1. Go to the Blog Content Directory

All blog posts live in:
```
src/content/blog/
```

## 2. Create a New Markdown File

- Add a new file for your post, e.g.:
  ```
  src/content/blog/my-new-post.md
  ```

## 3. Copy and Edit This Sample Frontmatter

Paste this at the top of your new file, then fill in your own details:

```markdown
---
title: "Why Used Books Are the Future of Reading"
pubDate: 2024-06-01
image:
  url: "/images/Blog/Used_Books_Future.webp"
  alt: "Why Used Books Are the Future of Reading"
tags: ["Used Books"]
draft: false
author: "Nicole Dubois"
---
```

**Field explanations:**
- `title`: The post's title (required)
- `pubDate`: Publication date (YYYY-MM-DD, required)
- `image`: Object with `url` and `alt` (required)
- `tags`: Array of tags (required)
- `draft`: Set to `false` to publish, or `true` to hide from production
- `author`: Your name (optional)

## 4. Write Your Post Content

- Add your blog content below the frontmatter, using Markdown formatting.

## 5. Save the File

- Save your `.md` file in `src/content/blog/`.

## 6. Done!

- Your post will automatically appear on the blog index page (`/blog`) and have its own page at `/blog/[filename-without-md]/`.

---

**Tips:**
- To hide a post from the live site, set `draft: true`.
- Place images in `/public/images/Blog/` or update the path as needed.
- For more advanced features (authors, related posts, etc.), see the project README or ask for help!

## Image Optimization for Blog Posts

To ensure your blog images load quickly and look great on all devices, follow these steps to optimize them:

1. **Place your original images** in:
   ```
   public/images/
   ```

2. **Run the image optimizer script** (REQUIRED: use the npm script, not node or ts-node):
   - In your project root, run:
     ```
     npm run images:optimize
     ```
   - This uses the `tsx` tool, which is the only supported way to run the optimizer in this project. It handles TypeScript and ESM correctly.
   - **Do NOT use:**
     - `node scripts/image-optimizer.ts`
     - `npx ts-node scripts/image-optimizer.ts`
     - These will NOT work with your current project setup.

3. **Use the optimized images** from:
   ```
   public/images/optimized/
   ```
   - In your blog post frontmatter, set the image URL to the optimized version, e.g.:
     ```yaml
     image:
       url: "/images/optimized/your-image.webp"
       alt: "Descriptive alt text"
     ```
   - Choose the `.webp` or `.avif` version for best performance.

4. **Tips & Troubleshooting:**
   - The optimizer creates multiple sizes and formats for each image.
   - Always reference the optimized image path in your blog post frontmatter for faster loading.
   - If you add new images, re-run the optimizer script to process them.
   - If you get an error about missing dependencies, run `npm install` first.
   - If you get an error about `tsx` not found, install it with `npm install -D tsx`.
   - If the script fails for another reason, check your Node.js version (v18+ recommended) and that you are running the command from the project root.

--- 