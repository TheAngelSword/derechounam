import { createFileRoute } from "@tanstack/react-router";
import { dailyLegalFeed } from "@/lib/aura/quotes";
export const Route=createFileRoute("/api/frases")({
 server:{handlers:{
  GET:()=>Response.json(dailyLegalFeed(),{
   headers:{"Cache-Control":"public, max-age=300, stale-while-revalidate=600","Access-Control-Allow-Origin":"https://derechounam.com"}
  })
 }}
});
