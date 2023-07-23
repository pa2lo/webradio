<script setup>
	import { ref, onBeforeMount, computed } from 'vue'
	import { favs } from '../../store'
	import { getTimestampUUID } from '../../helpers'
	import TextInput from '../TextInput.vue'
	import Icon from '../Icon.vue'
	import SwitchInput from '../SwitchInput.vue'

	const props = defineProps(['data'])

	let stationData = ref({})
	let showErrors = ref(false)
	let editStation = props.data ? true : false

	onBeforeMount(() => {
		if (props.data) {
			stationData.value = JSON.parse(JSON.stringify(props.data))
		} else {
			stationData.value = {
				source: 'user',
				name: '',
				url: '',
				favicon: '',
				hls: 0
			}
		}
	})

	const emit = defineEmits(['saveStation', 'removeStation'])

	function saveStation(e) {
		if (!stationData.value.stationuuid) stationData.value.stationuuid = getTimestampUUID()
		if (!stationData.value.name || !stationData.value.url || (favs.value.some(fav => fav.url == stationData.value.url) && !editStation)) {
			showErrors.value = true
			return
		}

		emit('saveStation', stationData.value)
	}

	let stationUrlError = computed(() => {
		if (showErrors.value) {
			if (!stationData.value.url) return 'streamUrlRequired'
			if (favs.value.some(fav => fav.url == stationData.value.url)) return 'streamUrlExist'
		}
		return false
	})
</script>

<template>
	<div class="addStationForm">
		<TextInput v-model="stationData.name" :title="$t('stationName')" :placeholder="$t('stationNamePlaceholder')" :error="showErrors && !stationData.name ? $t('stationNameRequired') : ''" />
		<TextInput class="mt1" v-model="stationData.url" :title="$t('streamUrl')" :placeholder="$t('stationUrlPlaceholder')" :error="showErrors && stationUrlError ? $t(stationUrlError) : ''" />
		<TextInput class="mt1" v-model="stationData.favicon" image :title="$t('stationImage')" :placeholder="$t('stationImagePlaceholder')" />
		<SwitchInput class="mt1" title="HLS" :value="1" v-model="stationData.hls" />
		<div class="addStationButtons">
			<button @click.prevent="saveStation" class="bttn" :class="{disabled: !stationData.name || !stationData.url}">
				<span class="autoInvert" :title="!stationData.name || !stationData.url ? $t('addStationButtonTitle') : ''">
					<Icon icon="save" />
					{{ $t('addStation') }}
				</span>
			</button>
			<button @click.prevent="$emit('removeStation', stationData)" v-if="editStation" class="bttn bttnDelete">
				<Icon icon="trash" />
				{{ $t('deleteStation') }}
			</button>
		</div>
		<!-- {{ stationData }} -->
	</div>
</template>