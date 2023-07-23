<script setup>
	import { dynamicModal } from '../store'

	import Settings from './modals/Settings.vue'
	import About from './modals/About.vue'
	import Keycommands from './modals/Keycommands.vue'
	import Stationinfo from './modals/Stationinfo.vue'
	import AddStation from './modals/AddStation.vue'
	import Modal from './Modal.vue'
	import IosInstallHelp from './modals/IosInstallHelp.vue'

	const typesMap = {
		'settings': {
			component: Settings,
			title: 'settings',
			size: 'small'
		},
		'about': {
			component: About,
			title: 'about'
		},
		'commands': {
			component: Keycommands,
			title: 'commands',
			size: 'small'
		},
		'info': {
			component: Stationinfo,
			title: false
		},
		'addStation': {
			component: AddStation,
			title: 'addCustom',
			size: 'medium'
		},
		'editStation': {
			component: AddStation,
			title: 'editStation',
			size: 'medium',
			subtitle: () => dynamicModal.data?.name
		},
		'safariInstall': {
			component: IosInstallHelp,
			title: 'install',
			size: 'small'
		}
	}

	const leftAlign = ['commands', 'addStation', 'editStation', 'safariInstall']
</script>

<template>
	<Modal
		:k="dynamicModal.key"
		:show="dynamicModal.show"
		@close="dynamicModal.show = false"
		:size="dynamicModal.type ? typesMap[dynamicModal.type].size : ''"
		:title="dynamicModal.type ? typesMap[dynamicModal.type].title : false"
		:subtitle="typesMap[dynamicModal?.type]?.subtitle?.() || ''"
		:translateTitle="true"
		:left="leftAlign.includes(dynamicModal?.type)"
	>
		<component
			:is="typesMap[dynamicModal.type].component"
			:data="dynamicModal.data"
			v-bind="$attrs"
			@loadlist="dynamicModal.show = false"
			@closeModal="dynamicModal.show = false"
			@saveStation="dynamicModal.show = false"
			@removeStation="dynamicModal.show = false"
		/>
	</Modal>
</template>