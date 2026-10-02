import type { Config } from "@puckeditor/core";

export type PuckComponents = {
  HeadingBlock: { title: string; level: "h1" | "h2" | "h3" };
  TextBlock: { text: string; align: "start" | "center" | "end" };
};

export const puckConfig: Config<PuckComponents> = {
  categories: {
    basic: { title: "المحتوى الأساسي", components: ["HeadingBlock", "TextBlock"] }
  },
  components: {
    HeadingBlock: {
      label: "عنوان",
      fields: {
        title: { type: "text", label: "نص العنوان" },
        level: {
          type: "select",
          label: "مستوى العنوان",
          options: [
            { label: "عنوان رئيسي H1", value: "h1" },
            { label: "عنوان H2", value: "h2" },
            { label: "عنوان H3", value: "h3" }
          ]
        }
      },
      defaultProps: { title: "عنوان جديد", level: "h2" },
      render: ({ title, level }) => {
        const Tag = level;
        return <Tag className="puck-site-heading">{title}</Tag>;
      }
    },
    TextBlock: {
      label: "نص",
      fields: {
        text: { type: "textarea", label: "النص", placeholder: "اكتب النص هنا..." },
        align: {
          type: "select",
          label: "المحاذاة",
          options: [
            { label: "بداية السطر", value: "start" },
            { label: "وسط", value: "center" },
            { label: "نهاية السطر", value: "end" }
          ]
        }
      },
      defaultProps: { text: "اكتب محتوى الصفحة هنا.", align: "start" },
      render: ({ text, align }) => <p className="puck-site-text" style={{ textAlign: align }}>{text}</p>
    }
  }
};
