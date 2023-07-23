import { ref, computed } from 'vue'

export const i18nLocale = ref(null)

export default {
	install: (app, options) => {
		i18nLocale.value = options.locale
		function t(string) {
			return computed(() => {
				return string.split('.').reduce((o, i) => {
					return o[i]
				}, options.messages[i18nLocale.value]) || string
			})
		}

		function translate(string) {
			return t(string).value
		}

		app.config.globalProperties.$t = translate
		app.provide('t', translate)
		app.provide('locale', i18nLocale)
	}
}