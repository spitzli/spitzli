import config from "@payload-config";
import { getPayload } from "payload";
import { cmsOptions } from "@/lib/cms";
import { handleCMSRequest } from "@/webdock-cms/server";

export const dynamic = "force-dynamic";
const handle = (request: Request) =>
  handleCMSRequest(request, cmsOptions, () => getPayload({ config }));

export { handle as GET, handle as POST, handle as DELETE };
