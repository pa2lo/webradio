<script setup>
	import Icon from './Icon.vue'

	const props = defineProps({
		style: {
			type: String,
			default: 'vertical'
		}
	})
</script>

<template>
	<div :class="`loader loader-${style}`" class="loader">
		<div class="loader-icon">
			<Icon icon="loading" />
		</div>
		<h2 class="loader-title">{{ $t('loading') }}</h2>
	</div>
</template>