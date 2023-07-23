<script setup>
	import { toasts } from './toastStore'
	import Toast from './Toast.vue'

	function destroyToast(id) {
		let index = toasts.value.findIndex(t => t.id == id)
		if (index !== -1) toasts.value.splice(index, 1)
	}

	function onBeforeLeave(el) {
		const { height } = el.getBoundingClientRect()
		el.style.setProperty('--height', `${height}px`)
	}
</script>

<template>
	<div class="toaster">
		<TransitionGroup name="toast" @before-leave="onBeforeLeave">
			<Toast v-for="toast in toasts" :key="toast.id" :toast="toast" @close="destroyToast" />
		</TransitionGroup>
	</div>
</template>