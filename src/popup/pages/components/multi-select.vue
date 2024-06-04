<script setup lang="ts">
import { BIconCheck } from 'bootstrap-icons-vue'

const props = defineProps({
  modelValue: {
    type: Array as () => string[],
    required: true,
  },
  options: {
    type: Array as () => { name: string; color: string }[],
    required: false,
    default: () => [],
  },
})

const emits = defineEmits(['event:add', 'event:delete', 'event:change'])

const toggle = (value: string) => {
  const index = props.modelValue.indexOf(value)
  if (index === -1) {
    emits('event:add', value)
  } else {
    emits('event:delete', index)
  }

  const newValue = [...props.modelValue]
  if (index === -1) {
    newValue.push(value)
  } else {
    newValue.splice(index, 1)
  }

  emits('event:change', newValue)
}

const backgroundColors = {
  red: 'bg-red-400',
  green: 'bg-green-400',
  blue: 'bg-blue-400',
  yellow: 'bg-yellow-400',
  purple: 'bg-purple-400',
  pink: 'bg-pink-400',
  cyan: 'bg-cyan-400',
  orange: 'bg-orange-400',
} as Record<string, string>
</script>

<template>
  <div
    ref="box"
    class="flex flex-wrap my-auto max-h-[300px] overflow-auto"
  >
    <div
      v-for="option in options"
      class="text-xs px-1 py-0.5 rounded flex mb-1 mx-0.5 select-none cursor-pointer"
      :class="
        modelValue.includes(option.name)
          ? 'bg-neutral-500 text-neutral-100 dark:text-neutral-100'
          : 'bg-neutral-300 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-300'
      "
      @click="toggle(option.name)"
    >
      <div
        class="w-1 h-3 mr-1 my-auto rounded-md"
        :class="backgroundColors[option.color]"
      ></div>
      <span class="my-auto">{{ option.name }}</span>
      <BIconCheck
        class="text-sm my-auto cursor-pointer"
        v-if="modelValue.includes(option.name)"
      />
    </div>
  </div>
</template>
