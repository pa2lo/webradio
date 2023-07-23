<script setup>
	import { ref, computed, inject, onMounted } from 'vue'
	import { playNow, favs, timerSettings, showInfo, appSettings, castPlayer, airplayPlayer } from '../store.js'
	import { isiOS } from '../helpers';

	import Icon from './Icon.vue'
	import SmoothFadeTransition from './SmoothFadeTransition.vue'

	const t = inject('t')

	// const props = defineProps(['settings'])
	const bigPlayer = ref(false)

	let playerButtonText = computed(() => {
		if (playNow.isLoading || castPlayer.state == 'buffering') return 'loading'
		else if (playNow.isPlaying || castPlayer.state == 'playing') return 'stop'
		else return 'play'
	})

	let playerOnInit = false
	onMounted(() => {
		if (window.location.hash == '#player') playerOnInit = true
	})

	function showPlayer() {
		window.location.hash = 'player'
		if (window.location.hash != '#player') bigPlayer.value = true
	}
	function closePlayer() {
		if (playerOnInit) {
			window.location.hash = ''
			playerOnInit = false
		} else history.back()
		if (bigPlayer.value) bigPlayer.value = false
	}

	const emit = defineEmits(['next', 'prev', 'toggle', 'toggleFav', 'cast', 'selectariplay'])
	let touches = {
		startX: 0,
		startY: 0,
	}
	function tabsTouchStart(e) {
		if (!e.changedTouches.length) return

		touches.startX = e.changedTouches[0].screenX
		touches.startY = e.changedTouches[0].screenY

		document.addEventListener('touchend', handleTouchEnd, {once: true})
	}
	function handleTouchEnd(e) {
		if (!e.changedTouches.length) return
		const { screenX: endX, screenY: endY } = e.changedTouches[0]
		let diffX = endX - touches.startX,
			absDiffY = Math.abs(endY - touches.startY),
			absDiffX = Math.abs(diffX)
		if (absDiffX > absDiffY && absDiffY < 40 && absDiffX > 80) {
			if (document.fullscreenElement || document.webkitFullscreenElement) return
			if (diffX < 0) emit('next')
			else emit('prev')
		}
	}

	/* text cache */
	let textChooseStation = computed(() => t('chooseStation'))
	let textTimerTitle = computed(() => t('timer.title'))
	let textStationInfo = computed(() => t('stationInfo'))
	let textFavsAdd = computed(() => t('favsAdd'))
	let textFavsRemove = computed(() => t('favsRemove'))
	let textPrev = computed(() => t('prev'))
	let textNext = computed(() => t('next'))
	let textMute = computed(() => t('mute'))
	let textFullVolume = computed(() => t('fullVolume'))
	let textStartStreaming = computed(() => t('startStreaming'))
	let textStopStreaming = computed(() => t('stopStreaming'))
</script>

