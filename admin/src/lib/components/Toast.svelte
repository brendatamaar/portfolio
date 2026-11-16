<script module lang="ts">
  export type ToastType = 'success' | 'error' | 'info'
</script>

<script lang="ts">
  interface Toast { id: number; message: string; type: ToastType }

  let toasts = $state<Toast[]>([])
  let nextId = 0

  export function show(message: string, type: ToastType = 'info', duration = 3000) {
    const id = ++nextId
    toasts = [...toasts, { id, message, type }]
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id)
    }, duration)
  }
</script>

<div class="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
  {#each toasts as toast (toast.id)}
    <div
      class="pointer-events-auto rounded-[10px] border border-ring bg-page px-4 py-3 text-sm text-ink shadow-popup {toast.type === 'error' ? 'border-rose/50 text-rose' : ''}"
    >
      {toast.message}
    </div>
  {/each}
</div>
