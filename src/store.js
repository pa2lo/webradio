import { reactive } from 'vue'
import { useStorage } from './composables/useStorage'

let storedStation = localStorage.getItem('lastStation')
let storedStationData = storedStation ? JSON.parse(storedStation) : false

export const playNow = reactive({
	station: storedStationData ? storedStationData : false,
	uuid: storedStationData ? storedStationData.stationuuid : false,
	artwork: storedStationData && storedStationData.favicon && storedStationData.favicon.includes('https:') ? storedStationData.favicon : false,
	title: false,
	isPlaying: false,
	isLoading: false,
	hasVideo: false
})

export const favs = useStorage('favs', [])

export const timerSettings = reactive({
	show: false,
	active: false
})

export const appSettings = {
	httpsOnly: useStorage('httpsonly', false),
	volume: useStorage('volume', 1),
	color: useStorage('hue', 230),
	lang: useStorage('lang', ''),
	theme: useStorage('theme', '')
}

export const filterData = reactive({
	countries: [],
	languages: [],
	tags: []
})

/* streaming */
export const castPlayer = reactive({
	state: 'disconnected',
	connected: false,
	isAvailable: false,
	device: null
})
export const airplayPlayer = reactive({
	isAvailable: false,
	streaming: false
})

/* actions */
export const dynamicModal = reactive({
	type: null,
	show: false,
	data: null,
	key: null
})
export function showModal(type, data = null) {
	dynamicModal.type = type
	dynamicModal.show = true
	dynamicModal.data = data
	dynamicModal.key = Date.now()
}
export function showInfo(station) {
	showModal('info', station)
}
export function editStation(station) {
	showModal('editStation', station)
}