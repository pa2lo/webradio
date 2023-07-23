<script setup>
	import { getTimestampUUID } from '../helpers'

	const props = defineProps({
		title: {
			type: String,
			default: ''
		},
		modelValue: {
			type: [String, Number, Boolean],
			default: ''
		},
	})

	const id = getTimestampUUID()
</script>

<template>
	<div class="inputField nowrap">
		<label :for="id" class="inputField-title inputField-switchTitle">
			{{ title }}
		</label>
		<div class="inputField-inputCont inputField-switchInputCont flex">
			<input
				:id="id"
				class="inputField-input inputField-inputSwitch"
				type="checkbox"
				:checked="modelValue"
				@change="$emit('update:modelValue', $event.target.checked)"
			/>
		</div>
	</div>
</template>