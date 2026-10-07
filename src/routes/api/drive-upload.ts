import { createFileRoute } from "@tanstack/react-router";
import { assertRequestOrigin, requireMemberRequest, readSmallJson, apiError, HttpError } from "@/lib/access.server";
import { validateUpload } from "@/lib/drive/validation";
import { beginDriveUpload } from "@/lib/drive/service.server";
export const Route = createFileRoute("/api/drive-upload")({server:{handlers:{POST:async ({request}) => {
  try {
    assertRequestOrigin(request); const userId=await requireMemberRequest(request);
    const body=await readSmallJson(request); let input;
    try { input=validateUpload(body); } catch(error) { throw new HttpError(400,error instanceof Error ? error.message : "Archivo no válido."); }
    if (input.category === "noticias") await requireMemberRequest(request,true);
    const origin=process.env.APP_PUBLIC_URL ? new URL(process.env.APP_PUBLIC_URL).origin : new URL(request.url).origin;
    return Response.json(await beginDriveUpload(userId,input,origin),{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return apiError(error); }
}}}});
