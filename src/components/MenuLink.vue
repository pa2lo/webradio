<script setup>
	import Icon from './Icon.vue'

	let props = defineProps({
		icon: String,
		text: String,
		active: {
			type: Boolean,
			default: false
		},
		filled: {
			type: Boolean,
			default: false
		},
		bedge: [String, Number]
	})
</script>

<template>
	<button class="menu-link" :class="{active: active}">
		<Icon :icon="icon" :filled="filled" />
		<span>{{ text }}</span>
		<span v-if="bedge" class="tabTrigger-bedge">
			<span class="autoInvert">{{ bedge }}</span>
		</span>
	</button>
</template>