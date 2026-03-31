import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PlusIcon, LogOutIcon, Trash2Icon, EditIcon } from 'lucide-react'
import { api } from '../lib/api.ts'
import type { Post } from '../lib/api.ts'

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export default function PostList() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6">
        <span className="font-black uppercase tracking-tight text-sm">Portfolio CMS</span>
        <div className="flex items-center gap-3">
          <Link
            to="/posts/new"
            className="flex items-center gap-1.5 bg-white text-black font-bold text-xs uppercase tracking-wide px-3 py-1.5 hover:bg-white/80 transition-colors"
          >
            <PlusIcon size={13} />
            New post
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs font-mono uppercase tracking-widest transition-colors"
          >
            <LogOutIcon size={13} />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="font-black text-3xl uppercase tracking-tighter mb-6">Posts</h1>

        {loading ? (
          <p className="font-mono text-xs text-white/40 uppercase tracking-widest">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="font-mono text-xs text-white/40 uppercase tracking-widest">
            No posts yet.{' '}
            <Link to="/posts/new" className="underline text-white/60">Create one.</Link>
          </p>
        ) : (
          <div className="divide-y divide-white/10 border border-white/10">
            {posts.map((post) => (
              <div key={post.id} className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={[
                        'font-mono text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5',
                        post.status === 'published'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-white/10 text-white/40 border border-white/20',
                      ].join(' ')}
                    >
                      {post.status}
                    </span>
                    <span className="font-mono text-[10px] text-white/30">
                      {formatDate(post.updatedAt)}
                    </span>
                  </div>
                  <p className="font-bold text-sm truncate">{post.title}</p>
                  {post.description && (
                    <p className="text-xs text-white/40 truncate mt-0.5">{post.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/posts/${post.id}`}
                    className="p-1.5 text-white/40 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <EditIcon size={14} />
                  </Link>
                  <button
                    onClick={() => deletePost(post.id, post.title)}
                    className="p-1.5 text-white/40 hover:text-red-400 transition-colors"
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
