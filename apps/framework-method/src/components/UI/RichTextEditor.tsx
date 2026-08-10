import { useEffect, useRef, useState } from "react";
import { FiBold, FiItalic, FiList, FiImage, FiType } from "react-icons/fi";
import clsx from "clsx";

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor = ({ value = "", onChange, placeholder, className }: RichTextEditorProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (ref.current && !focused && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value, focused]);

  const handleInput = () => {
    const next = ref.current?.innerHTML || "";
    onChange?.(next);
  };

  const exec = (command: string, valueArg?: string) => {
    if (!ref.current) return;
    ref.current.focus();
    document.execCommand(command, false, valueArg);
    handleInput();
  };

  const insertImage = () => {
    const url = window.prompt("Nhập URL ảnh / Enter image URL");
    if (!url) return;
    exec("insertHTML", `<img src="${url}" class="rounded-xl max-w-full h-auto my-2" />`);
  };

  return (
    <div className={clsx("rounded-2xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden bg-white dark:bg-[#1C1C1E]", className)}>
      <div className="flex items-center gap-1 px-2 py-2 border-b border-black/[0.04] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.04]">
        <ToolbarButton icon={<FiBold />} label="Bold" onClick={() => exec("bold")} />
        <ToolbarButton icon={<FiItalic />} label="Italic" onClick={() => exec("italic")} />
        <ToolbarButton icon={<FiType />} label="Heading" onClick={() => exec("formatBlock", "H3")} />
        <ToolbarButton icon={<FiList />} label="List" onClick={() => exec("insertUnorderedList")} />
        <ToolbarButton icon={<FiImage />} label="Image" onClick={insertImage} />
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onInput={handleInput}
        className="p-3 min-h-[6rem] text-sm leading-relaxed outline-none text-gray-800 dark:text-gray-200 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none"
        data-placeholder={placeholder || "Nhập nội dung..."}
        style={{ whiteSpace: "pre-wrap" }}
      />
    </div>
  );
};

const ToolbarButton = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors"
  >
    {icon}
  </button>
);

export default RichTextEditor;
