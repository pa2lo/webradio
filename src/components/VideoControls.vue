<script setup>
	import { appSettings, playNow } from '../store';
	import Icon from './Icon.vue'

	const props = defineProps(['hlslevels',	'hlscurrentlevel'])

	function getLevelName(level) {
		if (level.name) return level.name
		else if (level.bitrate) return `${level.bitrate / 1000}kbps`
	}
</script>

<template>
	<div v-if="playNow.hasVideo" class="videoEl-controls-outer">
		<div v-if="playNow.isLoading" class="videoEl-loading">
			<Icon icon="loading" />
		</div>
		<div class="videoEl-controls">
			<div v-if="playNow.fullScreen" class="videoEl-hoverCont">
				<button @click="$emit('toggleMute')" class="videoBttn">
					<Icon :icon="appSettings.volume.value == 0 ? 'mute' : 'volume'" />
				</button>
				<div class="videoEl-hoverBox videoEl-colSLiderCont">
					<input :style="{'--value': appSettings.volume.value}" class="videoEl-volSlider" v-model="appSettings.volume.value" type="range" min="0" max="1" step="0.1" orient="vertical">
				</div>
			</div>
			<div v-if="hlslevels && hlslevels.length > 1" class="videoEl-hoverCont">
				<button @click="$emit('getHlsLevel')" class="videoBttn">
					<Icon icon="settings" />
				</button>
				<div class="videoEl-hoverBox vieoEl-levelsCont">
					<button v-for="(level, index) in hlslevels" @click="$emit('setHlsLevel', index)" class="videoEl-level" :class="{isActive: hlscurrentlevel == index}">
						{{ getLevelName(level) }}
					</button>
				</div>
			</div>
			<button @click="$emit('toggleMaximize')" class="videoBttn">
				<Icon :icon="playNow.fullScreen ? 'minimize' : 'maximize'" />
			</button>
		</div>
	</div>
</template>