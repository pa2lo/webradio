<script setup>
	import { ref, computed } from 'vue'

	import Loading from './Loading.vue'
	import Icon from './Icon.vue'
	import SmoothFadeTransition from './SmoothFadeTransition.vue'

	const props = defineProps({
		list: Array,
		filterOnly: Boolean
	})

	const filter = ref('')

	let filteredList = computed(() => {
		if (!filter.value) return props.list
		return props.list.filter((item) => item.name.toLowerCase().includes(filter.value.toLowerCase()) || item.translatedName?.toLowerCase().includes(filter.value.toLowerCase()))
	})
</script>

<template>
	<SmoothFadeTransition>
		<Loading class="mt2" v-if="!list.length" />
		<div v-else class="simpleList-cont">
			<div class="simpleList-filter">
				<label class="simpleList-filterLabel flex ai-c">
					<Icon icon="search" />
					<input v-model="filter" :placeholder="$t('searchList')" type="text" class="simpleList-filterInput">
					<Icon icon="x" class="simpleList-filterClear" :class="{visible: filter}" @click="filter = ''" />
				</label>
			</div>
			<SmoothFadeTransition>
				<div v-if="filterOnly && filter.length < 3" class="simpleList-empty">
					<div class="radioList-icon">
						<Icon icon="info" />
					</div>
					<h2 class="radioList-title">{{ $t('listTagRule') }}</h2>
					<p class="mt05">{{ $t('listTagSentence') }}</p>
					<div class="smallBttnList mt075">
						<button v-for="item in list.slice(0, 15)" class="bttnSmall" @click="$emit('loadlist', item)">
							{{ item.name }}
						</button>
					</div>
				</div>
				<ul v-else-if="filteredList.length" class="simpleList">
					<li v-for="item in filteredList">
						<div class="simpleList-item" @click="$emit('loadlist', item)">
							<img v-if="item.flag" :src="item.flag" />
							<span class="simpleList-name">
								{{ item.translatedName || item.name }}
							</span>
						</div>
					</li>
				</ul>
				<div v-else class="simpleList-empty">
					<div class="radioList-icon">
						<Icon icon="alert" />
					</div>
					<h2 class="radioList-title">{{ $t('noResults') }}</h2>
				</div>
			</SmoothFadeTransition>
		</div>
	</SmoothFadeTransition>
</template>