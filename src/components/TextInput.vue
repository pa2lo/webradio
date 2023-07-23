<script setup>
	import { getTimestampUUID } from '../helpers';

	const props = defineProps({
		placeholder: {
			type: String,
			default: ''
		},
		title: {
			type: String,
			default: ''
		},
		image: {
			type: Boolean,
			default: false
		},
		modelValue: {
			type: String,
			default: ''
		},
		error: {
			type: String,
			default: ''
		}
	})
	defineEmits(['update:modelValue'])
	const id = getTimestampUUID()
</script>

<template>
	<div class="inputField">
		<label :for="id" class="inputField-title">
			{{ title }}
		</label>
		<div class="inputField-inputCont flex">
			<input
				:id="id"
				class="inputField-input inputField-inputText"
				:class="{inputError: error}"
				type="text"
				:placeholder="placeholder"
				:value="modelValue"
    			@input="$emit('update:modelValue', $event.target.value)"
			/>
			<div v-if="image" class="inputField-previewOuter">
				<img v-if="modelValue.includes('.jpg') || modelValue.includes('.png') || modelValue.includes('.ico') || modelValue.includes('.png')" class="inputField-preview" :src="modelValue" alt="">
			</div>
		</div>
		<div v-if="error" class="inputField-error">
			<div class="inputField-errorText">
				{{ error }}
			</div>
		</div>
	</div>
</template>