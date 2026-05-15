<script lang="ts">
  export type ToastType = 'success' | 'error' | 'info'
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
      class="pointer-events-auto border-2 border-black px-4 py-3 text-sm font-bold shadow-[4px_4px_0px_#000] {toast.type === 'success' ? 'bg-green-400' : toast.type === 'error' ? 'bg-red-400 text-white' : 'bg-[#ffe600]'}"
    >
      {toast.message}
    </div>
  {/each}
</div>
