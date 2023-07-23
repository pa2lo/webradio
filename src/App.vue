<script setup>
	import { ref, reactive, onMounted, onBeforeUnmount, computed, inject } from 'vue'
	import { playNow, favs, timerSettings, appSettings, showModal, filterData, castPlayer, airplayPlayer } from './store.js'

	import { localizeCountries, localizeLanguages, getNavigatorLang } from './lang/i18n'
	import { i18nLocale } from './translate'

	import { client, isSafari, isiOS } from './helpers'

	import Icon from './components/Icon.vue'
	import RadioList from './components/RadioList.vue'
	import Player from './components/Player.vue'
	import Timer from './components/Timer.vue'
	import Modal from './components/Modal.vue'
	import SimpleList from './components/SimpleList.vue'
	import SmoothFadeTransition from './components/SmoothFadeTransition.vue'
	import Menu from './components/Menu.vue'
	import DynamicModal from './components/DynamicModal.vue'
	import MenuLink from './components/MenuLink.vue'
	import VideoControls from './components/VideoControls.vue'
	import SwitchInput from './components/SwitchInput.vue'

	const SHOW_LOGS = false

	const toaster = inject('toaster')
	const t = inject('t')

	/* variables */
	let browserTab = ref(favs.value.length ? 'fav' : 'all')
	let tabRefs = reactive({
		container: null,
		all: null,
		search: null,
		fav: null,
		recent: null,
		browser: null
	})
	let stations = reactive({
		list: [],
		history: [],
		loading: true,
		hasmore: false,
		loadingmore: false,
		filter: '',
		type: 'language',
		value: null,
		valueTranslate: null
	})
	let settings = reactive({
		showListSelect: false,
		showMenu: false,
		listTab: 'country'
	})

	/* audio player */
	const audio = ref(null)

	let forceSilence = false
	let silenceBlob = ''

	const audioEvents = {
		waiting: (e) => {
			if (SHOW_LOGS) console.log('event waiting')
			if (!audio.value.src.startsWith('data:')) {
				playNow.isPlaying = false
				playNow.isLoading = true
			}
		},
		playing: (e) => {
			if (SHOW_LOGS) console.log('event playing')
			if (audio.value.src.startsWith('data:')) {
				audio.value.pause()
			} else {
				playNow.isPlaying = true
				playNow.isLoading = false
				updateTitle()
				if (playNow.station.source == "radio-browser") clickStationCount(playNow.station.stationuuid)
			}
			playNow.hasVideo = audio.value.videoHeight > 0
		},
		play: (e) => {
			if (SHOW_LOGS) console.log('event play')
			if (!audio.value || !audio.value.src) return
			if (audio.value.src.startsWith('data:') && !forceSilence) play()
		},
		error: (ev) => {
			playNow.isPlaying = false
			playNow.isLoading = false

			if (audio.value && audio.value.src == window.location.href) return

			let s = ""
			let message = ''
			const err = audio.value.error

			if (navigator.onLine) {
				switch(err.code) {
					case MediaError.MEDIA_ERR_ABORTED:
						s += "The user canceled the audio.";
						break;
					case MediaError.MEDIA_ERR_NETWORK:
						s += "A network error occurred while fetching the audio.";
						if (!resumePlayback) resumePlayback = true
						break;
					case MediaError.MEDIA_ERR_DECODE:
						s+= "An error occurred while decoding the audio.";
						break;
					case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
						s+= "The audio is missing or is in a format not supported by your browser.";
						break;
					default:
						s += "An unknown error occurred.";
						break;
				}

				message = err.message
			} else s = t('offlineError')

			toaster.error(s, {
				message: message ?? false
			})
		},
		pause: (e) => {
			if (SHOW_LOGS) console.log('event pause')
			if (audio.value && audio.value.src.startsWith('data:')) forceSilence = false
			else abort()
		},
		loadeddata: (e) => {
			if (SHOW_LOGS) console.log('event loadeddata')
			if (!audio.value.src.startsWith('data:')) audio.value.play()
		},
		loadstart: (e) => {
			if (SHOW_LOGS) console.log('audio loadstart')
			if (!audio.value.src.startsWith('data:')) {
				playNow.isPlaying = false
				playNow.isLoading = true
			}
		},
		loadedmetadata: (e) => {
			if (SHOW_LOGS) console.log('event loadedmetadata')
		}
	}

	function setPlayNow(station) {
		if (SHOW_LOGS) console.log('function setPlayNow')
		playNow.station = station
		playNow.uuid = station.stationuuid
		playNow.title = false
		cachedTitle = ''
		setArtwork()
		updateTitleEl()
		if (updateTitleTimeout) clearTimeout(updateTitleTimeout)

		let historyIndex = stations.history.findIndex(h => h.stationuuid == station.stationuuid)
		if (browserTab.value == 'recent' && historyIndex > -1) return
		if (historyIndex > -1) stations.history.splice(historyIndex, 1)
		stations.history.unshift(station)
	}

	function setRadio(station, scrollintoview = false) {
		if (SHOW_LOGS) console.log('function setRadio')
		if (playNow.uuid == station.stationuuid && playNow.isPlaying) return
		if (hls) destroyHls()
		if (playNow.uuid != station.stationuuid) setPlayNow(station)
		if (castPlayer.connected) playNow.station.url == castSender.src ? castSender.play() : castStream()
		else play()

		localStorage.setItem('lastStation', JSON.stringify(station))

		if (scrollintoview && typeof document.body.scrollIntoViewIfNeeded == 'function') {
			let element = document.querySelector('.radioStation.current')
			if (element) element.scrollIntoViewIfNeeded()
		}
	}

	function play() {
		if (SHOW_LOGS) console.log('function play')
		if (!playNow.station.url) return
		if (!playNow.station.hls) {
			audio.value.src = playNow.station.url.indexOf('?') > -1 ? playNow.station.url : `${playNow.station.url}?${Date.now()}`
			audio.value.load()
		} else {
			if (!Hls) lazyImportHLS(true)
			else playHls()
		}
		setMediaInfo()
	}

	function abort() {
		if (SHOW_LOGS) console.log('function abort')
		if (hls) destroyHls()
		if (audio.value && !isiOS) {
			audio.value.src = silenceBlob
			if (!castPlayer.connected && !airplayPlayer.streaming) {
				forceSilence = true
				audio.value.play()
			}
		}
		playNow.isPlaying = false
		playNow.isLoading = false
		playNow.title = false
		cachedTitle = ''
		clearTimeout(updateTitleTimeout)
		setMediaInfo()

		if (document.fullscreenElement || document.webkitFullscreenElement) toggleMaximize()
	}

	function stop() {
		if (SHOW_LOGS) console.log('function stop')
		if (castPlayer.connected) castSender.pause()
		else audio.value.pause()
		if (resumePlayback) resumePlayback = false
	}

	function toggle() {
		if (castPlayer.connected) {
			castPlayer.state == 'playing' || castPlayer.state == 'buffering' ? castSender.pause() : castSender.play()
		} else {
			if (playNow.isLoading) abort()
			else playNow.isPlaying ? stop() : play()
		}
	}

	function prev() {
		if (!playNow.station.url) return
		let { list, index } = getCurrentListIten()
		if (!list.length) return
		if (index > 0) setRadio(list[index - 1], true)
		else setRadio(list[list.length - 1], true)
	}
	function next() {
		if (!playNow.station.url) return
		let { list, index } = getCurrentListIten()
		if (!list.length) return
		let maxindex = list.length - 1
		if (index > -1 && index < maxindex) setRadio(list[index + 1], true)
		else setRadio(list[0], true)
	}
	function getCurrentListIten() {
		let list
		if (browserTab.value == 'search' && search.list.length > 1) list = search.list
		else if (browserTab.value == 'recent' && stations.history.length > 1) list = stations.history
		else if (browserTab.value == 'fav' && favs.value.length > 1) list = favs.value
		else {
			list = filteredStations.value
			if (browserTab.value != 'all') showListTab(null, true)
		}

		let index = list.findIndex(item => item.stationuuid == playNow.uuid)

		return { list, index }
	}

	let volumeCache = 1
	function toggleMute() {
		if (appSettings.volume.value > 0) {
			volumeCache = appSettings.volume.value
			appSettings.volume.value = 0
		} else appSettings.volume.value = volumeCache
	}

	/* radio-browser click */
	function clickStationCount(uuid) {
		client(`https://at1.api.radio-browser.info/json/url/${uuid}`)
	}

	/* HLS */
	let hls = undefined
	let Hls = undefined
	let hlsLevels = ref(null)
	let hlsCurrentLevel = ref(null)
	function destroyHls() {
		if (SHOW_LOGS) console.log('function destroyHls')
		if (!hls) return
		playNow.hasVideo = false
		hls.destroy()
		hls = undefined
	}
	function getHlsLevel() {
		if (!hls) return
	}
	function setHlsLevel(level) {
		if (!hls) return
		hls.loadLevel = level
	}
	function playHls() {
		if (SHOW_LOGS) console.log('function playHls')
		if (Hls.isSupported()) {
			hls = new Hls()

			hls.on(Hls.Events.MANIFEST_LOADED, (a, b) => {
				hlsLevels.value = hls.levels
				hlsCurrentLevel.value = hls.currentLevel
			})

			hls.on(Hls.Events.LEVEL_SWITCHED, (a, b) => {
				hlsCurrentLevel.value = b.level
			})

			hls.on(Hls.Events.ERROR, (a, data) => {
				if (!navigator.onLine) {
					toaster.error(t('offlineError'))
					abort()
					return
				}

				if (data.fatal) {
					switch (data.details) {
						case Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT:
						case Hls.ErrorDetails.FRAG_LOAD_TIMEOUT:
						case Hls.ErrorDetails.LEVEL_LOAD_TIMEOUT:
						toaster.error('Timeout', {
							message: 'Sorry, your network connection seems to be too slow at the moment.'
						})
						break;

						default:
						toaster.error('Failed to play', {
							message: `Sorry, stream cannot be played due to a ${data.type === Hls.ErrorTypes.NETWORK_ERROR ? 'network error' : data.type === Hls.ErrorTypes.MEDIA_ERROR ? 'media error' : 'HLS error'}.`
						})
					}

					abort()
				}
			})

			hls.loadSource(window.location.protocol === "https:" ? playNow.station.url.replace("http:", "https:") : playNow.station.url)

			hls.attachMedia(audio.value)
		}
	}

	/* media info */
	let favicoEl = document.querySelector('link[rel="icon"][sizes="any"]')
	let titleEl = document.querySelector('head title')
	function setArtwork(artwork) {
		if (playNow.station.favicon && playNow.station.favicon.includes('https:')) {
			playNow.artwork = playNow.station.favicon
		} else {
			playNow.artwork = false
		}
		updateFaviconEl()
	}
	function updateTitleEl() {
		titleEl.textContent = `WebRadio - ${playNow.station.name}`
	}
	function updateFaviconEl() {
		favicoEl.href = playNow.artwork ? playNow.artwork : '/icon/favicon.png'
	}

	let updateTitleTimeout
	let cachedTitle = ''
	let artworkIterator = 1
	const { mediaSession } = navigator
	function setMediaInfo(title) {
		if (artworkIterator == 1) artworkIterator = 2
		else artworkIterator = 1

		let artWorkImg256 = playNow.artwork || `/assets/logo256-i${artworkIterator}.png`

		if (mediaSession !== undefined) {
			mediaSession.metadata = new MediaMetadata({
				title: title ?? playNow.station.name.trim(),
				artist: title ? playNow.station.name.trim() : undefined,
				album: 'WebRadio',
				artwork: [
					{
						src: artWorkImg256,
						sizes: '256x256',
						type: 'image/png'
					}
				]
			})

			mediaSession.setActionHandler('play', play);
			mediaSession.setActionHandler('pause', stop);
			mediaSession.setActionHandler('previoustrack', prev);
			mediaSession.setActionHandler('nexttrack', next);
		}
	}
	function getTitle() {
		let updateTitleStationUuid = JSON.parse(JSON.stringify(playNow.station.stationuuid))
		client(`https://webradioservice.pa2lo.net/`, {stream: playNow.station.url}, true)
		.then(data => {
			if (playNow.isLoading || !playNow.isPlaying) return
			if (data?.title) {
				if (cachedTitle != data.title && updateTitleStationUuid == playNow.station.stationuuid && playNow.isPlaying) {
					playNow.title = data.title
					cachedTitle = data.title
					setMediaInfo(data.title)
				}
				updateTitleTimeout = setTimeout(() => {
					getTitle()
				}, 10000);
			} else playNow.title = false
		})
		.catch(err => {
			console.log(err)
			playNow.title = false
		})
	}
	function updateTitle() {
		if (!playNow.station.url) return
		if (!hls) getTitle()
	}

	/* on load */
	let keyCodesArray = ['Space', 'ArrowUp', 'ArrowDown']
	function handleKeys(ev) {
		if (document.activeElement.matches('input')) return
		if (keyCodesArray.includes(ev.code)) ev.preventDefault()
		if (ev.code == 'Space') toggle()
		if (ev.code == 'KeyN' || ev.code == 'ArrowRight') next()
		if (ev.code == 'KeyP' || ev.code == 'ArrowLeft') prev()
		if (ev.code == 'KeyF' && playNow.station) toggleFav(playNow.station)
		if (ev.code == 'KeyS') timerSettings.show = true
		if (ev.code == 'KeyM') toggleMute()
		if (ev.code == 'ArrowUp' && appSettings.volume.value < 1) appSettings.volume.value = Math.min((+appSettings.volume.value + 0.1), 1)
		if (ev.code == 'ArrowDown' && appSettings.volume.value > 0) appSettings.volume.value = Math.max((+appSettings.volume.value - 0.1), 0)
	}

	let isOnline = ref(navigator.onLine)
	let resumePlayback = false
	let resumeSearch = false
	function handleOffline() {
		toaster.error(t('offlineError'))
		checkOnline()
		if (playNow.isPlaying || playNow.isLoading) resumePlayback = true
	}
	function handleOnline() {
		checkOnline()
		if (isOnline.value && resumePlayback) {
			resumePlayback = false
			play()
		}
		if (resumeSearch && browserTab.value == 'search') {
			initSearch()
			resumeSearch = false
		}
	}
	function checkOnline() {
		isOnline.value = navigator.onLine
	}

	async function awaitImportSilence() {
		let { silence } = await import('./silence/silence')
		silenceBlob = silence
	}
	async function lazyImportHLS(play) {
		playNow.isLoading = true
		let { default: HlsImport } = await import('hls.js')
		Hls = HlsImport
		if (play) playHls()
	}

	onMounted(() => {
		checkOnline()
		let stationsCacheTimestamp = localStorage.getItem('stationsCacheTimestamp')
		if (stationsCacheTimestamp && (Date.now() - parseInt(stationsCacheTimestamp) < (24 * 60 * 60 * 1000))) loadStationsCache()
		else {
			if (stationsCacheTimestamp) clearStationsCache()
			if (browserTab.value == 'all') fetchStations(true)
		}

		if (localStorage.getItem('lastStation')) {
			stations.history.unshift(JSON.parse(localStorage.getItem('lastStation')))
			updateFaviconEl()
			updateTitleEl()
		}

		document.body.addEventListener('keydown', handleKeys)

		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault()
			setInstallPrompt(e)
		})

		audio.value.volume = parseFloat(appSettings.volume.value)

		awaitImportSilence()

		if ('onfullscreenchange' in document) document.addEventListener('fullscreenchange', handleFullScreenChange)
		else if ('onwebkitfullscreenchange' in document) document.addEventListener('webkitfullscreenchange', handleFullScreenChange)

		window.addEventListener('offline', handleOffline)
		window.addEventListener('online', handleOnline)

		if (window.chrome && !window.chrome.cast) initGCast()

		if (window.WebKitPlaybackTargetAvailabilityEvent) initAirplay()
	})

	onBeforeUnmount(() => {
		if (playNow.isPlaying) stop()
		document.body.removeEventListener('keydown', handleKeys)

		if (castPlayer.connected) castSender.disconnect()

		if ('onfullscreenchange' in document) document.removeEventListener('fullscreenchange', handleFullScreenChange)
		else if ('onwebkitfullscreenchange' in document) document.removeEventListener('webkitfullscreenchange', handleFullScreenChange)

		window.removeEventListener('offline', handleOffline)
		window.removeEventListener('online', handleOnline)
	})

	/* airplay */
	function initAirplay() {
		audio.value.addEventListener('webkitplaybacktargetavailabilitychanged', (event) => {
			switch (event.availability) {
				case "available":
					airplayPlayer.isAvailable = true
					break;
				case "not-available":
					airplayPlayer.isAvailable = false
					break;
			}
		})

		audio.value.addEventListener('webkitcurrentplaybacktargetiswirelesschanged', (event) => {
			airplayPlayer.streaming = event.target.webkitCurrentPlaybackTargetIsWireless
		})
	}
	function selectAriplayDevice() {
		audio.value.webkitShowPlaybackTargetPicker()
	}

	/* google cast */
	let castSender = null
	function initGCast() {
		window['__onGCastApiAvailable'] = async function(isAvailable) {
			if (isAvailable) castPlayer.isAvailable = true
		}

		var script = document.createElement('script');
		script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
		document.head.appendChild(script);
	}
	async function initCastSender() {
		let { Castjs } = await import('../src/castjs');
		castSender = new Castjs();

		castSender.on('statechange', () => {
			if (castPlayer.state == 'buffering' && castSender.state == 'ended') return

			castPlayer.state = castSender.state
		})
		castSender.on('pause', () => {
			castPlayer.state = 'paused'
		})
		castSender.on('connect', () => {
			castPlayer.connected = true
			castPlayer.state = 'buffering'
			castPlayer.device = castSender.device
			if (playNow.isPlaying || playNow.isLoading) abort()
		})
		castSender.on('disconnect', () => {
			castPlayer.connected = false
			castPlayer.device = null
			castPlayer.state = 'disconnected'
		})
		castSender.on('error', (e) => {
			if (castPlayer.state == 'buffering') castPlayer.state = castSender.state
			toaster.error('Streaming error', {
				message: e ?? false
			})
		})

		return castSender
	}
	async function toggleCasting() {
		if (!castSender) await initCastSender()

		castPlayer.connected ? castSender.disconnect() : castStream()
	}
	function castStream() {
		// castSender.pause()
		if (castPlayer.connected) castPlayer.state = 'buffering'
		castSender.cast(playNow.station.url, {
			title: playNow.station.name,
			poster: playNow.artwork ? playNow.artwork : null
		})
	}

	/* tabs */
	function setTab(tab, skipClosePlayer) {
		if (window.location.hash == '#player' && !skipClosePlayer) history.back()

		if (settings.showMenu) settings.showMenu = false
		if (browserTab.value == tab) return

		browserTab.value = tab

		let button = tabRefs[tab]
		let parent = tabRefs.container

		let buttonOffset = button.offsetLeft,
			buttonWidth = button.clientWidth,
			containerOffset = parent.scrollLeft,
			containerWidth = parent.clientWidth

		if (buttonOffset < containerOffset) parent.scrollLeft = (buttonOffset - 32)
		else if ((buttonOffset + buttonWidth) > (containerOffset + containerWidth)) parent.scrollLeft = buttonOffset - 32
	}
	function setTabAfterEnter() {
		if (tabRefs.browser.scrollTop > 0) tabRefs.browser.scrollTop = 0
	}
	function showListTab(e, skipClosePlayer = false) {
		if (!stations.list.length && stations.loading) fetchStations(true)
		setTab('all', skipClosePlayer)
	}
	function showListSelect() {
		if (!filterData.countries.length) fetchData()
		settings.showListSelect = true
	}
	function showSearchTab() {
		if (browserTab.value == 'search') return
		if (isOnline.value) initSearch()
		else resumeSearch = true
		setTab('search')
	}

	/* stations */
	function toggleFav(station) {
		let index = favs.value.findIndex(fav => fav.stationuuid == station.stationuuid)
		if (index > -1) {
			favs.value.splice(index, 1)
			toaster.info(`${t('station')} <strong>${station.name}</strong> ${t('removedFromFavs')}.`, {
				onClick: () => setTab('fav')
			})
		} else {
			favs.value.push(station)
			toaster.success(`${t('station')} <strong>${station.name}</strong> ${t('addedToFavs')}.`, {
				onClick: () => setTab('fav')
			})
		}
	}

	function saveStation(station) {
		let index = favs.value.findIndex(fav => fav.stationuuid == station.stationuuid)
		if (index > -1) {
			Object.assign(favs.value[index], station)
			toaster.success(`${t('station')} <strong>${station.name}</strong> ${t('stationEdited')}.`)
		} else {
			favs.value.push(station)
			toaster.success(`${t('station')} <strong>${station.name}</strong> ${t('addedToFavs')}.`)
		}
		setTab('fav')
	}

	let filteredStations = computed(() => {
		if (!stations.filter) return stations.list
		return stations.list.filter((station) => station.name.toLowerCase().includes(stations.filter.toLowerCase()))
	})

	function fetchStations() {
		let navigatorLang = getNavigatorLang()
		if ( navigatorLang == 'cs' || navigatorLang == 'sk' ) {
			let tempStations = []

			function getCZStations() {
				return client('https://at1.api.radio-browser.info/json/stations/search?language=czech&hidebroken=true')
			}
			function getSKStations() {
				return client('https://at1.api.radio-browser.info/json/stations/search?language=slovak&hidebroken=true')
			}

			Promise.all([getCZStations(), getSKStations()]).then(result => {
				tempStations = reduceRadioList([...result[0], ...result[1]])
				stations.list = tempStations.sort((a, b) => a.name.localeCompare(b.name))
				stations.loading = false
				saveStationsCache()
			})
		} else {
			let langConvert = new Intl.DisplayNames('en', {type: 'language'})

			loadlist('language', {
				iso_639: navigatorLang,
				name: langConvert.of(navigatorLang).toLocaleLowerCase()
			}, true)
		}
	}

	function fetchData() {
		client('https://at1.api.radio-browser.info/json/countries').then(data => {
			filterData.countries = data.map((v) => ({...v, flag: `https://flagcdn.com/w20/${v.iso_3166_1.toLowerCase()}.png`}))
			localizeCountries()
		})
		client('https://at1.api.radio-browser.info/json/languages').then(data => {
			filterData.languages = data
			localizeLanguages()
		})
		client('https://at1.api.radio-browser.info/json/tags?order=stationcount&reverse=true').then(data => filterData.tags = data)
	}

	function loadlist(type, item, onInit = false) {
		settings.showListSelect = false
		stations.loading = true
		stations.loadingmore = false
		stations.type = type
		stations.value = item?.name ? item.name : item
		if (type == 'language' && item.iso_639) stations.valueTranslate = item.iso_639
		else if (type == 'country' && item.iso_3166_1) stations.valueTranslate = item.iso_3166_1
		else stations.valueTranslate = null
		stations.filter = ''
		let filter = {
			order: type == 'tag' ? 'clickcount' : 'name',
			reverse: type == 'tag',
			[type]: item?.name ? item.name : item
		}
		getStations(stations, filter, 100, false, onInit)
		if (!onInit) setTab('all')
	}
	function loadmore() {
		stations.loadingmore = true
		let filter = {
			[stations.type]: stations.value
		}
		getStations(stations, filter, 100, stations.list.length)
	}
	function getStations(ref, filter, limit = 20, offset, saveToLs) {
		let params = {
			...filter,
			offset: offset ?? 0,
			limit: limit,
			hidebroken: true,
		}
		client('https://at1.api.radio-browser.info/json/stations/search', params).then((data) => {
			let list = data

			if (list.length) list = reduceRadioList(list)

			ref.hasmore = data.length == limit

			if (offset) ref.list = [...ref.list, ...list]
			else ref.list = list

			ref.loading = false
			ref.loadingmore = false

			if (saveToLs) saveStationsCache()
		})
	}
	function reduceRadioList(list) {
		return list.reduce((acc, item) => {
			let { stationuuid, name, url_resolved: url, homepage, favicon, tags, country, countrycode, language, votes, codec, bitrate, hls, clickcount } = item
			acc.push({ source: 'radio-browser', stationuuid, name, url, homepage, favicon, tags, country, countrycode, language, votes, codec, bitrate, hls, clickcount })
			return acc
		}, [])
	}

	/* stations cache */
	function clearStationsCache() {
		localStorage.removeItem('stationsCache')
		localStorage.removeItem('stationsCacheTimestamp')
	}
	function loadStationsCache() {
		let stationsCache = JSON.parse(localStorage.getItem('stationsCache'))
		Object.assign(stations, stationsCache)
		stations.loading = false
	}
	function saveStationsCache() {
		let stationsCache = {
			list: stations.list,
			hasmore: stations.hasmore,
			value: stations.value,
			valueTranslate: stations.valueTranslate
		}
		localStorage.setItem('stationsCache', JSON.stringify(stationsCache))
		localStorage.setItem('stationsCacheTimestamp', new Date().getTime())
	}

	/* search */
	let search = reactive({
		list: [],
		filter: {
			name: '',
			country: '',
			language: '',
			order: 'clickcount',
			reverse: true,
			tag: '',
			is_https: null
		},
		loading: true,
		hasmore: false,
		loadingmore: false,
		expanded: false
	})

	function initSearch() {
		if (!filterData.countries.length) fetchData()
		if (!search.init) {
			search.init = true,
			searchStation()
		}
	}

	let searchDebounce = null
	let searchTagDebounce = null
	function debounceSearchStation() {
		clearTimeout(searchDebounce)
		searchDebounce = setTimeout(() => {
			searchStation()
		}, 600)
	}
	function searchTagInput(e) {
		if (e.inputType == 'insertText' || e.inputType == 'deleteContentBackward') {
			clearTimeout(searchTagDebounce)
			searchTagDebounce = setTimeout(() => {
				searchStation()
			}, 600)
		} else searchStation()
	}
	function searchStation() {
		search.loading = true
		search.loadingmore = false
		getStations(search, search.filter, 20, false)
	}
	function searchLoadmore() {
		search.loadingmore = true
		getStations(search, search.filter, 20, search.list.length)
	}
	function setSearchOrder(e) {
		let order = e.target.value
		search.filter.order = order
		if (order == 'clickcount') search.filter.reverse = true
		else search.filter.reverse = false
		searchStation()
	}
	function resetSearchName() {
		search.filter.name = ''
		searchStation()
	}
	function setSearchHttps(e) {
		search.filter.is_https = e.target.checked ? true : null
		searchStation()
	}

	/* app install */
	let showSafariInstallHelp = isiOS && isSafari && !navigator.standalone
	let installPrompt = ref(null)
	function setInstallPrompt(e) {
		if (installPrompt.value) return
		installPrompt.value = e
		toaster.info(t('installApp'), {
			duration: 15000,
			onClick: () => installApp()
		})
	}
	function installApp() {
		if (!installPrompt.value) return
		installPrompt.value.prompt()
		installPrompt.value.userChoice.then(outcome => {
			if (outcome === 'accepted') installPrompt.value = null
		})
	}

	/* translations */
	const currentListTranslatedValue = computed(() => {
		if (!stations.valueTranslate) return stations.value
		if (stations.type == 'language') return new Intl.DisplayNames([i18nLocale.value], {type: 'language'}).of(stations.valueTranslate).toLocaleLowerCase()
		else if (stations.type == 'country') return new Intl.DisplayNames([i18nLocale.value], {type: 'region'}).of(stations.valueTranslate)
	})

	let textList = computed(() => t('list'))
	let textFavs = computed(() => t('favs'))
	let textSearch = computed(() => t('search'))
	let textRecent = computed(() => t('recent'))
	let textTimerTitle = computed(() => t('timer.title'))
	let textCommands = computed(() => t('commands'))
	let textSettings = computed(() => t('settings'))
	let textAbout = computed(() => t('about'))
	let textInstall = computed(() => t('install'))
	let textAddStation = computed(() => t('addCustom'))
	let textStartStreaming = computed(() => t('startStreaming'))
	let textStopStreaming = computed(() => t('stopStreaming'))


	/* video */
	let videoCont = ref(null)
	function toggleMaximize() {
		if (document.fullscreenElement || document.webkitFullscreenElement) {
			if ('exitFullscreen' in document) document.exitFullscreen()
			else if ('webkitExitFullscreen' in document) document.webkitExitFullscreen()
		} else {
			if (videoCont.value.requestFullscreen) {
				videoCont.value.requestFullscreen({navigationUI: 'hide'})
			} else if (videoCont.value.mozRequestFullScreen) {
				videoCont.value.mozRequestFullScreen()
			} else if (videoCont.value.webkitRequestFullScreen) {
				videoCont.value.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT)
			}
		}
	}
	function handleFullScreenChange(e) {
		if ('onfullscreenchange' in document) playNow.fullScreen = document.fullscreenElement ? true : false
		else if ('onwebkitfullscreenchange' in document) playNow.fullScreen = document.webkitFullscreenElement ? true : false
	}

	/* import export */
	function exportFavs() {
		const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(favs.value))}`;
		const link = document.createElement("a");
		link.href = jsonString;
		link.download = `${t('favs')}.json`;

		link.click();
	}
	function importFavs() {
		const input = document.createElement('input')
		input.type = 'file'
		input.onchange = (e) => {
			if (input.files) {
				const file = input.files[0]
				if (file.name.includes('.json') && file.type == 'application/json') {
					const reader = new FileReader()
					reader.onerror = (err) => toaster.error(err)
					reader.onload = (data) => {
						let fileData = JSON.parse(data.target.result)
						if (fileData.length) {
							try {
								let newStations = fileData.filter(station => !favs.value.some(fav => fav.stationuuid == station?.stationuuid))
								if (newStations.length) newStations.forEach(station => favs.value.push(station))

								toaster.success('Import finished', {
									message: newStations.length > 0 ? `${newStations.length} stations added` : 'No stations to add'
								})
							} catch (error) {
								toaster.error('Error during import')
								console.log(error)
							}
						} else toaster.error('File is empty')
					}
					reader.readAsText(file)
				} else toaster.error('Unsupported file format')
			}
		}
		input.click()
	}

	/* maps */
	const titleMap = {
		'all': textList,
		'fav': textFavs,
		'search': textSearch,
		'recent': textRecent
	}
</script>

<template>
	<div class="layout">
		<Menu @closemenu="settings.showMenu = false" :show="settings.showMenu">
			<MenuLink icon="list" :text="textList" :active="browserTab == 'all'" @click.prevent="showListTab" />
			<MenuLink icon="star" :filled="favs.length > 0" :text="textFavs" :active="browserTab == 'fav'" @click.prevent="setTab('fav')" :bedge="favs.length || ''" />
			<MenuLink icon="search" :text="textSearch" :active="browserTab == 'search'" @click.prevent="showSearchTab" />
			<MenuLink icon="upleft" :text="textRecent" :active="browserTab == 'recent'" @click.prevent="setTab('recent')" />
			<div class="menu-divider"></div>
			<MenuLink icon="plus" :text="textAddStation" @click.prevent="showModal('addStation')" />
			<MenuLink icon="clock" :text="textTimerTitle" :bedge="timerSettings.active ? 'i' : ''" @click.prevent="timerSettings.show = true" />
			<MenuLink class="rxl-hide" icon="command" :text="textCommands" @click.prevent="showModal('commands')" />
			<MenuLink icon="settings" :text="textSettings" @click.prevent="showModal('settings')" />
			<MenuLink v-if="airplayPlayer.isAvailable" :disabled="!playNow.station || (!airplayPlayer.streaming && !playNow.isPlaying)" icon="airplay" text="AirPlay" @click.prevent="selectAriplayDevice" :bedge="airplayPlayer.streaming ? 'i' : ''" />
			<MenuLink v-if="castPlayer.isAvailable" icon="cast" :text="castPlayer.connected ? textStopStreaming : textStartStreaming" @click.prevent="toggleCasting" :bedge="castPlayer.connected ? 'i' : ''" :disabled="!playNow.station" />
			<div class="menu-divider"></div>
			<MenuLink icon="info" :text="textAbout" @click.prevent="showModal('about')" />
			<MenuLink v-if="installPrompt" icon="clouddownload" :text="textInstall" @click.prevent="installApp" />
			<MenuLink v-if="showSafariInstallHelp" icon="clouddownload" :text="textInstall" @click.prevent="showModal('safariInstall')" />
		</Menu>

		<div class="browser" :ref="(el) => tabRefs.browser = el" :class="{playerActive: playNow.station}">
			<div class="browserHeader flex xl-hide">
				<button @click="settings.showMenu = true" class="bttnMenu" aria-label="Menu">
					<Icon icon="menu" />
				</button>
				<!-- <h1 data-title="WebRadio"><a class="h1link" href='/'>WebRadio</a></h1> -->
				<Transition mode="out-in" name="movein">
					<h2 :key="browserTab" class="browserHeader-title">{{ titleMap[browserTab].value }}</h2>
				</Transition>
				<button v-if="airplayPlayer.isAvailable" class="unstyledBtn browserHeader-bttn l-hide" :class="{highlight: airplayPlayer.streaming}" @click.prevent="selectAriplayDevice">
					<Icon icon="airplay" />
				</button>
				<button v-if="castPlayer.isAvailable" class="unstyledBtn browserHeader-bttn l-hide" :class="{highlight: castPlayer.connected}" @click.prevent="toggleCasting">
					<Icon icon="cast" />
				</button>
				<button class="unstyledBtn browserHeader-bttn l-hide" :class="{highlight: timerSettings.active}" @click.prevent="timerSettings.show = true">
					<Icon icon="clock" />
				</button>
				<!-- <button class="unstyledBtn browserHeader-bttn xl-hide" @click.prevent="showModal('settings')">
					<Icon icon="settings" />
				</button> -->
			</div>
			<div :ref="(el) => tabRefs.container = el" class="tabs browserTabs rxl-hide">
				<button :ref="(el) => tabRefs.all = el" :class="{active: browserTab == 'all'}" @click.prevent="showListTab">
					<Icon icon="list" />
					<span>{{ textList }}</span>
				</button>
				<button :ref="(el) => tabRefs.fav = el" :class="{active: browserTab == 'fav'}" @click.prevent="setTab('fav')">
					<Icon icon="star" :filled="favs.length > 0" />
					<span>{{ textFavs }}</span>
					<span v-if="favs.length" class="tabTrigger-bedge">
						<span class="autoInvert">
							{{ favs.length }}
						</span>
					</span>
				</button>
				<button :ref="(el) => tabRefs.search = el" :class="{active: browserTab == 'search'}" @click.prevent="showSearchTab">
					<Icon icon="search" />
					<span>{{ textSearch }}</span>
				</button>
				<button :ref="(el) => tabRefs.recent = el" :class="{active: browserTab == 'recent'}" @click.prevent="setTab('recent')">
					<Icon icon="upleft" />
					<span>{{ textRecent }}</span>
				</button>
			</div>
			<Transition name="movein" mode="out-in">
				<div class="offlineInfo" v-if="!isOnline">
					<div class="offlineInfo-icon">
						<Icon icon="offline" />
					</div>
					<h2>{{ $t('offlineError') }}</h2>
					<p>
						<button @click.prevent="checkOnline" class="bttn">
							<span class="autoInvert">
								<Icon icon="refresh" />{{ $t('refresh') }}
							</span>
						</button>
					</p>
				</div>
				<div class="tabsCont browserTabsCont" v-else>
					<Transition name="movein" mode="out-in" @enter="setTabAfterEnter">
						<div v-if="browserTab == 'all'" class="tab browserTab">
							<div class="stationsFilter flex ai-c">
								<div class="stationsFilter-labelOuter flex">
									<label v-if="!stations.loading && !stations.hasmore && stations.list.length" class="simpleList-filterLabel stationsFilter-label flex ai-c">
										<Icon icon="search" />
										<input v-model="stations.filter" :placeholder="$t('searchList')" type="text" class="simpleList-filterInput stationsFilter-input">
										<Icon icon="x" class="simpleList-filterClear stationsFilter-clear" :class="{visible: stations.filter}" @click="stations.filter = ''" />
									</label>
									<div v-else-if="!stations.loading" class="currentListInfo">
										<div>{{ $t(stations.type) }}: {{ currentListTranslatedValue }}</div>
										<div v-if="stations.list.length" class="lighter">{{ $t('first') }} {{ stations.list.length }} {{ $t('stations') }}</div>
									</div>
								</div>
								<button class="bttn bttnLight rm-icoBttn nowrap" :class="{'rm-iconOnly': !stations.loading && !stations.hasmore}" @click="showListSelect"><Icon icon="refresh" /><span :class="{'rm-hide': !stations.loading && !stations.hasmore}">{{ $t('changeList') }}</span></button>
							</div>
							<RadioList
								:list="filteredStations"
								:loading="stations.loading"
								:empty="stations.filter ? $t('allEmpty') : ''"
								@play="setRadio"
								@toggleFav="toggleFav"
								:hasmore="stations.hasmore"
								:loadingmore="stations.loadingmore"
								@loadmore="loadmore"
							/>
							<Modal
								:title="$t('chooseList')"
								:show="settings.showListSelect"
								@close="settings.showListSelect = false"
							>
								<div class="tabs">
									<button :class="{active: settings.listTab == 'country'}" @click.prevent="settings.listTab = 'country'">{{ $t('country') }}</button>
									<button :class="{active: settings.listTab == 'language'}" @click.prevent="settings.listTab = 'language'">{{ $t('language') }}</button>
									<button :class="{active: settings.listTab == 'tag'}" @click.prevent="settings.listTab = 'tag'">{{ $t('tag') }}</button>
								</div>
								<div class="tabsCont">
									<SmoothFadeTransition>
										<div v-if="settings.listTab == 'country'" class="tab">
											<SimpleList :list="filterData.countries" @loadlist="(item) => loadlist('country', item)" />
										</div>
										<div v-else-if="settings.listTab == 'language'" class="tab">
											<SimpleList :list="filterData.languages" @loadlist="(item) => loadlist('language', item)" />
										</div>
										<div v-else-if="settings.listTab == 'tag'" class="tab">
											<SimpleList :list="filterData.tags" filter-only @loadlist="(item) => loadlist('tag', item)" />
										</div>
									</SmoothFadeTransition>
								</div>
							</Modal>
						</div>
						<div v-else-if="browserTab == 'recent'" class="tab browserTab">
							<RadioList
								:list="stations.history"
								show-return
								@play="setRadio"
								@toggleFav="toggleFav"
								@return="showListTab"
								:empty="$t('recentEmpty')"
							/>
						</div>
						<div v-else-if="browserTab == 'search'" class="tab browserTab">
							<div class="stationsFilter searchFilter flex">
								<label class="simpleList-filterLabel stationsFilter-label flex ai-c">
									<Icon icon="search" />
									<input v-model="search.filter.name" :placeholder="$t('stationName')" type="text" class="simpleList-filterInput stationsFilter-input" @input="debounceSearchStation">
									<Icon icon="x" class="simpleList-filterClear stationsFilter-clear" :class="{visible: search.filter.name}" @click="resetSearchName" />
								</label>
								<button class="bttn bttnLight rm-icoBttn rm-iconOnly nowrap" :class="{active: search.expanded}" @click="search.expanded = !search.expanded">
									<Icon icon="down" :class="{flip: search.expanded}" />
									<span class="rm-hide">{{ $t('moreOptions') }}</span>
									<span v-if="search.filter.country || search.filter.language || search.filter.tag" class="bttn-bedge"></span>
								</button>
							</div>
							<Transition name="searchFilterTransition">
								<div v-if="search.expanded" class="searchFilter-selects">
									<div class="searchFilter-selectLabel">
										<span class="searchFilter-selectTitle">{{ $t('country') }}</span>
										<select class="simpleList-filterSelect" v-model="search.filter.country" @change="searchStation">
											<option value="">{{ $t('all') }}</option>
											<option v-for="country in filterData.countries" :value="country.name">
												{{ country.translatedName || country.name }}
											</option>
										</select>
									</div>
									<div class="searchFilter-selectLabel">
										<span class="searchFilter-selectTitle">{{ $t('language') }}</span>
										<select class="simpleList-filterSelect" v-model="search.filter.language" @change="searchStation">
											<option value="">{{ $t('all') }}</option>
											<option v-for="language in filterData.languages" :value="language.name">
												{{ language.translatedName || language.name }}
											</option>
										</select>
									</div>
									<label class="searchFilter-selectLabel">
										<span class="searchFilter-selectTitle">{{ $t('tag') }}</span>
										<input list="searchTagsList" :placeholder="$t('tagExample')" type="text" class="simpleList-searchFilterInput" v-model="search.filter.tag" @input="searchTagInput" />
										<datalist v-if="search.filter.tag.length > 0" id="searchTagsList">
											<option v-for="tag in filterData.tags" :value="tag.name"></option>
										</datalist>
									</label>
									<div class="searchFilter-selectLabel">
										<span class="searchFilter-selectTitle">{{ $t('sortBy') }}</span>
										<select class="simpleList-filterSelect" v-model="search.filter.order" @change="setSearchOrder">
											<option value="clickcount">{{ $t('playCount') }}</option>
											<option value="name">{{ $t('name') }}</option>
											<option value="country">{{ $t('country') }}</option>
											<option value="language">{{ $t('language') }}</option>
										</select>
									</div>
									<SwitchInput class="searchFilter-cb" :title="t('httpsOnly')" :modelValue="search.filter.is_https" @change="setSearchHttps" />
								</div>
							</Transition>
							<RadioList
								:list="search.list"
								:loading="search.loading"
								:empty="$t('searchEmpty')"
								@play="setRadio"
								@toggleFav="toggleFav"
								:hasmore="search.hasmore"
								:loadingmore="search.loadingmore"
								@loadmore="searchLoadmore"
							/>
						</div>
						<div v-else-if="browserTab == 'fav'" class="tab browserTab">
							<RadioList
								:list="favs"
								show-return
								@play="setRadio"
								@toggleFav="toggleFav"
								@return="showListTab"
								:empty="$t('favsEmpty')"
							/>
							<div class="redioList-buttons">
								<div class="redioList-buttons-left">
									<button class="bttn bttnLight" @click="importFavs">
										<Icon icon="upload" />
										<span>{{ $t('import') }}</span>
									</button>
									<button v-if="favs.length" class="bttn bttnLight" @click="exportFavs">
										<Icon icon="download" />
										<span>{{ $t('export') }}</span>
									</button>
								</div>
								<div class="redioList-buttons-right">
									<button class="bttn" @click="showModal('addStation')">
										<span class="autoInvert">
											<Icon icon="plus" />
											<span>{{ $t('addCustom') }}</span>
										</span>
									</button>
								</div>
							</div>
						</div>
					</Transition>
				</div>
			</Transition>
		</div>

		<Player
			@toggle="toggle"
			@toggleFav="toggleFav"
			@toggleMute="toggleMute"
			@prev="prev"
			@next="next"
			@cast="toggleCasting"
			@selectariplay="selectAriplayDevice"
		>
			<div ref="videoCont" class="videoEl-cont" :class="{fullScreen: playNow.fullScreen}">
				<video
					ref="audio"
					class="videoEl"
					preload="none"
					playsinline
					:volume="appSettings.volume.value"
					@waiting="audioEvents.waiting"
					@playing="audioEvents.playing"
					@play="audioEvents.play"
					@pause="audioEvents.pause"
					@error="audioEvents.error"
					@loadeddata="audioEvents.loadeddata"
					@loadstart="audioEvents.loadstart"
					@loadedmetadata="audioEvents.loadedmetadata"
					@dblclick="toggleMaximize"
				>
				</video>
				<VideoControls @toggleMute="toggleMute" @toggleMaximize="toggleMaximize" @getHlsLevel="getHlsLevel" @setHlsLevel="setHlsLevel" :hlslevels="hlsLevels" :hlscurrentlevel="hlsCurrentLevel" />
			</div>
		</Player>

		<div class="mobileNav xl-hide" :class="{wShadow: !playNow.station}">
			<button class="mobileNav-link" :class="{active: browserTab == 'all'}" @click.prevent="showListTab">
				<span class="mobileNav-link-icon">
					<Icon icon="list" />
				</span>
				<span class="mobileNav-link-title">{{ textList }}</span>
			</button>
			<button class="mobileNav-link" :class="{active: browserTab == 'fav'}" @click.prevent="setTab('fav')">
				<span class="mobileNav-link-icon">
					<Icon icon="star" :filled="favs.length > 0" />
					<span v-if="favs.length > 0" class="mobileNav-link-bedge"><span class="autoInvert">{{ favs.length }}</span></span>
				</span>
				<span class="mobileNav-link-title">{{ textFavs }}</span>
			</button>
			<button class="mobileNav-link" :class="{active: browserTab == 'search'}" @click.prevent="showSearchTab">
				<span class="mobileNav-link-icon">
					<Icon icon="search" />
				</span>
				<span class="mobileNav-link-title">{{ textSearch }}</span>
			</button>
			<button class="mobileNav-link" :class="{active: browserTab == 'recent'}" @click.prevent="setTab('recent')">
				<span class="mobileNav-link-icon">
					<Icon icon="upleft" />
				</span>
				<span class="mobileNav-link-title">{{ textRecent }}</span>
			</button>
		</div>
	</div>

	<DynamicModal @loadlist="(type, value) => loadlist(type, value)" @toggleFav="toggleFav" @saveStation="saveStation" @removeStation="toggleFav" />
	<Timer @timerFinish="stop" />
	<Toaster />
</template>