/**
 * Cloudflare Workers エントリポイント。
 *
 * `build/` の静的アセットを配信する前に BASIC 認証をかける。
 * 認証情報は wrangler の secret（本番）/ `.dev.vars`（ローカル）から読む。
 * どちらも未設定なら常に 401 を返す（フェイルクローズ）。
 */

export interface Env {
	ASSETS: Fetcher;
	BASIC_AUTH_USER?: string;
	BASIC_AUTH_PASS?: string;
}

const REALM = 'Teaser';

export default {
	async fetch(request, env) {
		if (!(await isAuthorized(request, env))) {
			return unauthorized();
		}

		return env.ASSETS.fetch(request);
	}
} satisfies ExportedHandler<Env>;

function unauthorized(): Response {
	return new Response('401 Unauthorized\n', {
		status: 401,
		headers: {
			'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'no-store'
		}
	});
}

async function isAuthorized(request: Request, env: Env): Promise<boolean> {
	const expectedUser = env.BASIC_AUTH_USER;
	const expectedPass = env.BASIC_AUTH_PASS;

	// 認証情報が未設定なら誰も通さない。
	if (!expectedUser || !expectedPass) {
		return false;
	}

	const credentials = parseBasicAuth(request.headers.get('Authorization'));
	if (!credentials) {
		return false;
	}

	// 短絡評価で比較回数が変わらないよう、両方を評価してから AND を取る。
	const [userMatches, passMatches] = await Promise.all([
		safeEqual(credentials.user, expectedUser),
		safeEqual(credentials.pass, expectedPass)
	]);

	return userMatches && passMatches;
}

function parseBasicAuth(header: string | null): { user: string; pass: string } | null {
	if (!header) {
		return null;
	}

	const [scheme, encoded] = header.split(' ');
	if (!encoded || scheme.toLowerCase() !== 'basic') {
		return null;
	}

	let decoded: string;
	try {
		// atob はバイナリ文字列を返すので、UTF-8 として明示的にデコードする。
		const binary = atob(encoded);
		const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
		decoded = new TextDecoder().decode(bytes);
	} catch {
		return null;
	}

	// パスワードに ':' が含まれてもよいよう、最初の ':' だけで分割する。
	const separator = decoded.indexOf(':');
	if (separator === -1) {
		return null;
	}

	return {
		user: decoded.slice(0, separator),
		pass: decoded.slice(separator + 1)
	};
}

/**
 * SHA-256 に通してから比較する。
 * 長さの違いで比較時間が変わらず、文字列長も漏れない。
 */
async function safeEqual(a: string, b: string): Promise<boolean> {
	const [digestA, digestB] = await Promise.all([sha256(a), sha256(b)]);

	let diff = 0;
	for (let i = 0; i < digestA.length; i++) {
		diff |= digestA[i] ^ digestB[i];
	}

	return diff === 0;
}

async function sha256(value: string): Promise<Uint8Array> {
	const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
	return new Uint8Array(buffer);
}
