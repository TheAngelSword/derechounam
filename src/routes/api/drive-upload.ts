import { createFileRoute } from "@tanstack/react-router";
import { assertRequestOrigin, requireMemberRequest, readSmallJson, apiError, HttpError } from "@/lib/access.server";
import { validateUpload } from "@/lib/drive/validation";
import { canonicalOrigin } from "@/lib/origin";
import { beginDriveUpload } from "@/lib/drive/service.server";
export const Route = createFileRoute("/api/drive-upload")({server:{handlers:{POST:async ({request}) => {
  try {
    assertRequestOrigin(request); const userId=await requireMemberRequest(request);
    const body=await readSmallJson(request); let input;
    try { input=validateUpload(body); } catch(error) { throw new HttpError(400,error instanceof Error ? error.message : "Archivo no válido."); }
    if (input.category === "noticias") await requireMemberRequest(request,true);
    // Google binds CORS to this value: it must be the page that uploads (already checked above).
    const origin=request.headers.get("origin") ?? canonicalOrigin(process.env.APP_PUBLIC_URL,request.url);
    return Response.json(await beginDriveUpload(userId,input,origin),{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return apiError(error); }
}}}});
