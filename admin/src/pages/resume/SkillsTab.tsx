import { useState, useEffect } from 'react'
import { LoaderIcon, PlusIcon, XIcon } from 'lucide-react'
import { api } from '../../lib/api'
import type { ResumeSkillItem } from '../../lib/api'
import { inputCls, btnPrimary } from '../../components/form'
import { Loader } from './shared'

export function SkillsTab() {
  const [items, setItems] = useState<ResumeSkillItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    api.resume
      .listSkills()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setAdding(true)
    try {
      const created = await api.resume.createSkill(name, items.length)
      setItems((p) => [...p, created])
      setNewName('')
    } catch (err) {
      alert(`Failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete skill "${name}"?`)) return
    await api.resume.deleteSkill(id)
    setItems((p) => p.filter((i) => i.id !== id))
  }

  if (loading) return <Loader />

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          className={`${inputCls} flex-1`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="TypeScript"
        />
        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className={btnPrimary}
        >
          {adding ? (
            <LoaderIcon size={12} className="animate-spin" />
          ) : (
            <PlusIcon size={12} />
          )}
          Add
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-1 border border-black/20 px-2.5 py-1 dark:border-white/20"
          >
            <span className="font-mono text-xs">{item.name}</span>
            <button
              onClick={() => handleDelete(item.id, item.name)}
              className="ml-1 text-black/30 transition-colors hover:text-red-500 dark:text-white/30"
            >
              <XIcon size={11} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="font-mono text-xs text-black/30 dark:text-white/30">
            No skills yet.
          </p>
        )}
      </div>
    </div>
  )
}
