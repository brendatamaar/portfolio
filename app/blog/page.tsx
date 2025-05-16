import { draftMode } from 'next/headers'
import { fetchBlogPosts } from '../../contentful/blogPosts'
import Header from '@/components/section/Header'
import Footer from '@/components/section/Footer'
import { PostCard } from '@/components/ui/post-card'

async function Blog() {
  const blogPosts = await fetchBlogPosts({
    preview: (await draftMode()).isEnabled,
  })

  return (
    <div className="flex min-h-screen w-full flex-col font-[family-name:var(--font-inter-tight)]">
      <div className="relative mx-auto w-full max-w-screen-sm flex-1 px-4 pt-20">
        <Header />

        <h2 className="text-medium mb-8 font-medium">Latest Posts</h2>
        {blogPosts.map((blogPost) => {
          return (
            <PostCard
              key={blogPost.slug}
              title={blogPost.title}
              link={`blog/${blogPost.slug}`}
              date={blogPost.date}
            />
          )
        })}
        <Footer />
      </div>
    </div>
  )
}

export default Blog
