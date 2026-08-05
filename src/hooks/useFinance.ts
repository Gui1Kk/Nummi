import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { financeService } from "../services/finance";
import { supabase } from "../lib/supabase";
import { monthEnd, monthKey, monthStart, todayIso } from "../lib/format";
import { monthSummary } from "../lib/money";
import type { FinanceSnapshot, MonthSummary } from "../types";

const emptySnapshot:FinanceSnapshot={profile:null,settings:null,categories:[],transactions:[],recurringRules:[],subscriptions:[],budgets:[],notifications:[]};
function clearAuthReturnParameters(){const url=new URL(window.location.href);["auth","error","error_code","error_description"].forEach(key=>url.searchParams.delete(key));window.history.replaceState({},"",url)}

export function useFinance(){
 const[session,setSession]=useState<Session|null>(null);const[snapshot,setSnapshot]=useState<FinanceSnapshot>(emptySnapshot);
 const[activeMonth,setActiveMonth]=useState(()=>monthKey());const[loading,setLoading]=useState(true);const[refreshing,setRefreshing]=useState(false);
 const[error,setError]=useState<string|null>(null);const[recoveryMode,setRecoveryMode]=useState(false);const mounted=useRef(true);
 const refresh=useCallback(async(processDue=false)=>{setRefreshing(true);setError(null);try{const timezone=snapshot.profile?.timezone??"America/Porto_Velho";if(processDue)await financeService.postDueItems(todayIso(timezone));const next=await financeService.loadSnapshot(monthStart(activeMonth),monthEnd(activeMonth));if(mounted.current)setSnapshot(next)}catch(caught){if(mounted.current)setError(caught instanceof Error?caught.message:"Não foi possível carregar os dados.")}finally{if(mounted.current)setRefreshing(false)}},[activeMonth,snapshot.profile?.timezone]);

 useEffect(()=>{mounted.current=true;let active=true;const initialUrl=new URL(window.location.href);const requestedRecovery=initialUrl.searchParams.get("auth")==="recovery";const authErrorCode=initialUrl.searchParams.get("error_code");if(authErrorCode){setError(authErrorCode==="otp_expired"?"Este link expirou ou já foi utilizado. Solicite uma nova recuperação de senha.":"O link de autenticação não pôde ser validado. Solicite um novo e-mail.");clearAuthReturnParameters()}
 void supabase.auth.getSession().then(({data,error:sessionError})=>{if(!active)return;if(sessionError)setError("Não foi possível restaurar a sessão com segurança.");setSession(data.session);setRecoveryMode(Boolean(data.session&&requestedRecovery));setLoading(false);if(requestedRecovery&&!data.session&&!authErrorCode){setError("O link de recuperação é inválido ou expirou. Solicite um novo e-mail.");clearAuthReturnParameters()}if(data.session&&!requestedRecovery)void refresh(true)});
 const{data:listener}=supabase.auth.onAuthStateChange((event,nextSession)=>{if(!active)return;setSession(nextSession);if(event==="PASSWORD_RECOVERY"){setRecoveryMode(true);setError(null);return}if(!nextSession){setSnapshot(emptySnapshot);setRecoveryMode(false);return}if(event==="SIGNED_IN"||event==="TOKEN_REFRESHED"||event==="USER_UPDATED")void refresh(event==="SIGNED_IN")});
 const onOffline=()=>setError("Você está sem conexão. Alterações ficam bloqueadas até a internet voltar.");const onOnline=()=>{setError(null);void supabase.auth.getSession().then(({data})=>{if(data.session)void refresh(false)})};window.addEventListener("online",onOnline);window.addEventListener("offline",onOffline);
 return()=>{active=false;mounted.current=false;listener.subscription.unsubscribe();window.removeEventListener("online",onOnline);window.removeEventListener("offline",onOffline)}},[refresh]);

 const previousMonth=useRef(activeMonth);useEffect(()=>{if(previousMonth.current===activeMonth){previousMonth.current=activeMonth;return}previousMonth.current=activeMonth;if(session)void refresh(false)},[activeMonth,session,refresh]);
 const summaryForMonth=useCallback((_month:string):MonthSummary=>monthSummary(snapshot.transactions),[snapshot.transactions]);
 const categoryById=useMemo(()=>new Map(snapshot.categories.map(category=>[category.id,category])),[snapshot.categories]);
 return{session,snapshot,activeMonth,setActiveMonth,loading,refreshing,error,setError,refresh,summaryForMonth,categoryById,recoveryMode,finishRecovery:()=>{setRecoveryMode(false);clearAuthReturnParameters()}};
}
