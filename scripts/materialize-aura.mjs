/** Extract the original Aura Crono v3 clock engine from its pinned, vendored ZIP.
 * Runs before Vite in dev/build, with NO network access or database migration.
 * The package is a byte-identical copy of the user's Aura Crono project with a
 * self-contained same-origin portal bridge (embed.css and embed.js). */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { inflateRawSync } from "node:zlib";
import { createHash } from "node:crypto";
const source=resolve("vendor/aura-crono-v3-original.zip");
const zip=readFileSync(source);
const expected="c97b50cdf4e682f8dcdc50c7df4bdd9521fea78c64a40f44d976cd2f6d86c539";
if(createHash("sha256").update(zip).digest("hex")!==expected)throw Error("Aura Crono ZIP integrity mismatch");
let eocd=-1;
for(let p=zip.length-22;p>=Math.max(0,zip.length-65557);p--)if(zip.readUInt32LE(p)===0x06054b50){eocd=p;break;}
if(eocd<0)throw Error("Aura Crono ZIP EOCD not found");
const entries=zip.readUInt16LE(eocd+10),offset=zip.readUInt32LE(eocd+16);
let p=offset,extracted=0,total=0;
for(let i=0;i<entries;i++){
 if(zip.readUInt32LE(p)!==0x02014b50)throw Error("Aura Crono ZIP central directory invalid");
 const method=zip.readUInt16LE(p+10),compressed=zip.readUInt32LE(p+20),expectedSize=zip.readUInt32LE(p+24);
 const nameLength=zip.readUInt16LE(p+28),extraLength=zip.readUInt16LE(p+30),commentLength=zip.readUInt16LE(p+32),localOffset=zip.readUInt32LE(p+42);
 const name=zip.subarray(p+46,p+46+nameLength).toString("utf8");
 p+=46+nameLength+extraLength+commentLength;
 if(!name.startsWith("aura-native/")||name.endsWith("/"))continue;
 const basename=name.slice("aura-native/".length);
 if(!/^[a-z0-9._-]+$/i.test(basename)||!basename||expectedSize>2_000_000)throw Error("Invalid Aura Crono archive entry");
 if(zip.readUInt32LE(localOffset)!==0x04034b50)throw Error("Aura Crono ZIP local header invalid");
 const start=localOffset+30+zip.readUInt16LE(localOffset+26)+zip.readUInt16LE(localOffset+28);
 const encoded=zip.subarray(start,start+compressed);
 const content=method===8?inflateRawSync(encoded):method===0?encoded:null;
 if(!content||content.length!==expectedSize)throw Error("Invalid Aura Crono file: "+basename);
 const target=join("public","aura-native",basename);
 mkdirSync(dirname(target),{recursive:true});
 writeFileSync(target,content);
 extracted++;total+=content.length;
}
if(extracted<12||total<200_000)throw Error("Aura Crono original source was incomplete");
writeFileSync("public/aura-native/aura-embed-ready.txt","AURA_CRONO_V3_NATIVE_READY\n");
console.log("[aura] Original clock engine ready: "+extracted+" files, "+total+" bytes");
