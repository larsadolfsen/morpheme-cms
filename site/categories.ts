// Tags (called categories in the code): one JSON file per tag in src/data/categories/, edited in the
// editor (/editor/, "Tags"). The file name is the slug: the address /blog/kategori/<slug>/ and the
// value stored in the `categories` of the blog posts and the testimonials. Only a blog category
// (`blogCategory`, "Blogkategori" in the editor) is shown on the blog: a pill on the blog index and
// on its posts, and its own page. The others only pick posts and testimonials.
type CategoryData = { name: string; blogCategory?: boolean; seoTitle?: string; seoDescription?: string; shareImage?: string };

const files = import.meta.glob<CategoryData>('@data/categories/*.json', { eager: true, import: 'default' });

export const categories = Object.entries(files)
  .map(([file, c]) => ({ slug: file.replace(/^.*\/|\.json$/g, ''), ...c }))
  .sort((a, b) => a.slug.localeCompare(b.slug));

const notOnBlog = new Set(categories.filter((c) => c.blogCategory === false).map((c) => c.slug));
/** Whether the tag is shown on the blog (a tag without a file, or from before the field, is). */
export const isBlogCategory = (slug: string) => !notOnBlog.has(slug);
