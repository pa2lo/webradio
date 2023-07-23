import { toasts } from "./toastStore"
import ToasterComponent from './ToasterComponent.vue'

let toastID = 0
const TOAST_DEFAULTS = {
	onClick: false,
	duration: 5000
}

export default {
	install: (app) => {
		const addToast = (type, title, options) => {
			toasts.value.push({
				id: `${++toastID}-${Date.now()}`,
				type: type,
				title: title,
				...Object.assign({...TOAST_DEFAULTS}, options)
			})
		}

		const toaster = {
			error: (title, options) => addToast('error', title, options),
			success: (title, options) => addToast('success', title, options),
			info: (title, options) => addToast('info', title, options)
		}

		app.component('Toaster', ToasterComponent)
		app.config.globalProperties.$toaster = toaster
		app.provide('toaster', toaster)
	}
}