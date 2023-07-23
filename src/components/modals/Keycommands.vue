<template>
	<div class="left">
		<div class="commands-list">
			<div class="command">
				<div class="command-key">{{ $t('spacebar') }}</div>
				<div class="command-title">
					{{ $t('play') }} / {{ $t('stop') }}
				</div>
			</div>
			<div class="command">
				<div class="command-key">N</div> / <div class="command-key">▶</div>
				<div class="command-title">
					{{ $t('next') }}
				</div>
			</div>
			<div class="command">
				<div class="command-key">P</div> / <div class="command-key">◀</div>
				<div class="command-title">
					{{ $t('prev') }}
				</div>
			</div>
			<hr class="divider dividerSmall">
			<div class="command">
				<div class="command-key">M</div>
				<div class="command-title">
					{{ $t('mute') }}
				</div>
			</div>
			<div class="command">
				<div class="command-key">▲</div>
				<div class="command-title">
					{{ $t('volumeUp') }}
				</div>
			</div>
			<div class="command">
				<div class="command-key">▼</div>
				<div class="command-title">
					{{ $t('volumeDown') }}
				</div>
			</div>
			<hr class="divider dividerSmall">
			<div class="command">
				<div class="command-key">F</div>
				<div class="command-title">
					{{ $t('togglefav') }}
				</div>
			</div>
			<div class="command">
				<div class="command-key">S</div>
				<div class="command-title">
					{{ $t('timer.title') }}
				</div>
			</div>
		</div>
	</div>
	<!-- <hr class="divider">
	<h3>{{ $t('timer.title') }}</h3> -->
</template>