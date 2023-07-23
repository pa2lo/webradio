import { createApp } from 'vue'
import App from './App.vue'
import toaster from './toaster'
import translate from './translate'
import { i18nSettings } from './lang/i18n'

import './assets/main.css'

if (localStorage.getItem('hue')) {
	document.documentElement.style.setProperty('--h', JSON.parse(localStorage.getItem('hue')))
	document.querySelector('meta[name="theme-color"]').setAttribute('content', `hsl(${localStorage.getItem('hue')}, 25%, 20%)`)
}
if (localStorage.getItem('theme')) document.documentElement.classList.add(`theme-${JSON.parse(localStorage.getItem('theme'))}`)

createApp(App).use(toaster).use(translate, i18nSettings).mount('#app')

let resizeTimer;
window.addEventListener("resize", () => {
	document.body.classList.add("noTransition");
	clearTimeout(resizeTimer);
	resizeTimer = setTimeout(() => {
		document.body.classList.remove("noTransition");
	}, 400);
});

if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('/service-worker.js')
	.then(function(reg){
		console.log("service worker ok");
	}).catch(function(err) {
		console.log("service worker error", err)
	});
};