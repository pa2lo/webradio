<script setup>
	import { ref, onMounted, watch, onBeforeUnmount, inject, computed } from 'vue';
	import { playNow, favs, showInfo, editStation, castPlayer } from '../store.js'

	import Icon from './Icon.vue'
	import SmoothFadeTransition from './SmoothFadeTransition.vue'
	import Loading from './Loading.vue'

	const t = inject('t')

	const props = defineProps({
		loading: {
			type: Boolean,
			default: false
		},
		list: {
			default: []
		},
		playNow: Object,
		empty: String,
		showReturn: Boolean,
		hasmore: Boolean,
		loadingmore: Boolean
	})

	const emit = defineEmits(['loadmore', 'play', 'toggleFav', 'return'])

	let loadMoreTrigger = ref(null)
	let observer = null

	onMounted(() => {
		observer = new IntersectionObserver(entries => {
			if (entries[0].isIntersecting) emit('loadmore')
		})
	})
	onBeforeUnmount(() => {
		observer.disconnect()
	})
	watch(loadMoreTrigger, (newEl, oldEl) => {
		if (newEl) observer.observe(newEl)
		if (oldEl) observer.unobserve(oldEl)
	})

	let textInfo = computed(() => t('stationInfo'))
	let textFavsAdd = computed(() => t('favsAdd'))
	let textFavsRemove = computed(() => t('favsRemove'))
	let textEditStation = computed(() => t('editStation'))
</script>
<template>
	<div class="radioList-cont">
		<div v-if="loading" class="radioList-loader">
			<Loading />
		</div>

		<div v-else class="stations">
			<SmoothFadeTransition>
				<ul v-if="list.length" class="radioList">
					<li v-for="station in list" class="flex ai-c">
						<a
							class="radioStation flex ai-c"
							:data-uuid="station.stationuuid"
							:class="{
								isPlaying: playNow.uuid == station.stationuuid && (playNow.isPlaying || playNow.isLoading || castPlayer.state == 'playing' || castPlayer.state == 'buffering'),
								current: playNow.uuid == station.stationuuid
							}"
							:href="station.stationuuid"
							@click.prevent="$emit('play', station)"
						>
							<Transition name="radioListIco">
								<div v-if="(playNow.uuid == station.stationuuid && (playNow.isPlaying || playNow.isLoading || castPlayer.state == 'playing' || castPlayer.state == 'buffering'))" class="isPlayingIco rm-hide">
									<Icon :icon="playNow.isPlaying || castPlayer.state == 'playing' ? 'play' : 'loading'" :filled="playNow.isPlaying || castPlayer.state == 'playing'" />
								</div>
							</Transition>
							<div class="radioStation-inner flex ai-c">
								<img v-if="station.favicon && !station.favicon.includes('http://')" :src="station.favicon" />
								<div class="stationInfo">
									<h3>{{ station.name }}</h3>
									<div v-if="station.hls || station.countrycode || station.bitrate || station.codec" class="stationTags">
										<span v-if="station.hls" class="stationTag"><strong>HLS</strong></span>
										<span v-if="station.countrycode" class="stationTag">{{ station.countrycode }}</span>
										<span v-if="station.bitrate" class="stationTag">{{ station.bitrate }}kb/s</span>
										<span v-if="station.codec && station.codec != 'UNKNOWN'" class="stationTag">{{ station.codec }}</span>
									</div>
								</div>
							</div>
						</a>
						<div v-if="station?.source == 'user'" class="radioList-buttons flex ai-c">
							<button class="unstyledBtn" @click.stop="editStation(station)" :title="textEditStation">
								<Icon icon="edit" />
							</button>
							<button class="unstyledBtn rm-hide" @click.stop="$emit('toggleFav', station)" :title="textFavsRemove">
								<Icon icon="trash" />
							</button>
						</div>
						<div v-else class="radioList-buttons flex ai-c">
							<button class="unstyledBtn rm-hide" @click.stop="showInfo(station)" :title="textInfo">
								<Icon icon="info2" />
							</button>
							<button class="unstyledBtn" @click.stop="$emit('toggleFav', station)" :title="favs.some(fav => fav.stationuuid == station.stationuuid) ? textFavsRemove : textFavsAdd">
								<Icon icon="star" :filled="favs.some(fav => fav.stationuuid == station.stationuuid)" />
							</button>
						</div>
						<!-- <div class="invisible">{{ station }}</div> -->
					</li>
					<li v-if="hasmore" ref="loadMoreTrigger">
						<div class="loadMoreTrigger" @click.prevent="$emit('loadmore')" :class="{disabled: loadingmore}"><Icon :icon="loadingmore ? 'loading' : 'plus'" />{{ loadingmore ? $t('loading') : $t('loadMore') }}</div>
					</li>
				</ul>
				<div v-else class="radioList-empty">
					<div class="radioList-icon">
						<Icon icon="alert" />
					</div>
					<h2 class="radioList-title">{{ empty || $t('emptyList') }}</h2>
					<p v-if="showReturn">
						<button @click.prevent="$emit('return')" class="bttn">
							<span class="autoInvert">
								<Icon icon="left" />{{ $t('returnToList') }}
							</span>
						</button>
					</p>
				</div>
			</SmoothFadeTransition>
		</div>
	</div>
</template>
