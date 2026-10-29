import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
export const loadArticleMedia=createServerFn({method:"GET"})
 .validator(z.object({url:z.string().url().max(2000)}))
 .handler(async({data})=>{const {readKnownArticleMedia}=await import("./enrich.server");return readKnownArticleMedia(data.url);});
