"use client";

import { useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Archive,
  BarChart3,
  CalendarDays,
  GripVertical,
  LayoutGrid,
  LogOut,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { getIcon } from "@/lib/icons";
import { CategoryModal } from "@/components/categories/CategoryModal";
import { SortableList, SortableRow } from "@/components/categories/SortableList";
import { Logo } from "@/components/ui/Logo";
import { HoverText } from "@/components/ui/HoverText";
import { IconButton } from "@/components/ui/Button";
import { TopoLines } from "@/components/ui/TopoLines";

type Category = Doc<"categories">;

const NAV = [
  { href: "/", label: "Today", icon: LayoutGrid },
  { href: "/history", label: "History", icon: CalendarDays },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const categories = useQuery(api.categories.list);
  const reorder = useMutation(api.categories.reorder);
  const archive = useMutation(api.categories.archive);
  const restore = useMutation(api.categories.restore);
  const removeCategory = useMutation(api.categories.remove);
  const { signOut } = useAuthActions();

  const confirmDelete = (cat: Category) => {
    if (
      window.confirm(
        `Delete “${cat.name}”? Its habits are removed but your completion history is kept. This can't be undone.`,
      )
    ) {
      removeCategory({ id: cat._id });
    }
  };

  const [creating, setCreating] = useState<{ parentId?: Id<"categories"> } | null>(
    null,
  );
  const [editing, setEditing] = useState<Category | null>(null);

  const { active, archived, childrenOf } = useMemo(() => {
    const all = categories ?? [];
    const active = all.filter((c) => !c.archived && !c.parentId);
    const archived = all.filter((c) => c.archived && !c.parentId);
    const childrenOf = (id: Id<"categories">) =>
      all
        .filter((c) => !c.archived && c.parentId === id)
        .sort((a, b) => a.order - b.order);
    return { active, archived, childrenOf };
  }, [categories]);

  return (
    <aside className="relative isolate flex h-screen w-[260px] shrink-0 flex-col overflow-hidden border-r border-border bg-surface-muted">
      <TopoLines />
      <div className="px-5 py-5">
        <Link
          href="/"
          className="group/logo inline-flex items-center gap-2 text-gray-900"
        >
          <Logo size={22} />
          <h1 className="text-lg font-semibold tracking-tight transition-transform duration-300 group-hover/logo:translate-x-0.5">
            Hexis
          </h1>
        </Link>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const activeLink = pathname === href;
          return (
            <motion.div key={href} whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={href}
                className={`group/btn flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-120 ${
                  activeLink
                    ? "bg-surface font-medium text-gray-900 shadow-card"
                    : "text-gray-600 hover:bg-surface"
                }`}
              >
                <Icon size={16} />
                <HoverText>{label}</HoverText>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="mt-6 flex items-center justify-between px-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Categories
        </span>
        <IconButton
          onClick={() => setCreating({})}
          className="rounded-md p-1 text-gray-400 transition-120 hover:bg-surface hover:text-gray-900"
          label="New category"
        >
          <Plus size={16} />
        </IconButton>
      </div>

      <div className="clean-scroll mt-2 flex-1 overflow-y-auto px-3 pb-4">
        {categories === undefined ? (
          <p className="px-2 text-sm text-gray-400">Loading…</p>
        ) : active.length === 0 ? (
          <p className="px-2 text-sm text-gray-400">
            No categories yet. Click + to add one.
          </p>
        ) : (
          <SortableList
            ids={active.map((c) => c._id)}
            onReorder={(ids) =>
              reorder({ orderedIds: ids as Id<"categories">[] })
            }
          >
            {active.map((cat) => (
              <SortableRow key={cat._id} id={cat._id}>
                {({ attributes, listeners }) => (
                  <CategoryNode
                    category={cat}
                    subcategories={childrenOf(cat._id)}
                    onEdit={() => setEditing(cat)}
                    onArchive={() => archive({ id: cat._id })}
                    onDelete={() => confirmDelete(cat)}
                    onAddSub={() => setCreating({ parentId: cat._id })}
                    onReorderSubs={(ids) =>
                      reorder({ orderedIds: ids as Id<"categories">[] })
                    }
                    onEditSub={(sub) => setEditing(sub)}
                    onArchiveSub={(id) => archive({ id })}
                    onDeleteSub={(sub) => confirmDelete(sub)}
                    dragHandle={
                      <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab text-gray-300 hover:text-gray-500"
                        aria-label="Drag to reorder"
                      >
                        <GripVertical size={14} />
                      </button>
                    }
                  />
                )}
              </SortableRow>
            ))}
          </SortableList>
        )}

        {archived.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <Archive size={12} /> Archive
            </div>
            <div className="mt-2 flex flex-col gap-0.5">
              {archived.map((cat) => {
                const Icon = getIcon(cat.icon);
                return (
                  <div
                    key={cat._id}
                    className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-400"
                  >
                    <Icon size={15} />
                    <span className="flex-1 truncate">{cat.name}</span>
                    <IconButton
                      onClick={() => restore({ id: cat._id })}
                      className="opacity-0 transition-120 hover:text-gray-700 group-hover:opacity-100"
                      label="Restore"
                    >
                      <RotateCcw size={14} />
                    </IconButton>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => signOut()}
        className="group/btn flex items-center gap-2 border-t border-border px-5 py-3 text-sm text-gray-500 transition-120 hover:text-gray-900"
      >
        <LogOut size={15} /> <HoverText>Sign out</HoverText>
      </button>

      {creating && (
        <CategoryModal
          open
          onClose={() => setCreating(null)}
          parentId={creating.parentId}
        />
      )}
      {editing && (
        <CategoryModal
          open
          onClose={() => setEditing(null)}
          existing={{
            id: editing._id,
            name: editing.name,
            color: editing.color,
            icon: editing.icon,
          }}
        />
      )}
    </aside>
  );
}

function CategoryNode({
  category,
  subcategories,
  onEdit,
  onArchive,
  onDelete,
  onAddSub,
  onReorderSubs,
  onEditSub,
  onArchiveSub,
  onDeleteSub,
  dragHandle,
}: {
  category: Category;
  subcategories: Category[];
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onAddSub: () => void;
  onReorderSubs: (ids: string[]) => void;
  onEditSub: (sub: Category) => void;
  onArchiveSub: (id: Id<"categories">) => void;
  onDeleteSub: (sub: Category) => void;
  dragHandle: React.ReactNode;
}) {
  const Icon = getIcon(category.icon);
  return (
    <div>
      <div className="group flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-120 hover:bg-surface">
        {dragHandle}
        <Icon size={15} style={{ color: category.color }} />
        <span className="flex-1 truncate font-medium text-gray-800">
          {category.name}
        </span>
        <RowActions
          onAddSub={onAddSub}
          onEdit={onEdit}
          onArchive={onArchive}
          onDelete={onDelete}
        />
      </div>

      {subcategories.length > 0 && (
        <div className="ml-4 border-l border-border pl-1">
          <SortableList
            ids={subcategories.map((s) => s._id)}
            onReorder={onReorderSubs}
          >
            {subcategories.map((sub) => {
              const SubIcon = getIcon(sub.icon);
              return (
                <SortableRow key={sub._id} id={sub._id}>
                  {({ attributes, listeners }) => (
                    <div className="group flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-gray-600 transition-120 hover:bg-surface">
                      <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab text-gray-300 hover:text-gray-500"
                        aria-label="Drag to reorder"
                      >
                        <GripVertical size={13} />
                      </button>
                      <SubIcon size={14} style={{ color: sub.color }} />
                      <span className="flex-1 truncate">{sub.name}</span>
                      <RowActions
                        onEdit={() => onEditSub(sub)}
                        onArchive={() => onArchiveSub(sub._id)}
                        onDelete={() => onDeleteSub(sub)}
                      />
                    </div>
                  )}
                </SortableRow>
              );
            })}
          </SortableList>
        </div>
      )}
    </div>
  );
}

function RowActions({
  onAddSub,
  onEdit,
  onArchive,
  onDelete,
}: {
  onAddSub?: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-0.5 opacity-0 transition-120 group-hover:opacity-100">
      {onAddSub && (
        <IconButton
          onClick={onAddSub}
          className="rounded p-1 text-gray-400 hover:text-gray-900"
          label="Add subcategory"
        >
          <Plus size={13} />
        </IconButton>
      )}
      <IconButton
        onClick={onEdit}
        className="rounded p-1 text-gray-400 hover:text-gray-900"
        label="Edit"
      >
        <Pencil size={13} />
      </IconButton>
      <IconButton
        onClick={onArchive}
        className="rounded p-1 text-gray-400 hover:text-gray-900"
        label="Archive"
      >
        <Archive size={13} />
      </IconButton>
      <IconButton
        onClick={onDelete}
        className="rounded p-1 text-gray-400 hover:text-red-600"
        label="Delete"
      >
        <Trash2 size={13} />
      </IconButton>
    </div>
  );
}
