export function client(url, body, asform) {
	const config = {
		method: body ? 'POST' : 'GET',
		mode: 'cors',
		headers: {
			'Accept': 'application/json',
			  'Content-Type': asform ? 'application/x-www-form-urlencoded' : 'application/json'
		}
	}
	if (body) config.body = JSON.stringify(body)

	return fetch(url, config).then(async response => {
		if (response.ok) {
			return await response.json()
		} else {
			const errorMessage = await response.text()
			return Promise.reject(new Error(errorMessage))
		}
	})
}

export const isiOS = ['iPhone', 'iPad', 'iPod'].includes(window.navigator?.userAgentData?.platform || window.navigator.platform)

export const isSafari = /Apple/i.test(navigator.vendor) && /Safari/i.test(navigator.userAgent)

export function getTimestampUUID() {
	return `${Date.now()}-${String(crypto.randomUUID()).split('-').slice(0, -1).join('-')}`
}