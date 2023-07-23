<script setup>
	import { computed, inject } from 'vue'
	import { favs, editStation } from '../../store'
	import { languagesMap } from '../../lang/i18n'

	import Icon from '../Icon.vue'

	const props = defineProps(['data'])

	const locale = inject('locale')

	const emit = defineEmits(['loadlist', 'toggleFav'])

	let languages = computed(() => {
		return props.data.language.split(',')
	})
	let tags = computed(() => {
		return props.data.tags.split(',')
	})
	let isFav = computed(() => {
		return favs.value.some(fav => fav.stationuuid == props.data.stationuuid)
	})

	function getLocaleCountry(countryCode) {
		let countryNames = new Intl.DisplayNames([locale.value], {type: 'region'})
		return countryNames.of(countryCode)
	}

	let languageName = new Intl.DisplayNames([locale.value], {type: 'language'})
	function getLocaleLanguage(language) {
		return languagesMap[language] ? languageName.of(languagesMap[language]).toLocaleLowerCase() : language
	}

	function emitList(type, value, countryCode) {
		// info.show = false
		let obj = {
			name: value
		}
		if (countryCode) obj.iso_3166_1 = countryCode
		else if (type == 'language' && languagesMap[value]) obj.iso_639 = languagesMap[value]
		emit('loadlist', type, obj)
	}
</script>
<template>
	<div class="stationModalInfo">
		<div v-if="data.favicon && data.favicon.includes('https://')" class="stationModalInfo-line">
			<img class="stationModalInfo-img" :src="data.favicon" alt="">
		</div>
		<div class="stationModalInfo-line">
			<h2>{{ data.name }}</h2>
		</div>
		<div class="stationModalInfo-line">
			<button v-if="data.source != 'user'" @click="$emit('toggleFav', data)" class="bttn">
				<span class="autoInvert">
					<Icon icon="star" :filled="isFav" />
					{{ isFav ? $t('favsRemove') : $t('favsAdd') }}
				</span>
			</button>
			<button v-else @click="editStation(data)" class="bttn">
				<span class="autoInvert">
					<Icon icon="edit" />
					{{ $t('editStation') }}
				</span>
			</button>
		</div>
		<div v-if="data.homepage" class="stationModalInfo-line">
			<div class="stationModalInfo-title">{{ $t('website') }}</div>
			<div class="stationModalInfo-info"><a :href="data.homepage" target="_blank">{{ data.homepage }}</a></div>
		</div>
		<div v-if="(data.codec && data.codec != 'UNKNOWN') || data.bitrate" class="stationModalInfo-line">
			<div class="stationModalInfo-title">{{ $t('codec') }}</div>
			<div class="stationModalInfo-info stationModalInfo-info-parts">
				<span v-if="data.codec" class="stationModalInfo-info-part">{{ data.codec }}</span>
				<span v-if="data.bitrate" class="stationModalInfo-info-part">{{ data.bitrate }}kbps</span>
			</div>
		</div>
		<div v-if="data.country" class="stationModalInfo-line">
			<div class="stationModalInfo-title">{{ $t('country') }}</div>
			<div class="stationModalInfo-info smallBttnList">
				<button class="bttnSmall" @click="emitList('country', data.country, data.countrycode)">
					{{ getLocaleCountry(data.countrycode) }}
				</button>
			</div>
		</div>
		<div v-if="data.language" class="stationModalInfo-line">
			<div class="stationModalInfo-title">{{ $t('language') }}</div>
			<div class="stationModalInfo-info smallBttnList">
				<button v-for="lang in languages" class="bttnSmall" @click="emitList('language', lang)">
					{{ getLocaleLanguage(lang) }}
				</button>
			</div>
		</div>
		<div v-if="data.tags" class="stationModalInfo-line">
			<div class="stationModalInfo-title">{{ $t(tags.length > 1 ? 'tags' : 'tag') }}</div>
			<div class="stationModalInfo-info smallBttnList">
				<button v-for="tag in tags" class="bttnSmall" @click="emitList('tag', tag)">
					{{ tag }}
				</button>
			</div>
		</div>
		<div class="invisible">{{ data }}</div>
	</div>
</template>