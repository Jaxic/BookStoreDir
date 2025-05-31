# Astro Blog Content Collections Setup Plan

This document outlines the step-by-step process to add blog posts to your Astro site using the Content Collections feature. Check off each step as you complete it!

---

## ✅ Step 1: Set Up the Content Collection
- [ ] **Create or update `src/content.config.ts`**
- [ ] **Define the `blog` collection** using `defineCollection` and a Zod schema for your blog post frontmatter.
  - Example schema fields: `title`, `pubDate`, `description`, `image`, `tags`

---

## ✅ Step 2: Add Blog Post Files
- [ ] **Create a directory for blog posts** (e.g., `src/blog/`)
- [ ] **Write Markdown files** for each post, ensuring the frontmatter matches your schema.
  - Example frontmatter:
    ```markdown
    ---
    title: "My First Post"
    pubDate: 2024-06-01
    description: "An introduction to my blog."
    image:
      url: "/images/first-post.jpg"
      alt: "A descriptive alt text"
    tags: ["intro", "welcome"]
    ---
    Your blog content goes here...
    ```

---

## ✅ Step 3: Query Blog Posts in Pages
- [ ] **Import and use `getCollection`** in your Astro page/component to fetch blog posts.
- [ ] **Display a list of blog posts** (e.g., titles and links) on your blog index page.

---

## ✅ Step 4: Render Individual Blog Posts
- [ ] **Create a dynamic route** (e.g., `src/pages/blog/[id].astro`)
- [ ] **Fetch the post by ID** using `getEntry` and render its content using `render` and the `<Content />` component.

---

## ✅ Step 5: Create and Style a Blog Post Layout
- [ ] **Create a layout/template component** (e.g., `src/layouts/BlogPostLayout.astro`) to define the structure and style for all blog posts.
- [ ] **Add and customize styles** in the layout component using CSS, a framework, or your preferred method.
- [ ] **Update your dynamic blog post route** to use the layout component, passing the post data and content to it for consistent rendering.
- [ ] *(Optional)* Add extra features to the layout, such as author info, tags, social links, or reading time.

---

## ⬜ Step 6: (Optional) Add Authors or Related Posts
- [ ] **Define additional collections** (e.g., `authors`) in `src/content.config.ts`.
- [ ] **Reference authors or related posts** in your blog schema using `reference('authors')` or `reference('blog')`.
- [ ] **Update blog post frontmatter** to include references.

---

## ⬜ Step 7: (Optional) Filter, Sort, and Enhance
- [ ] **Filter out drafts** using a filter function in `getCollection`.
- [ ] **Sort posts by date** or other criteria.
- [ ] **Add pagination, tags, or categories** as needed.

---

## ⬜ Step 8: (Optional) Add RSS Feed
- [ ] **Use your structured blog data** to generate an RSS feed for your site.

---

## Progress Tracking
- [ ] Review and check off each step as you complete it!
- [ ] Update this plan with notes or additional steps as your implementation evolves.

---

*For code examples and more details, see the Astro documentation on Content Collections.* 