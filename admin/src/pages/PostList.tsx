import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  PlusIcon,
  LogOutIcon,
  Trash2Icon,
  EditIcon,
  SendIcon,
  ArchiveIcon,
  SunIcon,
  MoonIcon,
} from 'lucide-react'
import { api } from '../lib/api.ts'
import type { Post } from '../lib/api.ts'
import { useTheme } from '../lib/theme.ts'
import type { StatusFilter } from '../lib/types.ts'

function formatDate(ts: string, label: string) {
  return `${label} ${new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })}`
}

export default function PostList() {
  const navigate = useNavigate()
  const { isDark, toggle } = useTheme()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [togglingId, setTogglingId] = useState<number | null>(null)

  useEffect(() => {
    api.posts
      .list()
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function logout() {
    localStorage.removeItem('admin_token')
    navigate('/login')
  }

  async function deletePost(id: number, title: string) {
    if (!confirm(`Delete "${title}"?`)) return
    await api.posts.delete(id)
    setPosts((p) => p.filter((x) => x.id !== id))
  }

  async function toggleStatus(post: Post) {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    setTogglingId(post.id)
    try {
      const updated = await api.posts.update(post.id, { status: newStatus })
      setPosts((p) =>
        p.map((x) => (x.id === post.id ? { ...x, ...updated } : x)),
      )
    } catch (err) {
      console.error(err)
      throw err
    } finally {
      setTogglingId(null)
    }
  }

  const draftCount = posts.filter((p) => p.status === 'draft').length
  const publishedCount = posts.filter((p) => p.status === 'published').length

  const filtered =
    statusFilter === 'all'
      ? posts
      : posts.filter((p) => p.status === statusFilter)

  const tabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: posts.length },
    { key: 'draft', label: 'Draft', count: draftCount },
    { key: 'published', label: 'Published', count: publishedCount },
  ]

  return (
    <div className="min-h-screen bg-white text-black dark:bg-[#0a0a0a] dark:text-white">
      {/* Nav */}
      <header className="flex h-14 items-center justify-between border-b border-black/10 px-6 dark:border-white/10">
        <span className="text-sm font-black tracking-tight uppercase">
          Portfolio CMS
        </span>
        <div className="flex items-center gap-3">
          <Link
            to="/collection"
            className="font-mono text-xs tracking-widest text-black/40 uppercase transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
          >
            Collection
          </Link>
          <Link
            to="/posts/new"
            className="flex items-center gap-1.5 bg-black px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
          >
            <PlusIcon size={13} />
            New post
          </Link>
          <button
            onClick={toggle}
            className="p-1.5 text-black/40 transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
            title="Toggle theme"
          >
            {isDark ? <SunIcon size={15} /> : <MoonIcon size={15} />}
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 font-mono text-xs tracking-widest text-black/40 uppercase transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
          >
            <LogOutIcon size={13} />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="mb-6 text-3xl font-black tracking-tighter uppercase">
          Posts
        </h1>

        {/* Filter tabs */}
        {!loading && posts.length > 0 && (
          <div className="mb-4 flex items-center gap-1 border-b border-black/10 pb-0 dark:border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={[
                  '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-colors',
                  statusFilter === tab.key
                    ? 'border-black text-black dark:border-white dark:text-white'
                    : 'border-transparent text-black/30 hover:text-black/60 dark:text-white/30 dark:hover:text-white/60',
                ].join(' ')}
              >
                {tab.label}
                <span
                  className={[
                    'px-1 py-px text-[9px]',
                    statusFilter === tab.key
                      ? 'bg-black/15 dark:bg-white/15'
                      : 'bg-black/5 dark:bg-white/5',
                  ].join(' ')}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="font-mono text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
            Loading...
          </p>
        ) : filtered.length === 0 ? (
          <p className="font-mono text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
            {posts.length === 0 ? (
              <>
                No posts yet.{' '}
                <Link
                  to="/posts/new"
                  className="text-black/60 underline dark:text-white/60"
                >
                  Create one.
                </Link>
              </>
            ) : (
              `No ${statusFilter} posts.`
            )}
          </p>
        ) : (
          <div className="divide-y divide-black/10 border border-black/10 dark:divide-white/10 dark:border-white/10">
            {filtered.map((post) => (
              <div
                key={post.id}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span
                      className={[
                        'px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest uppercase',
                        post.status === 'published'
                          ? 'border border-green-500/30 bg-green-500/20 text-green-600 dark:text-green-400'
                          : 'border border-black/20 bg-black/10 text-black/40 dark:border-white/20 dark:bg-white/10 dark:text-white/40',
                      ].join(' ')}
                    >
                      {post.status}
                    </span>
                    <span className="font-mono text-[10px] text-black/30 dark:text-white/30">
                      {post.status === 'published' && post.publishedAt
                        ? formatDate(post.publishedAt, 'Published')
                        : formatDate(post.updatedAt, 'Updated')}
                    </span>
                  </div>
                  <p className="truncate text-sm font-bold">{post.title}</p>
                  {post.description && (
                    <p className="mt-0.5 truncate text-xs text-black/40 dark:text-white/40">
                      {post.description}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => toggleStatus(post)}
                    disabled={togglingId === post.id}
                    title={
                      post.status === 'published' ? 'Unpublish' : 'Publish'
                    }
                    className={[
                      'p-1.5 transition-all disabled:opacity-40',
                      post.status === 'published'
                        ? 'text-green-600/50 hover:bg-black/10 hover:text-black dark:text-green-400/50 dark:hover:bg-white/10 dark:hover:text-white'
                        : 'text-black/25 hover:bg-[#FFE600] hover:text-black dark:text-white/25 dark:hover:bg-[#FFE600] dark:hover:text-black',
                    ].join(' ')}
                  >
                    {post.status === 'published' ? (
                      <ArchiveIcon size={14} />
                    ) : (
                      <SendIcon size={14} />
                    )}
                  </button>
                  <Link
                    to={`/posts/${post.id}`}
                    className="p-1.5 text-black/30 transition-all hover:bg-black hover:text-white dark:text-white/30 dark:hover:bg-white dark:hover:text-black"
                    title="Edit"
                  >
                    <EditIcon size={14} />
                  </Link>
                  <button
                    onClick={() => deletePost(post.id, post.title)}
                    className="p-1.5 text-black/30 transition-all hover:bg-red-500 hover:text-white dark:text-white/30 dark:hover:bg-red-500 dark:hover:text-white"
                    title="Delete"
                  >
                    <Trash2Icon size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
