"use client";

import type { PropsCategoryFilterAccordion } from "../../types/catalog/catalog";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export function CategoryFilterAccordion({
  items,
  selectedCategory,
  onSelect,
}: PropsCategoryFilterAccordion) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-0.5">
      {items.map((item) => {
        const isLeaf = item.level === 3;
        const isExpanded = expandedIds.has(item.id);

        return (
          <div key={item.id}>
            <button
              onClick={() =>
                isLeaf ? onSelect(item.name) : toggleExpanded(item.id)
              }
              className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                isLeaf && selectedCategory === item.name
                  ? "bg-[#8C2F39] text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {!isLeaf &&
                (isExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                ))}
              <span className={isLeaf ? "" : "font-medium"}>{item.name}</span>
            </button>

            {!isLeaf && isExpanded && item.children.length > 0 && (
              <div className="ml-4 border-l border-gray-100 pl-2">
                <CategoryFilterAccordion
                  items={item.children}
                  selectedCategory={selectedCategory}
                  onSelect={onSelect}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