<template>
	<div class="player">
		<div v-if="playNow.station" class="playerSmall flex ai-c l-hide" @click="showPlayer">
			<Transition name="movein" mode="out-in">
				<img :key="playNow.artwork ? playNow.artwork : `nologo`" :src="playNow.artwork ? playNow.artwork : '/assets/radio-logo.svg'" class="playNowImg">
				<!-- <img :key="playNow.artwork" v-if="playNow.artwork" :src="playNow.artwork" class="playNowImg">
				<div v-else class="playNowImg-placeholder"><Icon icon="radio" /></div> -->
			</Transition>
			<div class="justPlaying">
				<SmoothFadeTransition>
					<h2 :key="playNow.station.name || 'noname'">{{ playNow.station.name || textChooseStation }}</h2>
				</SmoothFadeTransition>
				<SmoothFadeTransition :collapse="!playNow.title">
					<h3 :key="playNow.title || 'notitle'" v-if="playNow.title">{{ playNow.title }}</h3>
				</SmoothFadeTransition>
			</div>
			<div class="player-buttons">
				<button class="playerBttn rm-hide" @click.stop="$emit('prev')" :title="textPrev">
					<Icon icon="left" />
				</button>
				<button class="playerBttn big" :class="{loading: playerButtonText == 'loading'}" @click.stop="$emit('toggle')" :title="$t(playerButtonText)">
					<Icon :icon="playerButtonText" />
				</button>
				<button class="playerBttn rm-hide" @click.stop="$emit('next')" :title="textNext">
					<Icon icon="right" />
				</button>
			</div>
		</div>
		<div id="player" class="playerBig" :class="{open: bigPlayer}">
			<div class="playerBig-header">
				<button class="unstyledBtn l-hide" @click="closePlayer" :aria-label="$t('back')">
					<Icon icon="back" />
				</button>
				<span class="right"></span>
				<button v-if="airplayPlayer.isAvailable" :class="{highlight: airplayPlayer.streaming}" class="unstyledBtn" :disabled="!playNow.station || (!airplayPlayer.streaming && !playNow.isPlaying)" @click.prevent="selectAriplayDevice" @click="$emit('selectariplay')" title="AirPlay">
					<Icon icon="airplay" />
				</button>
				<button v-if="castPlayer.isAvailable" :class="{highlight: castPlayer.connected}" class="unstyledBtn" :disabled="!playNow.station" :title="castPlayer.connected ? textStopStreaming : textStartStreaming" @click="$emit('cast')">
					<Icon icon="cast" />
				</button>
				<button class="unstyledBtn" :class="{highlight: timerSettings.active}" @click="timerSettings.show = true" :title="textTimerTitle">
					<Icon icon="clock" />
				</button>
				<button :disabled="!playNow.station" class="unstyledBtn" @click="showInfo(playNow.station)" :title="textStationInfo">
					<Icon icon="info2" />
				</button>
				<button :disabled="!playNow.station" class="unstyledBtn" @click="$emit('toggleFav', playNow.station)" :title="favs.some(fav => fav.stationuuid == playNow.uuid) ? textFavsRemove : textFavsAdd">
					<Icon icon="star" :filled="favs.some(fav => fav.stationuuid == playNow.uuid)" />
				</button>
			</div>
			<div class="playerBig-cont" @touchstart="tabsTouchStart">
				<div class="playerBig-img">
					<div class="playerBig-imgOuter" :class="{isActive: !playNow.hasVideo}">
						<div class="playerBig-imgInner">
							<Transition name="movein" mode="out-in">
								<div :key="playNow.artwork ? playNow.artwork : `nologo`" class="playNowImgBig-cont">
									<img :src="playNow.artwork ? playNow.artwork : '/assets/radio-logo.svg'" class="playNowImgBig-blur">
									<img :src="playNow.artwork ? playNow.artwork : '/assets/radio-logo.svg'" class="playNowImgBig">
								</div>
								<!-- <div v-else class="playerBig-placeholder"><Icon icon="radio" /></div> -->
							</Transition>
						</div>
					</div>
					<div class="playerBig-imgOuter" :class="{isActive: playNow.hasVideo}">
						<div class="playerBig-imgInner">
							<slot></slot>
						</div>
					</div>
				</div>
				<div class="playerBig-info">
					<SmoothFadeTransition>
						<h2 :key="playNow.station.name || 'noname'">{{ playNow.station.name || textChooseStation }}</h2>
					</SmoothFadeTransition>
					<SmoothFadeTransition :collapse="!playNow.title">
						<h3 :key="playNow.title || 'notitle'" v-if="playNow.title">{{ playNow.title }}</h3>
						<h3 v-else-if="castPlayer.device && castPlayer.connected">
							{{ $t('streamingTo') }} {{ castPlayer.device }}<br>
							<a href="#" @click.prevent="$emit('cast')">{{ textStopStreaming }}</a>
						</h3>
					</SmoothFadeTransition>
					<div class="playerBig-buttons">
						<button :disabled="!playNow.station" class="playerBttn" @click.stop="$emit('prev')" :title="textPrev">
							<Icon icon="left" />
						</button>
						<button :disabled="!playNow.station" :class="{loading: playerButtonText == 'loading'}" class="playerBttn big" @click.stop="$emit('toggle')" :title="$t(playerButtonText)">
							<Icon :icon="playerButtonText" />
						</button>
						<button :disabled="!playNow.station" class="playerBttn" @click.stop="$emit('next')" :title="textNext">
							<Icon icon="right" />
						</button>
					</div>
				</div>
			</div>
			<div class="playerBig-footer">
				<div class="playerBig-volume flex ai-c" :class="{disabled: castPlayer.connected, iOsHidden: isiOS}">
					<button class="unstyledBtn" :class="{muted: appSettings.volume.value == 0}" @click="$emit('toggleMute')" :title="textMute">
						<Icon icon="mute" />
					</button>
					<input :style="{'--value': appSettings.volume.value}" v-model="appSettings.volume.value" class="volumeRange" type="range" min="0" max="1" step="0.1">
					<button class="unstyledBtn" @click="appSettings.volume.value = 1" :title="textFullVolume">
						<Icon icon="volume" :filled="appSettings.volume.value == 1" />
					</button>
				</div>
			</div>
		</div>
	</div>
</template>