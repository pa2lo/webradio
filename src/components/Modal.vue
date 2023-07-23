<script setup>
	import { ref } from 'vue'

	import Icon from './Icon.vue'

	const props = defineProps({
		show: Boolean,
		size: {
			type: String,
			default: 'normal'
		},
		title: [String, Boolean],
		subtitle: [String, Boolean],
		translateTitle: {
			type: Boolean,
			default: false
		},
		left: Boolean,
		k: {
			type: [Number, String],
			default: 0
		}
	})

	const modalCont = ref(null)
	function onafterenter() {
		modalCont.value.focus({
			preventScroll: true
		})
	}
</script>

<template>
	<Transition name="modal" mode="out-in" @after-enter="onafterenter">
		<div
			v-if="show"
			:key="k"
			class="modal-backdrop forceLight"
			:class="[`modalKey-${k}`]"
			@keydown.esc.stop="$emit('close')"
			@click.self="$emit('close')"
		>
			<div
				:class="`modal modal-${size} ${left ? 'left' : ''}`"
				ref="modalCont"
				tabindex="-1"
			>
				<button class="modal-close" @click="$emit('close')">
					<Icon icon="x" />
				</button>
				<h2 v-if="title" class="modal-title">{{ translateTitle ? $t(title) : title }}</h2>
				<h3 v-if="subtitle" class="modal-subtitle">{{ subtitle }}</h3>
				<div class="modal-cont">
					<slot></slot>
				</div>
			</div>
		</div>
	</Transition>
</template>