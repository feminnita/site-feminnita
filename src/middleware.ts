import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/minha-conta", "/meus-pedidos", "/favoritos"];

// A/B test experiment definitions
const EXPERIMENTS = [
  {
    id: "hero_cta",
    variants: [
      { id: "control", weight: 50 },   // CTA padrão
      { id: "variant_a", weight: 50 }, // CTA alternativo
    ],
  },
  {
    id: "product_layout",
    variants: [
      { id: "control", weight: 50 },   // layout atual
      { id: "variant_a", weight: 50 }, // layout com trust badges em destaque
    ],
  },
];

function assignVariant(variants: { id: string; weight: number }[]): string {
  const rand = Math.random() * 100;
  let acc = 0;
  for (const v of variants) {
    acc += v.weight;
    if (rand < acc) return v.id;
  }
  return variants[variants.length - 1].id;
}

export async function middleware(request: NextRequest) {
  // Subdomínio do blog: blog.feminnita.com.br abre direto o blog na raiz
  const host = request.headers.get("host") || "";
  if (host.startsWith("blog.") && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/blog";
    return NextResponse.rewrite(url);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return assignABCookies(request, NextResponse.next({ request }));
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    const isProtected = protectedRoutes.some((r) =>
      request.nextUrl.pathname.startsWith(r)
    );

    if (isProtected && !user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Área administrativa: exige usuário logado E que seja admin
    if (request.nextUrl.pathname.startsWith("/admin")) {
      if (!user) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }
      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();
      if (!adminRow) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
  } catch {
    return NextResponse.next({ request });
  }

  return assignABCookies(request, supabaseResponse);
}

function assignABCookies(req: NextRequest, res: NextResponse): NextResponse {
  const accept = req.headers.get("accept") || "";
  if (!accept.includes("text/html")) return res;

  for (const exp of EXPERIMENTS) {
    const cookieName = `ab_${exp.id}`;
    if (!req.cookies.has(cookieName)) {
      const variant = assignVariant(exp.variants);
      res.cookies.set(cookieName, variant, {
        maxAge: 60 * 60 * 24 * 30,
        httpOnly: false,
        sameSite: "lax",
        path: "/",
      });
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)"],
};
