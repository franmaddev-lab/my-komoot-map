import { NextResponse } from "next/server";

export async function GET() {
  const tests = await Promise.all([
    probe("https://api.komoot.de/v007/account"),
    probe("https://api.komoot.de/v007/account?email=test%40test.com"),
    probe("https://account.komoot.com/v1/signin", "POST"),
  ]);

  return NextResponse.json({ tests });
}

async function probe(url: string, method = "GET") {
  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: "Basic dGVzdEB0ZXN0LmNvbTp3cm9uZw==",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; my-komoot-map/1.0)",
      },
      redirect: "manual",
    });
    const body = await res.text();
    return { url, method, status: res.status, body: body.slice(0, 300) };
  } catch (e) {
    return { url, method, status: "error", body: String(e) };
  }
}
