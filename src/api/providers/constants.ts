import { X_KILOCODE_VERSION } from "../../shared/kilocode/headers"
import { Package } from "../../shared/package"

export const DEFAULT_HEADERS = {
	"HTTP-Referer": "https://kilocode.ai",
	"X-Title": "NoCodr",
	[X_KILOCODE_VERSION]: Package.version,
	"User-Agent": `Kilo-Code/${Package.version}`,
}
