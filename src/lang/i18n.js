import { messages } from './messages'
import { appSettings, filterData } from '../store'
import { i18nLocale } from '../translate'

const languageList = ['sk', 'cs', 'en']

export function getNavigatorLang() {
	return navigator.language.split('-')[0]
}

export function getDefaultLang() {
	let navigatorLang = getNavigatorLang()
	return languageList.includes(navigatorLang) ? navigatorLang : 'en'
}

export const i18nSettings = {
	locale: appSettings.lang.value || getDefaultLang(),
	messages
}

export function setLang(lang) {
	appSettings.lang.value = lang
	i18nLocale.value = lang || getDefaultLang()
	localizeCountries()
	localizeLanguages()
}

export function localizeCountries() {
	if (!filterData.countries) return
	let countryNames = new Intl.DisplayNames([i18nLocale.value], {type: 'region'})
	filterData.countries.map(country => {
		if (country.iso_3166_1) country.translatedName = countryNames.of(country.iso_3166_1)
	})
}
export function localizeLanguages() {
	if (!filterData.languages) return
	let languageNames = new Intl.DisplayNames([i18nLocale.value], {type: 'language'})
	filterData.languages.map(language => {
		if (language.iso_639) language.translatedName = languageNames.of(language.iso_639).toLocaleLowerCase()
	})
}

export const languagesMap = {
	"afar": "aa", "abkhazian": "ab", "afrikaans": "af", "akan": "tw", "amharic": "am", "arabic": "ar", "aragonese": "an", "assamese": "as", "avaric": "av", "avestan": "ae", "aymara": "ay", "azerbaijani": "az", "bashkir": "ba", "bambara": "bm", "belarusian": "be", "bangla": "bn", "bislama": "bi", "tibetan": "bo", "bosnian": "bs", "breton": "br", "bulgarian": "bg", "catalan": "ca", "czech": "cs", "chamorro": "ch", "chechen": "ce", "church slavic": "cu", "chuvash": "cv", "cornish": "kw", "corsican": "co", "cree": "cr", "welsh": "cy", "danish": "da", "german": "de", "divehi": "dv", "dzongkha": "dz", "greek": "el", "english": "en", "esperanto": "eo", "estonian": "et", "basque": "eu", "ewe": "ee", "faroese": "fo", "persian": "fa", "fijian": "fj", "finnish": "fi", "french": "fr", "western frisian": "fy", "fulah": "ff", "scottish gaelic": "gd", "irish": "ga", "galician": "gl", "manx": "gv", "guarani": "gn", "gujarati": "gu", "haitian creole": "ht", "hausa": "ha", "serbian (latin)": "sh", "hebrew": "he", "herero": "hz", "hindi": "hi", "hiri motu": "ho", "croatian": "hr", "hungarian": "hu", "armenian": "hy", "igbo": "ig", "ido": "io", "sichuan yi": "ii", "inuktitut": "iu", "interlingue": "ie", "interlingua": "ia", "indonesian": "id", "inupiaq": "ik", "icelandic": "is", "italian": "it", "javanese": "jv", "japanese": "ja", "kalaallisut": "kl", "kannada": "kn", "kashmiri": "ks", "georgian": "ka", "kanuri": "kr", "kazakh": "kk", "khmer": "km", "kikuyu": "ki", "kinyarwanda": "rw", "kyrgyz": "ky", "komi": "kv", "kongo": "kg", "korean": "ko", "kuanyama": "kj", "kurdish": "ku", "lao": "lo", "latin": "la", "latvian": "lv", "limburgish": "li", "lingala": "ln", "lithuanian": "lt", "luxembourgish": "lb", "luba-katanga": "lu", "ganda": "lg", "marshallese": "mh", "malayalam": "ml", "marathi": "mr", "macedonian": "mk", "malagasy": "mg", "maltese": "mt", "mongolian": "mn", "māori": "mi", "malay": "ms", "burmese": "my", "nauru": "na", "navajo": "nv", "south ndebele": "nr", "north ndebele": "nd", "ndonga": "ng", "nepali": "ne", "dutch": "nl", "norwegian nynorsk": "nn", "norwegian bokmål": "nb",	"norwegian": "no", "nyanja": "ny", "occitan": "oc", "ojibwa": "oj", "odia": "or", "oromo": "om", "ossetic": "os", "punjabi": "pa", "pali": "pi", "polish": "pl", "portuguese": "pt", "pashto": "ps", "quechua": "qu", "romansh": "rm", "romanian": "ro", "rundi": "rn", "russian": "ru", "sango": "sg", "sanskrit": "sa", "sinhala": "si", "slovak": "sk", "slovenian": "sl", "northern sami": "se", "samoan": "sm", "shona": "sn", "sindhi": "sd", "somali": "so", "southern sotho": "st", "spanish": "es", "albanian": "sq", "sardinian": "sc", "serbian": "sr", "swati": "ss", "sundanese": "su", "swahili": "sw", "swedish": "sv", "tahitian": "ty", "tamil": "ta", "tatar": "tt", "telugu": "te", "tajik": "tg", "filipino": "tl", "thai": "th", "tigrinya": "ti", "tongan": "to", "tswana": "tn", "tsonga": "ts", "turkmen": "tk", "turkish": "tr", "uyghur": "ug", "ukrainian": "uk", "urdu": "ur", "uzbek": "uz", "venda": "ve", "vietnamese": "vi", "volapük": "vo", "walloon": "wa", "wolof": "wo", "xhosa": "xh", "yiddish": "yi", "yoruba": "yo", "zhuang": "za", "chinese": "zh", "zulu": "zu"
}