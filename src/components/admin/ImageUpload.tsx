"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, Loader2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}

export function ImageUpload({ value, onChange, folder = "products" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Selecione uma imagem válida.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Imagem deve ter menos de 5MB.");
      return;
    }

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filename, file, { upsert: false });

    if (uploadError) {
      setError("Erro ao fazer upload. Verifique as permissões do bucket.");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("images").getPublicUrl(filename);
    onChange(data.publicUrl);
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      {/* Preview */}
      {value && (
        <div className="relative inline-block">
          <Image
            src={value}
            alt="Preview"
            width={120}
            height={150}
            className="object-cover rounded border border-gray-200"
            unoptimized
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
          >
            <X size={10} />
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          uploading ? "border-gray-300 bg-gray-50" : "border-gray-300 hover:border-[#8C2F39] hover:bg-[#fff8f8]"
        }`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <Loader2 size={24} className="animate-spin" />
            <span className="text-xs">Enviando...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <Upload size={20} />
            <span className="text-xs">Clique ou arraste uma imagem</span>
            <span className="text-[10px] text-gray-300">PNG, JPG, WEBP até 5MB</span>
          </div>
        )}
      </div>

      {/* URL manual fallback */}
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ou cole uma URL de imagem"
        className="w-full border border-gray-200 px-3 py-2 text-xs rounded outline-none focus:border-gray-400"
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
