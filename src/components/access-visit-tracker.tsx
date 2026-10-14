import {useEffect,useRef} from 'react';
import {useRouterState} from '@tanstack/react-router';
import {useCurrentUserState} from '@/lib/auth/use-current-user';
import {logAccess} from '@/lib/members';
import {ACCESS_SECTIONS} from '@/lib/registry-model';
/** One tracker in the root; session refreshes and component rerenders are not new visits. */
export function AccessVisitTracker(){
 const path=useRouterState({select:s=>s.location.pathname}).replace(/\/+$/,'')||'/';
 const {user,isPending}=useCurrentUserState();const id=user?.id;
 const last=useRef<string|null>(null);
 useEffect(()=>{
  if(isPending)return;
  if(!id){last.current=null;return;}
  const area=path==='/'?'inicio':path.split('/')[1];
  if(!ACCESS_SECTIONS.some(s=>s.id===area)){last.current=null;return;}
  const key=id+':'+area;if(last.current===key)return;last.current=key;
  const eventId=typeof crypto.randomUUID==='function'?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  void logAccess({data:{area,action:'entrada',eventId}}).catch(()=>undefined);
 },[path,id,isPending]);
 return null;
}
