import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PlusIcon, LogOutIcon, Trash2Icon, EditIcon, GlobeIcon, EyeOffIcon, SunIcon, MoonIcon } from 'lucide-react'
import { api } from '../lib/api.ts'
import type { Post } from '../lib/api.ts'
import { useTheme } from '../lib/theme.ts'

type StatusFilter = 'all' | 'draft' | 'published'

function formatDate(ts: number, label: string) {
  return `${label} ${new Date(ts * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
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
    api.posts.list()
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
      setPosts((p) => p.map((x) => x.id === post.id ? { ...x, ...updated } : x))
    } catch (err) {
      console.error(err)
    } finally {
      setTogglingId(null)
    }
  }

  const draftCount     = posts.filter((p) => p.status === 'draft').length
  const publishedCount = posts.filter((p) => p.status === 'published').length

  const filtered = statusFilter === 'all'
    ? posts
    : posts.filter((p) => p.status === statusFilter)

  const tabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all',       label: 'All',       count: posts.length },
    { key: 'draft',     label: 'Draft',     count: draftCount },
    { key: 'published', label: 'Published', count: publishedCount },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-black dark:text-white">
      {/* Nav */}
      <header className="h-14 border-b border-black/10 dark:border-white/10 flex items-center justify-between px-6">
        <span className="font-black uppercase tracking-tight text-sm">Portfolio CMS</span>
        <div className="flex items-center gap-3">
          <Link
            to="/posts/new"
            className="flex items-center gap-1.5 bg-black dark:bg-white text-white dark:text-black font-bold text-xs uppercase tracking-wide px-3 py-1.5 hover:bg-black/80 dark:hover:bg-white/80 transition-colors"
          >
            <PlusIcon size={13} />
            New post
          </Link>
          <button
            onClick={toggle}
            className="p-1.5 text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors"
            title="Toggle theme"
          >
            {isDark ? <SunIcon size={15} /> : <MoonIcon size={15} />}
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white text-xs font-mono uppercase tracking-widest transition-colors"
          >
            <LogOutIcon size={13} />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="font-black text-3xl uppercase tracking-tighter mb-6">Posts</h1>

        {/* Filter tabs */}
        {!loading && posts.length > 0 && (
          <div className="flex items-center gap-1 mb-4 border-b border-black/10 dark:border-white/10 pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={[
                  'flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest px-3 py-2 border-b-2 -mb-px transition-colors',
                  statusFilter === tab.key
                    ? 'border-black dark:border-white text-black dark:text-white'
                    : 'border-transparent text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60',
                ].join(' ')}
              >
                {tab.label}
                <span className={[
                  'text-[9px] px-1 py-px',
                  statusFilter === tab.key ? 'bg-black/15 dark:bg-white/15' : 'bg-black/5 dark:bg-white/5',
                ].join(' ')}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="font-mono text-xs text-black/40 dark:text-white/40 uppercase tracking-widest">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="font-mono text-xs text-black/40 dark:text-white/40 uppercase tracking-widest">
            {posts.length === 0 ? (
              <>No posts yet.{' '}<Link to="/posts/new" className="underline text-black/60 dark:text-white/60">Create one.</Link></>
            ) : (
              `No ${statusFilter} posts.`
            )}
          </p>
        ) : (
          <div className="divide-y divide-black/10 dark:divide-white/10 border border-black/10 dark:border-white/10">
            {filtered.map((post) => (
              <div key={post.id} className="flex items-center gap-4 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={[
                        'font-mono text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5',
                        post.status === 'published'
                          ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30'
                          : 'bg-black/10 dark:bg-white/10 text-black/40 dark:text-white/40 border border-black/20 dark:border-white/20',
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
                  <p className="font-bold text-sm truncate">{post.title}</p>
                  {post.description && (
                    <p className="text-xs text-black/40 dark:text-white/40 truncate mt-0.5">{post.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleStatus(post)}
                    disabled={togglingId === post.id}
                    title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                    className={[
                      'p-1.5 transition-colors disabled:opacity-40',
                      post.status === 'published'
                        ? 'text-green-600/60 dark:text-green-400/60 hover:text-black/60 dark:hover:text-white/60'
                        : 'text-black/20 dark:text-white/20 hover:text-[#FFE600]',
                    ].join(' ')}
                  >
                    {post.status === 'published'
                      ? <EyeOffIcon size={14} />
                      : <GlobeIcon size={14} />}
                  </button>
                  <Link
                    to={`/posts/${post.id}`}
                    className="p-1.5 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
                    title="Edit"
                  >
                    <EditIcon size={14} />
                  </Link>
                  <button
                    onClick={() => deletePost(post.id, post.title)}
                    className="p-1.5 text-black/40 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 transition-colors"
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
