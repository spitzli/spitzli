import config from "@payload-config";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getPayload } from "payload";
import { cmsUser } from "@/webdock-cms/server";

export async function requireCMSOperator() {
  const user = await cmsUser(await getPayload({ config }), await headers());
  if (!user) redirect("/api/sso/login?returnTo=/system");
  if (user.role !== "operator") notFound();
  return user;
}
