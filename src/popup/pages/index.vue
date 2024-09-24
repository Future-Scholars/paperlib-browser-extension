<script setup lang="ts">
import Toggle from './components/toggle.vue'
import Spinner from './components/spinner.vue'
import MultiselectBox from './components/multi-select.vue'

const processing = ref(false)
const processingMsg = ref('Import')
const downloadPDF = ref(true)
const tags = ref([])
const folders = ref([])
const showingTags = ref([])
const selectTags = ref([])
const selectFolders = ref([])

const onImportClicked = async () => {
  processingMsg.value = 'Importing...'
  processing.value = true
  const successStat = await chrome.runtime.sendMessage({ type: 'import' })
  if (successStat === 'successful') {
    processingMsg.value = 'Imported!'
    setTimeout(() => {
      processingMsg.value = 'Import'
    }, 1000)

    processing.value = false
  } else {
    processingMsg.value = successStat
    setTimeout(() => {
      processingMsg.value = 'Import'
    }, 2000)

    processing.value = false
  }
}

const onDownloadPDFChanged = (value: boolean) => {
  downloadPDF.value = value
  chrome.runtime.sendMessage({
    type: 'updateDownloadPDF',
    value: downloadPDF.value,
  })
}

const onTagsChange = (value: string[]) => {
  selectTags.value = tags.value.filter((tag: any) => value.includes(tag.name))

  chrome.runtime.sendMessage({
    type: 'updateTags',
    value: JSON.parse(JSON.stringify(selectTags.value)),
  })
}

const logo = ref('light')

const tagSearchText = ref('')

watch(tagSearchText, (value) => {
  const tagsRes = tags.value.filter((tag: any) => tag.name.toLowerCase().includes(value.toLowerCase()))
  showingTags.value = tagsRes
})


onMounted(async () => {
  const value = await chrome.runtime.sendMessage({ type: 'getDownloadPDF' })
  downloadPDF.value = value

  const tagsRes = await chrome.runtime.sendMessage({ type: 'getTags' })
  tags.value = tagsRes
  showingTags.value = tagsRes
  const foldersRes = await chrome.runtime.sendMessage({ type: 'getFolders' })
  folders.value = foldersRes

  const selectTagsRes = await chrome.runtime.sendMessage({
    type: 'getSelectedTags',
  })
  selectTags.value = selectTagsRes

  const isDarkMode = await chrome.runtime.sendMessage({ type: 'getBrowserTheme' })
  console.log(isDarkMode)
  logo.value = isDarkMode
    ? 'dark'
    : 'light'
  if (isDarkMode) {
    console.log('dark')
    document.body.classList.add('dark')
  } else {
    document.body.classList.remove('dark')
  }
})
</script>

<template>
  <div class="flex flex-col py-3 px-4 dark:bg-neutral-800 dark:text-neutral-100">
    <div class="flex space-x-2">
      <img
        class="w-4 my-auto"
        src="../../assets/logo-light.png"
        v-if="logo === 'light'"
      />
      <img
        class="w-4 my-auto"
        src="../../assets/logo-dark.png"
        v-else
      />
      <span class="my-auto text-lg">PAPERLIB</span>
    </div>
    <div class="my-2"></div>
    <Toggle
      title="Download PDF"
      info="whether to download PDF or not"
      :enable="downloadPDF"
      @event:change="onDownloadPDFChanged"
    />
    <div class="my-2"></div>
    <div class="mb-1">
      <span class="text-xs font-semibold">Import with Tags</span>
    </div>
    <input type="text" class="w-full h-8 mb-2 text-xs border-none bg-neutral-200 dark:bg-neutral-700 rounded-md px-2" placeholder="Search tags" v-model="tagSearchText" />
    <MultiselectBox
      id="paper-edit-view-tags-input"
      :model-value="selectTags.map((tag: any) => tag.name)"
      :options="
        (showingTags ? showingTags : [])
          .filter((tag: any) => tag.name !== 'Tags')
      "
      @event:change="onTagsChange"
    />

    <div class="my-2"></div>
    <button
      class="flex h-8 bg-neutral-200 dark:bg-neutral-700 rounded-md hover:bg-neutral-300 hover:dark:bg-neutral-600 transition-colors cursor-pointer duration-75 justify-center space-x-2"
      @click="onImportClicked"
      :disabled="processing"
    >
      <div class="w-3.5 h-3.5 my-auto"></div>
      <span
        class="my-auto select-none text-xs"
        :class="processing ? 'text-neutral-400' : 'text-neutral-700 dark:text-neutral-100'"
      >
        {{ processingMsg }}
      </span>
      <Spinner
        class="my-auto"
        v-if="processing"
      />
    </button>
  </div>
</template>
