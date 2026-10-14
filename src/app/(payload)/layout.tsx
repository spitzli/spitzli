import config from "@payload-config";
import "@payloadcms/next/css";
import { handleServerFunctions, RootLayout } from "@payloadcms/next/layouts";
import type { ServerFunctionClient } from "payload";
import type { ReactNode } from "react";
import { requireCMSOperator } from "@/lib/cms-operator";
import { importMap } from "./system/importMap";

const serverFunction: ServerFunctionClient = async (args) => {
  "use server";
  await requireCMSOperator();
  return handleServerFunctions({ ...args, config, importMap });
};

export default async function Layout({ children }: { children: ReactNode }) {
  await requireCMSOperator();
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  );
}
