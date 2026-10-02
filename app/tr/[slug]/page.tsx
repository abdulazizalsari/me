import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPuckPage } from "@/lib/cms/puck";
import { PublicPuckPage } from "@/components/puck/PublicPuckPage";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const page=await getPuckPage(slug);if(!page||page.status!=="published")return{};return{title:page.titleEn||page.titleAr||slug};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const page=await getPuckPage(slug);if(!page||page.status!=="published")notFound();return <PublicPuckPage slug={slug} locale="tr"/>;}
