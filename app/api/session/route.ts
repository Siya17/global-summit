import { getRegulations, getSession } from "../../lib/db";
export const dynamic="force-dynamic";
export async function GET(request:Request){try{const code=new URL(request.url).searchParams.get("code")||"PEACE26";const[session,regulations]=await Promise.all([getSession(code),getRegulations()]);if(!session)return Response.json({error:"Session code not found."},{status:404});return Response.json({session,regulations})}catch(e){return Response.json({error:e instanceof Error?e.message:"Unable to load the summit."},{status:500})}}
