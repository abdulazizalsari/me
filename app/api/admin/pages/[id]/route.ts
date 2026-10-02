import { NextResponse } from "next/server";
import { getCurrentAdmin, getCurrentCmsUser } from "@/lib/cms/auth";
import { deletePuckPage, savePuckPage } from "@/lib/cms/puck";

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}) {
  const user=await getCurrentCmsUser();
  if(!user) return NextResponse.json({ok:false,message:"غير مصرح."},{status:401});
  const {id}=await params;
  const body=await request.json().catch(()=>null) as {data?:Record<string,unknown>;locale?:string;status?:"draft"|"published"|"archived";titleAr?:string;titleEn?:string;seo?:Record<string,unknown>}|null;
  if(!body) return NextResponse.json({ok:false,message:"بيانات غير صالحة."},{status:400});
  if(body.data && !Array.isArray((body.data as {content?:unknown}).content)) return NextResponse.json({ok:false,message:"بيانات Puck غير صالحة."},{status:400});
  const page=await savePuckPage(id,{data:body.data,userId:user.id,locale:body.locale,status:body.status,titleAr:body.titleAr,titleEn:body.titleEn,seo:body.seo});
  if(!page) return NextResponse.json({ok:false,message:"الصفحة غير موجودة."},{status:404});
  return NextResponse.json({ok:true,page});
}
export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}) {
  if(!await getCurrentAdmin()) return NextResponse.json({ok:false,message:"الحذف للمدير فقط."},{status:403});
  const {id}=await params; await deletePuckPage(id); return NextResponse.json({ok:true});
}
