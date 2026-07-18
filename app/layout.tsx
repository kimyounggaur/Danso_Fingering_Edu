import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const description =
    "숫자 버튼을 누르며 단소의 계이름, 운지법, 실제 음을 함께 익히는 모바일 학습 웹앱";

  return {
    metadataBase: new URL(origin),
    title: "단소 운지법 배우기",
    description,
    openGraph: {
      title: "단소 운지법 배우기",
      description,
      type: "website",
      locale: "ko_KR",
      url: origin,
    },
    twitter: {
      card: "summary",
      title: "단소 운지법 배우기",
      description,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
