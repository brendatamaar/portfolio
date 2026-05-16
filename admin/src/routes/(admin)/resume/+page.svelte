<script lang="ts">
  import type { ResumeSection } from '$lib/types'
  import ProfileTab from '$lib/components/resume/ProfileTab.svelte'
  import WorkTab from '$lib/components/resume/WorkTab.svelte'
  import EducationTab from '$lib/components/resume/EducationTab.svelte'
  import SkillsTab from '$lib/components/resume/SkillsTab.svelte'
  import ProjectsTab from '$lib/components/resume/ProjectsTab.svelte'

  let section = $state<ResumeSection>('profile')

  const SECTIONS: { key: ResumeSection; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'work', label: 'Work' },
    { key: 'education', label: 'Education' },
    { key: 'skills', label: 'Skills' },
    { key: 'projects', label: 'Projects' },
  ]
</script>

<svelte:head>
  <title>Resume — Admin</title>
</svelte:head>

<div class="min-h-screen bg-white text-black dark:bg-[#0a0a0a] dark:text-white">
  <main class="mx-auto max-w-4xl px-6 py-8">
    <h1 class="mb-6 text-3xl font-black tracking-tighter uppercase">Resume</h1>

    <div class="mb-6 flex items-center gap-1 border-b border-black/10 pb-0 dark:border-white/10">
      {#each SECTIONS as s}
        <button
          onclick={() => (section = s.key)}
          class={[
            '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-colors',
            section === s.key
              ? 'border-black text-black dark:border-white dark:text-white'
              : 'border-transparent text-black/30 hover:text-black/60 dark:text-white/30 dark:hover:text-white/60',
          ].join(' ')}
        >
          {s.label}
        </button>
      {/each}
    </div>

    {#if section === 'profile'}
      <ProfileTab />
    {:else if section === 'work'}
      <WorkTab />
    {:else if section === 'education'}
      <EducationTab />
    {:else if section === 'skills'}
      <SkillsTab />
    {:else if section === 'projects'}
      <ProjectsTab />
    {/if}
  </main>
</div>
