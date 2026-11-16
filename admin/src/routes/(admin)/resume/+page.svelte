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

<div class="bg-page text-ink">
  <main class="mx-auto w-full max-w-176 px-4 pt-8 pb-16 sm:px-0">
    <h1 class="text-[16px] text-ink">Resume</h1><p class="mt-1 mb-8 text-[14px] text-quiet">Profile, work, education, skills and projects.</p>

    <div class="mb-8 flex flex-wrap items-center gap-4 text-[14px]" role="tablist" aria-label="Resume sections">
      {#each SECTIONS as s (s.key)}
        <button role="tab" aria-selected={section === s.key} onclick={() => (section = s.key)} class="transition-colors {section === s.key ? 'font-medium text-ink' : 'text-quiet hover:text-ink'}">{s.label}</button>
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
