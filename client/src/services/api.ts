const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Sem fallback hardcoded: um fallback silencioso para uma URL errada fez o
// front bater no backend errado sem ninguém perceber. Sem a env, falha em
// RUNTIME com mensagem (na hora da requisição) — não no build, que quebraria
// dev/CI onde NEXT_PUBLIC_API_URL não existe.
function apiUrl(): string {
    if (!API_URL) {
        throw new Error(
            "NEXT_PUBLIC_API_URL não configurada — defina a URL do backend no ambiente.",
        );
    }
    return API_URL;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}


async function send<T>(method: string, path: string, body?: unknown): Promise<T | null> {

  const base = apiUrl();
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method,
      credentials: "include",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      // Sem timeout, um backend que não responde deixa a tela girando pra
      // sempre (ex.: "Finalizar Pedido"). 35s cobre o cold-start da Render e
      // ainda vem depois do timeout de 20s do Asaas no backend.
      signal: AbortSignal.timeout(35000),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new ApiError("O servidor demorou para responder. Tente novamente.", 408);
    }
    throw new ApiError("Falha de conexão. Verifique sua internet e tente novamente.", 0);
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      (data as { error?: string } | null)?.error ?? "Erro inesperado. Tente novamente",
      response.status,
    );
  }

  return data as T | null;
}

export async function apiGet<T>(path: string): Promise<T | null> {
  const base = apiUrl();
  try {
    const response = await fetch(`${base}${path}`, {
      credentials: "include",
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T | null> {
  return send<T>("POST", path, body);
}

export function apiPut<T>(path: string, body?: unknown): Promise<T | null> {
  return send<T>("PUT", path, body);
}


export { API_URL };
