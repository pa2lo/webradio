<script setup>
	const props = defineProps({
		duration: {
			type: Number,
			default: 250
		},
		easing: {
			type: String,
			default: 'linear'
		},
		collapse: Boolean
	})

	let transition = `opacity ${props.duration}ms ${props.easing}, height ${props.duration}ms ${props.easing}, margin ${props.duration}ms ${props.easing}`

	let collapseCss = {
		marginBlock: '0px',
		opacity: '0',
		height: '0px',
		overflow: 'hidden'
	}
	let fadeoutCss = {
		opacity: '0',
		overflow: 'hidden'
	}

	let cachedCss = collapseCss
	function onleave(el) {
		let currentCss = getStyles(el)
		setStyles(el, currentCss)
		forceRepaint(el)
		if (props.collapse) {
			setStyles(el, collapseCss, true)
			cachedCss = collapseCss
		} else {
			setStyles(el, fadeoutCss, true)
			cachedCss = Object.assign(currentCss, fadeoutCss)
		}
	}
	async function onenter(el) {
		let elCss = getStyles(el)
		setStyles(el, cachedCss)
		forceRepaint(el)
		setStyles(el, elCss, true)
	}

	function forceRepaint(el) {
		getComputedStyle(el).height
	}
	function resetStyles(el) {
		Object.keys(collapseCss).forEach((key) => {
			el.style[key] = ''
		})
		el.style.transition = ''
	}
	function setStyles(el, styles, setTransition) {
		Object.keys(styles).forEach((key) => {
			el.style[key] = styles[key]
		})
		if (setTransition) el.style.transition = transition
	}
	function getStyles(el) {
		let { height, opacity, marginBlock } = getComputedStyle(el, null)
		return { height, opacity, marginBlock }
	}
</script>

<template>
	<Transition
		mode="out-in"
		name="smoothfade"
		@enter="onenter"
		@after-enter="resetStyles"
		@leave="onleave"
	>
		<slot></slot>
	</Transition>
</template>