import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/blog' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string().optional(),
    image: z.object({
      url: z.string(),
      alt: z.string()
    }),
    tags: z.array(z.string()),
    draft: z.boolean().optional(),
    author: z.string().optional()
  })
});

export const collections = { blog }; 