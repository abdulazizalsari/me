# تقرير تسليم نظام CMS / Admin Dashboard

## ما تم إنشاؤه

- لوحة تحكم عربية RTL على المسار `/dashboard`.
- مسارات مستقلة لأقسام لوحة التحكم مثل `/dashboard/articles` و`/dashboard/courses` و`/dashboard/integrations`.
- دعم Deep Linking للتحرير عبر مسارات مثل `/dashboard/courses/wordpress-course`.
- قفل محرر القسم عند الدخول من مسار مستقل حتى لا يتم خلط المقالات بالخدمات أو الدورات أو التكاملات.
- نظام تسجيل دخول إداري بجلسات آمنة عبر cookie باسم `aas_cms_session`.
- إدارة محتوى عامة للصفحة الرئيسية، الخدمات، الدورات، المشاريع، المقالات، الصفحات، الهيدر، الفوتر، CTA، SEO، واتساب، والخصوصية.
- إدارة حالات المحتوى: مسودة، منشور، مجدول، مؤرشف.
- حذف ناعم مع أرشيف قابل للاسترجاع من تبويب `الأرشيف`.
- Autosave محلي داخل المتصفح مع زر استرجاع.
- Revisions لكل تعديل، مع عرض واسترجاع النسخ السابقة.
- مكتبة وسائط مع رفع، رفع متعدد داخل المنتقي، سحب وإفلات، لصق من الحافظة، استيراد من رابط، ALT عربي/إنجليزي، حماية الصور، watermark، وتوليد WebP/AVIF عند الطلب عبر `sharp`.
- Media Picker موحد للصور الرئيسية والمعارض.
- إدارة رسائل التواصل والاستشارات في تبويب `النماذج والرسائل`.
- Redirect Manager يدعم 301 و302 و410.
- إنشاء redirect تلقائي عند تغيير slug للمقالات والخدمات والدورات.
- مراقبة 404 وتسجيل الروابط غير الموجودة داخل قاعدة البيانات.
- SEO داخلي لكل عنصر: title، description، canonical، OG image، Twitter image، Schema، Google preview، وعدادات حروف.
- قسم مستقل للتكاملات يدير Google Search Console وGA4 وGTM وAdSense وBing Webmaster.
- تحميل أكواد التكاملات في رأس/جسم الموقع فقط عند تفعيلها من لوحة التحكم وبقيم صحيحة.
- ترحيل آمن للدورات القديمة المعروضة سابقاً ضمن المشاريع إلى نوع `course` عند غيابها، بدون حذف الأصل أو إنشاء تكرارات.
- ربط صفحات التدريب والصفحة الرئيسية بمصدر `course` مع fallback آمن للبيانات القديمة.
- Import / Export للمقالات عبر XLSX/CSV من قسم المقالات.
- Preview قبل الاستيراد يعرض عدد الصفوف، الصالح، غير الصالح، الجديد، الموجود، والتحذيرات.
- Duplicate Detection للمقالات عبر WordPress ID / External ID / Slug / Title.
- Duplicate Strategy: Skip Existing، Update Existing، Create New Copy.
- Export للمقالات بصيغة CMS وصيغة WordPress-Compatible.
- Download Import Template بصيغة XLSX مع صفحة تعليمات.
- الحفاظ على HTML المقالات عند الاستيراد مع تنظيف scripts/iframe والأحداث غير الآمنة.
- Sitemap يقرأ المقالات المنشورة من قاعدة البيانات ويربط النسخ الإنجليزية المنشورة.
- نسخ احتياطي SQLite من تبويب الإعدادات.

## بنية الإدارة

- صفحة اللوحة: `app/dashboard/page.tsx`
- مسارات Modules: `app/dashboard/[...module]/page.tsx`
- واجهة اللوحة: `app/dashboard/Dashboard.tsx`
- تسجيل الدخول: `app/dashboard/login/page.tsx`
- API المحتوى: `app/api/admin/content`
- API الوسائط: `app/api/admin/media`
- API النسخ السابقة: `app/api/admin/revisions/[id]`
- API الأرشيف: `app/api/admin/trash/[id]`
- API التحويلات: `app/api/admin/redirects`
- API الرسائل: `app/api/admin/submissions`
- API النسخ الاحتياطي: `app/api/admin/backup`
- API النماذج العامة: `app/api/forms`
- API استيراد/تصدير المقالات: `app/api/admin/articles/import-export`
- Catch-all للـ redirects و404: `app/[...path]/page.tsx`
- ربط التكاملات العامة: `app/layout.tsx`

## قاعدة البيانات

قاعدة البيانات المحلية:

```txt
.data/abdulaziz-cms.sqlite
```

الجداول الأساسية:

- `users`
- `sessions`
- `content_items`
- `media_assets`
- `content_revisions`
- `activity_logs`
- `redirects`
- `form_submissions`
- `not_found_hits`

أنواع محتوى CMS المهمة:

- `article`
- `service`
- `course`
- `project`
- `experience`
- `skill`
- `homepage`
- `navigation`
- `footer`
- `seo`
- `integration`
- `privacy`

## طريقة الدخول للإدارة

إنشاء أو تحديث مدير:

```bash
npm run admin:create -- --email admin@example.com --password strong-password
```

ثم الدخول من:

```txt
http://localhost:3000/dashboard
```

## طريقة إدارة المحتوى

- المقالات من تبويب `رؤى`.
- الخدمات من تبويب `الخدمات`.
- الدورات من تبويب `الدورات` أو المسار `/dashboard/courses`.
- المشاريع من تبويب `المشاريع`.
- التكاملات من تبويب `التكاملات` أو المسار `/dashboard/integrations`.
- Import / Export من داخل تبويب `رؤى` / `/dashboard/articles`.
- الصفحة الرئيسية من تبويب `الصفحة الرئيسية`.
- الهيدر من تبويب `التنقل`.
- الفوتر من تبويب `الفوتر`.
- الرسائل من تبويب `النماذج والرسائل`.
- التحويلات و404 من تبويب `Redirects`.
- النسخ الاحتياطي من تبويب `الإعدادات`.

## أوامر التشغيل والبناء

```bash
npm run dev
npm run typecheck
npm run build
npm run start
```

## ملاحظات النشر والصيانة

- يجب حفظ مجلد `.data` كاملاً في النسخ الاحتياطي لأنه يحتوي قاعدة البيانات وأصول الصور الأصلية.
- في الإنتاج، يفضل جدولة نسخة يومية من `.data`.
- تخزين SQLite مناسب للموقع الشخصي/المؤسسي الخفيف، أما التحرير الجماعي الكثيف فيحتاج ترحيلًا لاحقًا إلى PostgreSQL أو خدمة CMS خارجية.
- المحرر الحالي يوفر أدوات rich text مبسطة بصيغة HTML. يمكن استبداله لاحقًا بـ Tiptap الكامل إذا رغبت بتجربة تحرير كتلية متقدمة.
- تمت إضافة حزمة `xlsx` لدعم ملفات Excel. أظهر `npm audit` ملاحظة high severity في شجرة الاعتماد؛ لم يتم تشغيل إصلاح تلقائي حتى لا يغيّر التبعيات بشكل واسع دون مراجعة.
