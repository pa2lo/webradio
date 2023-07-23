<script setup>
	import { reactive, computed, onBeforeUnmount, inject } from 'vue'
	import { timerSettings } from '../store.js'

	import SmoothFadeTransition from './SmoothFadeTransition.vue'
	import Modal from './Modal.vue'

	let timer = reactive({
		time: 60,
		remaining: {
			h: 0,
			m: 0,
			s: 0
		},
		remainingPercent: 0,
		finishDate: null
	})

	const emit = defineEmits(['timerFinish'])

	let timeout
	let timeoutCountdown
	let warmingShow = false

	let timerRange = computed(() => {
		let hours = Math.floor(timer.time / 60)
		let minutes = Math.floor(timer.time % 60)

		return `${hours > 0 ? hours+'h' : ''} ${minutes > 0 ? minutes+'m' : ''}`.trim()
	})

	const toaster = inject('toaster')
	const t = inject('t')

	function getRemaining() {
		let now = new Date().getTime()
		let diff = timer.finishDate - now
		if (diff < 30500 && !document.hidden && !warmingShow) {
			warmingShow = true
			timerSettings.show = true
		}
		timer.remainingPercent = ((diff/10) / (timer.time*60)).toFixed(2)
		timer.remaining.h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
		timer.remaining.m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
		timer.remaining.s = Math.round((diff % (1000 * 60)) / 1000)
	}

	function start() {
		timerSettings.active = true
		let date = new Date()
		timer.finishDate = date.setMinutes(date.getMinutes() + parseInt(timer.time))
		getRemaining()
		timeoutCountdown = setInterval(getRemaining, 1000)
		timeout = setTimeout(() => {
			stop(true)
		}, (parseInt(timer.time) * 1000 * 60))
		toaster.success(t('timer.started'))
	}

	function stop(isFinished) {
		timerSettings.active = false
		warmingShow = false
		clearInterval(timeoutCountdown)
		if (isFinished) {
			timerSettings.show = false
			emit('timerFinish')
			toaster.success(t('timer.playbackStopped'))
		} else {
			clearTimeout(timeout)
			toaster.info(t('timer.stopped'))
		}
	}

	function handleKeyDown(ev) {
		if (document.activeElement.matches('input') && (ev.code == 'ArrowRight' || ev.code == 'ArrowLeft')) return
		if (ev.code == 'Enter') timerSettings.active ? stop() : start()
		if (ev.code == 'KeyS') timerSettings.show = false
		if (ev.code == 'ArrowRight' && +timer.time < 176) timer.time = +timer.time + 5
		if (ev.code == 'ArrowLeft' && +timer.time > 9) timer.time = +timer.time - 5
	}

	onBeforeUnmount(() => {
		if (timerSettings.active) stop()
	})
</script>

<template>
	<Modal
		:show="timerSettings.show"
		size="small"
		@close="timerSettings.show = false"
		@keydown.stop="handleKeyDown"
		:title="$t('timer.title')"
	>
		<SmoothFadeTransition>
			<div v-if="timerSettings.active" class="timerModal-inner">
				<p>{{ $t('timer.willStopIn') }}</p>
				<div class="mt025">
					<!-- <h2 :style="{'--remaining': `${timer.remainingPercent}%`}" class="timerRemaining"> -->
					<h2 class="timerRemaining">
						<span v-if="timer.remaining.h > 0">{{ timer.remaining.h }}<small>h</small></span>
						<span v-if="timer.remaining.h > 0 || timer.remaining.m > 0">{{ timer.remaining.m }}<small>m</small></span>
						<span>{{ timer.remaining.s }}<small>s</small></span>
					</h2>
				</div>
				<div class="mt05 countdown-progress-outer">
					<div class="countdown-progress" :style="{'--remaining': `${timer.remainingPercent}%`}"></div>
					<!-- <progress class="countdown-progress" max="100" :value="timer.remainingPercent"></progress> -->
				</div>
				<p class="mt1"><button @click="stop()" class="bttn"><span class="autoInvert">{{ $t('timer.stop') }}</span></button></p>
			</div>
			<div v-else class="timerModal-inner">
				<p>{{ $t('timer.stopIn') }}</p>
				<div class="mt025">
					<h2>{{ timerRange }}</h2>
				</div>
				<div class="timer-rangeCont mt05">
					<input :style="{'--value': timer.time/180}" class="timer-range" type="range" v-model="timer.time" min="5" max="180" step="5" />
				</div>
				<p class="mt1"><button @click="start" class="bttn"><span class="autoInvert">{{ $t('timer.start') }}</span></button></p>
			</div>
		</SmoothFadeTransition>
	</Modal>
</template>