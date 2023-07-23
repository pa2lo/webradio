<script setup>
	import { appSettings } from '../../store.js'

	import { setLang } from '../../lang/i18n'

	var docEl = document.documentElement
	var	bodyEl = document.body

	function setTheme(theme) {
		if (theme == appSettings.theme.value) return

		appSettings.theme.value = theme
		bodyEl.classList.add('noTransition')
		docEl.classList.remove('theme-light', 'theme-dark')
		if (theme) docEl.classList.add(`theme-${theme}`)
		requestAnimationFrame(() => {
			bodyEl.classList.remove('noTransition')
		})
	}

	let hueDebounce = null
	let metaElement = document.querySelector('meta[name="theme-color"]')
	function setHue(e) {
		if (!hueDebounce) bodyEl.classList.add('noTransition')
		let hue = e?.target.value || 230
		appSettings.color.value = hue
		docEl.style.setProperty('--h', hue)
		metaElement.setAttribute('content', `hsl(${hue}, 25%, 20%)`)
		if (hueDebounce) clearTimeout(hueDebounce)
		hueDebounce = setTimeout(() => {
			bodyEl.classList.remove('noTransition')
			hueDebounce = null
		}, 500)
	}

	function restoreDefaults() {
		setLang('')
		setTheme('')
		setHue()
	}

	function clearCache() {
		localStorage.clear()
		window.location.href = '/'
	}
</script>
<template>
	<div>
		<p class="setting-title">{{ $t('language') }}</p>
		<div class="mt05 pb0125">
			<div class="settingsSwitch">
				<button :class="{active: !appSettings.lang.value}" @click.prevent="setLang('')">AUTO</button>
				<button :class="{active: appSettings.lang.value == 'en'}" @click.prevent="setLang('en')">EN</button>
				<button :class="{active: appSettings.lang.value == 'sk'}" @click.prevent="setLang('sk')">SK</button>
				<button :class="{active: appSettings.lang.value == 'cs'}" @click.prevent="setLang('cs')">CZ</button>
			</div>
		</div>
		<hr class="divider">
		<p class="setting-title">{{ $t('colorscheme') }}</p>
		<div class="mt05 pb0125">
			<div class="settingsSwitch">
				<button :class="{active: !appSettings.theme.value}" @click.prevent="setTheme('')">AUTO</button>
				<button :class="{active: appSettings.theme.value == 'light'}" @click.prevent="setTheme('light')">{{ $t('light') }}</button>
				<button :class="{active: appSettings.theme.value == 'dark'}" @click.prevent="setTheme('dark')">{{ $t('dark') }}</button>
			</div>
		</div>
		<hr class="divider">
		<p class="setting-title">{{ $t('hue') }}</p>
		<div class="mt05 pb0125">
			<div class="hueRange-cont">
				<input class="hueRange" type="range" min="0" max="360" step="1" :value="appSettings.color.value" @input="setHue">
			</div>
		</div>
		<hr class="divider">
		<p>
			<button class="bttn" @click="restoreDefaults"><span class="autoInvert">{{ $t('reset') }}</span></button>
		</p>
		<div class="mt075">
			<button class="bttnSmall" @click="clearCache">{{ $t('clearCache') }}</button>
		</div>
	</div>
</template>