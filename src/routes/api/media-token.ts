import { createFileRoute } from "@tanstack/react-router";
export const Route=createFileRoute("/api/media-token")({server:{handlers:{POST:async()=>Response.json({error:"Ruta antigua retirada. Actualiza el portal: las nuevas cargas se realizan en Google Drive."},{status:410})}}});
