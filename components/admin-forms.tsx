"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateUserRole,
  type AdminActionState,
} from "@/app/actions/admin";
import {
  createProduct,
  updateProduct,
  type CatalogActionState,
} from "@/app/actions/catalog";
import type { AppRole, Product, ProductStatus, Profile } from "@/lib/types";

const roleLabels: Record<AppRole, string> = {
  customer: "Customer",
  catalog_editor: "Catalog editor",
  admin: "Admin",
};

const statusLabels: Record<ProductStatus, string> = {
  active: "Active",
  archived: "Archived",
};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-orange-500 px-4 py-3 text-sm font-black text-neutral-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function ActionMessage({ state }: { state: AdminActionState | CatalogActionState }) {
  if (state.error) {
    return <p className="text-sm text-red-200">{state.error}</p>;
  }

  if (state.success) {
    return <p className="text-sm text-orange-200">{state.success}</p>;
  }

  return null;
}

export function RoleAssignmentForm({
  profile,
  currentUserId,
}: {
  profile: Profile;
  currentUserId: string | null;
}) {
  const [state, formAction] = useActionState<AdminActionState, FormData>(
    updateUserRole,
    {},
  );
  const isCurrentUser = profile.id === currentUserId;

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
      <input type="hidden" name="userId" value={profile.id} />
      {isCurrentUser ? <input type="hidden" name="role" value={profile.role} /> : null}
      <label className="grid gap-2 text-sm font-semibold text-neutral-200">
        Role
        <select
          name="role"
          defaultValue={profile.role}
          disabled={isCurrentUser}
          className="rounded-md border border-white/10 bg-neutral-950 px-3 py-3 text-white outline-none focus:border-orange-300 disabled:cursor-not-allowed disabled:text-neutral-500"
        >
          {Object.entries(roleLabels).map(([role, label]) => (
            <option key={role} value={role}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <SubmitButton label="Update role" pendingLabel="Updating..." />
      {isCurrentUser ? (
        <p className="text-sm text-neutral-400 sm:col-span-2">
          Your own admin role is locked here to prevent accidental lockout.
        </p>
      ) : null}
      <div className="sm:col-span-2">
        <ActionMessage state={state} />
      </div>
    </form>
  );
}

export function ProductCreateForm() {
  const [state, formAction] = useActionState<CatalogActionState, FormData>(
    createProduct,
    {},
  );

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-white/10 bg-neutral-900 p-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-orange-300">
          New product
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">Add catalog item</h2>
      </div>
      <ProductFields />
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton label="Create product" pendingLabel="Creating..." />
        <ActionMessage state={state} />
      </div>
    </form>
  );
}

export function ProductEditForm({ product }: { product: Product }) {
  const [state, formAction] = useActionState<CatalogActionState, FormData>(
    updateProduct,
    {},
  );

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-white/10 bg-neutral-900 p-5">
      <input type="hidden" name="productId" value={product.id} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-400">Product #{product.id}</p>
          <h2 className="mt-1 text-xl font-black text-white">{product.name}</h2>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold capitalize text-neutral-200">
          {statusLabels[product.status]}
        </span>
      </div>
      <ProductFields product={product} />
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton label="Save product" pendingLabel="Saving..." />
        <ActionMessage state={state} />
      </div>
    </form>
  );
}

function ProductFields({ product }: { product?: Product }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-2 text-sm font-semibold text-neutral-200">
        Name
        <input
          name="name"
          defaultValue={product?.name ?? ""}
          required
          minLength={3}
          className="rounded-md border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-orange-300"
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-neutral-200">
        Price
        <input
          name="price"
          type="number"
          min={0}
          step={1}
          defaultValue={product?.price ?? ""}
          required
          className="rounded-md border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-orange-300"
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-neutral-200">
        Inventory
        <input
          name="inventory"
          type="number"
          min={0}
          step={1}
          defaultValue={product?.inventory ?? ""}
          required
          className="rounded-md border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-orange-300"
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-neutral-200">
        Status
        <select
          name="status"
          defaultValue={product?.status ?? "active"}
          className="rounded-md border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-orange-300"
        >
          {Object.entries(statusLabels).map(([status, label]) => (
            <option key={status} value={status}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-neutral-200 md:col-span-2">
        Image URL
        <input
          name="imageUrl"
          type="url"
          defaultValue={product?.imageUrl ?? ""}
          required
          className="rounded-md border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-orange-300"
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-neutral-200 md:col-span-2">
        Description
        <textarea
          name="description"
          defaultValue={product?.description ?? ""}
          required
          minLength={12}
          rows={3}
          className="rounded-md border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-orange-300"
        />
      </label>
    </div>
  );
}
