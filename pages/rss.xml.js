import rss from '@astrojs/rss';
import { getPosts } from '@morphemecms/cms/site/content';
import { site } from '@morphemecms/cms/site/site';

export async function GET(context) {
  const posts = await getPosts();
  return rss({
    title: `${site.name} | Blog`,
    description: site.description,
    site: context.site,
    customData: `<language>${site.locale.toLowerCase()}</language>`,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/${post.id}/`,
      categories: post.data.categories,
    })),
  });
}
