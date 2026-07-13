"use client";

import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { Skeleton } from "@/components/ui/skeleton";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full" />,
});

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    ["blockquote", "code-block"],
    ["link", "image"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "indent",
  "blockquote",
  "code-block",
  "link",
  "image",
];

type RichTextEditorProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
};

export function RichTextEditor({
  id,
  value,
  onChange,
  placeholder = "Tulis konten di sini...",
  readOnly = false,
  required = false,
}: RichTextEditorProps) {
  return (
    <div
      id={id}
      className="w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card text-card-foreground"
      data-slot="rich-text-editor"
      aria-required={required}
    >
      <ReactQuill
        className="min-w-0"
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </div>
  );
}
