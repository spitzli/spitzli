import config from "@payload-config";
import { generatePageMetadata, RootPage } from "@payloadcms/next/views";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminSSORedirect } from "@/lib/payload-sso";
import { importMap } from "../importMap";

type Args = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] }>;
};
export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams });

export default async function Page({ params, searchParams }: Args) {
  const destination = adminSSORedirect(
    process.env.WEBDOCK_SSO_ENFORCE === "true",
    (await params).segments,
    await searchParams,
  );
  if (destination) redirect(destination);
  return RootPage({ config, params, searchParams, importMap });
}
