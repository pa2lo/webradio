<script setup>
	import { computed, onMounted } from 'vue';
	import Icon from '../components/Icon.vue';

	const props = defineProps({
		toast: Object
	})

	const emit = defineEmits(['close'])
	let timer, startTime, remaining

	onMounted(() => {
		if (props.toast.duration > 0) {
			startCountdown(props.toast.duration)
		}
	})

	function startCountdown(time) {
		startTime = Date.now()
		remaining = time
		timer = setTimeout(destroyToast, time)
	}

	function pauseCountdown() {
		if (!timer) return
		remaining = remaining - (Date.now() - startTime)
		clearTimeout(timer)
	}

	function resumeCountdown() {
		if (!remaining) return
		startCountdown(remaining)
	}

	function destroyToast() {
		if (timer) clearTimeout(timer)
		emit('close', props.toast.id)
	}

	function handleClick() {
		if (props.toast.onClick) props.toast.onClick()
		destroyToast()
	}

	let icon = computed(() => {
		if (props.toast.type == 'info') return 'info'
		else if (props.toast.type == 'success') return 'check'
		else if (props.toast.type == 'error') return 'alert'
	})
</script>

<template>
	<div class="toast" :class="[`toast-${toast.type}`, {hasAction: toast.onClick}]" @click.stop="handleClick" @mouseenter="pauseCountdown" @mouseleave="resumeCountdown">
		<div class="toast-iconCont">
			<Icon :icon="icon" />
		</div>
		<div class="toast-textCont">
			<div class="toast-title" v-html="toast.title"></div>
			<div v-if="toast.message" class="toast-text" v-html="toast.message"></div>
		</div>
		<Icon class="toast-close" @click.stop="destroyToast" icon="x" />
		<div v-if="toast.duration > 0" :style="{'--countdown': `${toast.duration}ms`}" class="toast-countdown"></div>
	</div>
</template>