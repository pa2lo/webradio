<script setup>
import Icon from './Icon.vue';

	const props = defineProps({
		show: Boolean
	})
</script>

<template>
	<div class="menuCont" :class="{menuOpen: show}">
		<div class="menuBackdrop xl-hide" @click="$emit('closemenu')"></div>
		<div class="menu">
			<div class="menu-header">
				<h1 data-title="WebRadio"><a class="h1link" href='/'>WebRadio</a></h1>
				<button @click="$emit('closemenu')" class="menu-x xl-hide" :aria-label="$t('close')"><Icon icon="x" /></button>
			</div>
			<div class="menu-items">
				<slot></slot>
			</div>
		</div>
	</div>
</template>