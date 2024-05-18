<script setup lang="ts">
import { Switch } from '@headlessui/vue'
import { toRef, watch } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  info: {
    type: String,
    required: true,
  },
  enable: {
    type: Boolean,
    required: true,
  },
})

const emits = defineEmits(['event:change'])

const enabled = toRef(props.enable)

watch(props, (value) => {
  enabled.value = value.enable
})
</script>

<template>
  <div class="flex justify-between">
    <div class="flex flex-col max-w-[90%]">
      <div class="text-xs font-semibold">{{ title }}</div>
      <div class="text-xs text-neutral-600">
        {{ info }}
      </div>
    </div>
    <div>
      <slot></slot>
    </div>
    <Switch
      v-model="enabled"
      :class="enabled ? 'bg-neutral-500 ' : 'bg-neutral-300 '"
      class="my-auto relative inline-flex h-5 w-10 items-center rounded-full min-w-10"
      @update:model-value="emits('event:change', enabled)"
    >
      <span
        :class="enabled ? 'translate-x-5-5' : 'translate-x-0.5'"
        class="inline-block h-4 w-4 transform rounded-full bg-neutral-100 transition ease-in-out"
      />
    </Switch>
  </div>
</template>
<style scoped>
.translate-x-5-5 {
  --tw-translate-x: 1.35rem /* 20px */;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y))
    rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y))
    scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
</style>
