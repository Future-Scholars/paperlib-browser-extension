<script setup lang="ts">
import { BIconCheck } from 'bootstrap-icons-vue'
import { onUnmounted } from 'vue'
import { ref, computed, Ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array as () => string[],
    required: true,
  },
  options: {
    type: Array as () => string[],
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
</script>

<template>
  <div
    ref="box"
    class="flex flex-wrap my-auto"
  >
    <div
      v-for="value in options"
      class="text-xs px-1 py-0.5 rounded flex mb-1 mx-0.5 select-none cursor-pointer"
      :class="
        modelValue.includes(value)
          ? 'bg-neutral-500 text-neutral-100'
          : 'bg-neutral-300 text-neutral-500'
      "
      @click="toggle(value)"
    >
      <span class="my-auto">{{ value }}</span>
      <BIconCheck
        class="text-sm my-auto cursor-pointer"
        v-if="modelValue.includes(value)"
      />
    </div>
  </div>
</template>
