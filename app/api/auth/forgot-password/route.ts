import { NextResponse } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase-config";
export async function POST(request:Request){
 const body=await request.json().catch(()=>null) as {email?:string}|null; const email=body?.email?.trim().toLowerCase();
 if(!email)return NextResponse.json({ok:false,message:"البريد الإلكتروني مطلوب."},{status:400});
 const response=await fetch(`${SUPABASE_URL}/auth/v1/recover`,{method:"POST",headers:{apikey:SUPABASE_PUBLISHABLE_KEY,"Content-Type":"application/json"},body:JSON.stringify({email,redirect_to:"https://abdulazizalsari.net/dashboard/reset-password"}),cache:"no-store"});
 if(!response.ok)return NextResponse.json({ok:false,message:"تعذر إرسال رسالة الاستعادة حالياً."},{status:400});
 return NextResponse.json({ok:true,message:"إذا كان البريد مرتبطاً بحساب، ستصل إليه رسالة لاستعادة كلمة المرور."});
}