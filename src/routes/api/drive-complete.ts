import { createFileRoute } from "@tanstack/react-router";
import { assertRequestOrigin, requireMemberRequest, readSmallJson, apiError, HttpError } from "@/lib/access.server";
import { completeDriveUpload } from "@/lib/drive/service.server";
import { driveResourceUrl } from "@/lib/drive/validation";
export const Route = createFileRoute("/api/drive-complete")({server:{handlers:{POST:async ({request}) => {
  try {
    assertRequestOrigin(request); const userId=await requireMemberRequest(request);
    const body=await readSmallJson(request) as {uploadId?:string;fileId?:string};
    if (!/^[0-9a-f-]{36}$/i.test(body?.uploadId ?? "") || !/^[\w-]{10,200}$/.test(body?.fileId ?? "")) throw new HttpError(400,"Identificadores no válidos.");
    const result=await completeDriveUpload(userId,body.uploadId!,body.fileId!);
    const origin=process.env.APP_PUBLIC_URL || new URL(request.url).origin;
    return Response.json({ok:true,uploadId:body.uploadId,...result,url:driveResourceUrl(origin,body.uploadId!),path:`drive:${result.driveFileId}`},{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return apiError(error); }
}}}});
