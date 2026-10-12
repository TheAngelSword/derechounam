export type AuraStation={id:string;name:string;genre:string;urls:string[]};
const soma=(id:string,name:string,genre:string):AuraStation=>({id,name:"SomaFM · "+name,genre,urls:[5,2,4].map(n=>"https://ice"+n+".somafm.com/"+id+"-128-mp3")});
const fip=(id:string,name:string,genre:string):AuraStation=>({id,name:"FIP · "+name,genre,urls:["https://icecast.radiofrance.fr/"+id+"-midfi.mp3","https://icecast.radiofrance.fr/"+id+"-hifi.aac"]});
const direct=(id:string,name:string,genre:string,urls:string[]):AuraStation=>({id,name,genre,urls});
const groups:{genre:string;kind:"soma"|"fip";entries:[string,string][]}[]=[
 {genre:"Jazz",kind:"soma",entries:[["sonicuniverse","Sonic Universe"],["bossa","Bossa Beyond"],["illstreet","Illinois Street Lounge"],["secretagent","Secret Agent"]]},
 {genre:"Chill",kind:"soma",entries:[["groovesalad","Groove Salad"],["lush","Lush"],["fluid","Fluid"],["beatblender","Beat Blender"],["vaporwaves","Vaporwaves"],["cliqhop","cliqhop idm"]]},
 {genre:"Ambiente",kind:"soma",entries:[["spacestation","Space Station"],["deepspaceone","Deep Space One"],["dronezone","Drone Zone"],["missioncontrol","Mission Control"],["synphaera","Synphaera"]]},
 {genre:"Rock y pop",kind:"soma",entries:[["u80s","Underground 80s"],["seventies","Left Coast 70s"],["indiepop","Indie Pop Rocks"],["poptron","PopTron"],["bootliquor","Boot Liquor"],["metal","Metal Detector"]]},
 {genre:"Mundo",kind:"soma",entries:[["suburbsofgoa","Suburbs of Goa"],["folkfwd","Folk Forward"],["thistle","ThistleRadio"]]},
 {genre:"Concentración",kind:"soma",entries:[["defcon","DEF CON Radio"],["sf1033","SF 10-33"],["n5md","n5MD Radio"]]},
 {genre:"Jazz",kind:"fip",entries:[["fipjazz","Jazz"]]},
 {genre:"Ecléctica",kind:"fip",entries:[["fip","Éclectique"]]},
 {genre:"Chill",kind:"fip",entries:[["fipelectro","Electro"],["fipgroove","Groove"]]},
 {genre:"Rock y pop",kind:"fip",entries:[["fiprock","Rock"],["fippop","Pop"],["fipnouveautes","Nouveautés"]]},
 {genre:"Mundo",kind:"fip",entries:[["fipworld","Monde"],["fipreggae","Reggae"]]}
];
export const AURA_STATIONS:AuraStation[]=[
 direct("swissclassic","Radio Swiss Classic","Clásica",["https://stream.srg-ssr.ch/m/rsc_de/mp3_128"]),
 direct("swissjazz","Radio Swiss Jazz","Jazz",["https://stream.srg-ssr.ch/m/rsj/mp3_128"]),
 direct("paradise","Radio Paradise · Principal","Ecléctica",["https://stream.radioparadise.com/mp3-128","https://stream-dc1.radioparadise.com/mp3-128"]),
 ...(["mellow","rock","global"] as const).map(id=>direct("paradise"+id,"Radio Paradise · "+id[0].toUpperCase()+id.slice(1),id==="rock"?"Rock y pop":"Ecléctica",["https://stream.radioparadise.com/"+id+"-128"])),
 direct("kexp","KEXP 90.3 · Seattle","Ecléctica",["https://kexp-mp3-128.streamguys1.com/kexp128.mp3"]),
 direct("swisspop","Radio Swiss Pop","Rock y pop",["https://stream.srg-ssr.ch/m/rsp/mp3_128"]),
 ...groups.flatMap(g=>g.entries.map(([id,name])=>g.kind==="soma"?soma(id,name,g.genre):fip(id,name,g.genre)))
];
export const AURA_STATION_GENRES=[...new Set(AURA_STATIONS.map(s=>s.genre))];
