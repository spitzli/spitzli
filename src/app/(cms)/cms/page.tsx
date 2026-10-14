import config from "@payload-config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import { cmsOptions } from "@/lib/cms";
import { CMSApp } from "@/webdock-cms/client";
import { cmsUser } from "@/webdock-cms/server";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await cmsUser(await getPayload({ config }), await headers());
  if (!user) redirect("/api/sso/login?returnTo=/cms");
  const issuer = process.env.WEBDOCK_AUTH_ISSUER || "https://auth.webdock.dev/api/auth";
  return (
    <CMSApp
      siteName={cmsOptions.siteName}
      siteURL={cmsOptions.siteURL}
      accountURL={new URL("/account", issuer).toString()}
      accessURL={new URL("/people", issuer).toString()}
      technicalURL={user.role === "operator" ? "/system" : undefined}
    />
  );
}
