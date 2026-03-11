"use client";

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState } from "react";
import type { CSSProperties, JSX, ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Camera, ExternalLink, Loader2, Pencil, Save, Trash2, X } from "lucide-react";

interface EditableProfileProps {
    businessSlug: string;
    children: ReactNode;
}

export interface EditableFields {
    business_name: string;
    trade_category: string;
    description: string;
    why_refer_us: string;
    suburb: string;
    state: string;
    address: string;
    service_radius_km: number;
    years_experience: string;
    business_phone: string;
    business_email: string;
    website: string;
    logo_url: string;
    cover_photo_url: string;
    photo_urls: string[];
    features: string[];
    services: string[];
    slug: string;
    abn: string;
    referral_fee_cents: number;
}

type EditableTextField = "business_name" | "trade_category" | "description" | "why_refer_us" | "suburb" | "state" | "address" | "years_experience" | "business_phone" | "business_email" | "website" | "abn";
type EditableImageField = "logo_url" | "cover_photo_url";
type FocusEditorState =
    | {
        kind: "text";
        areaKey: string;
        field: EditableTextField;
        title: string;
        label: string;
        multiline: boolean;
        placeholder?: string;
        fallback?: string;
        minHeight?: number;
    }
    | {
        kind: "services";
        areaKey: "services";
        title: string;
        label: string;
    }
    | {
        kind: "image";
        areaKey: EditableImageField;
        field: EditableImageField;
        title: string;
        label: string;
        alt: string;
    }
    | {
        kind: "gallery";
        areaKey: "gallery";
        title: string;
        label: string;
        businessName: string;
    }
    | {
        kind: "fee";
        areaKey: "referral_fee_cents";
        title: string;
        label: string;
        minDollars: number;
    };

const DEFAULT_TEXT_EDITOR_META: Record<EditableTextField, { title: string; label: string; minHeight?: number }> = {
    business_name: { title: "Edit Business Name", label: "Business Name" },
    trade_category: { title: "Edit Trade Category", label: "Trade Category" },
    description: { title: "Edit Business Pitch", label: "Business Pitch", minHeight: 300 },
    why_refer_us: { title: "Edit Why Refer Us", label: "Why Refer Us", minHeight: 300 },
    suburb: { title: "Edit Suburb", label: "Suburb" },
    state: { title: "Edit State", label: "State" },
    address: { title: "Edit Address", label: "Address", minHeight: 300 },
    years_experience: { title: "Edit Years Experience", label: "Years Experience" },
    business_phone: { title: "Edit Business Phone", label: "Business Phone" },
    business_email: { title: "Edit Business Email", label: "Business Email" },
    website: { title: "Edit Website", label: "Website" },
    abn: { title: "Edit ABN", label: "ABN" },
};

interface EditableProfileContextValue {
    editMode: boolean;
    isOwner: boolean;
    saving: boolean;
    hasChanges: boolean;
    activeArea: string | null;
    focusEditor: FocusEditorState | null;
    fields: EditableFields | null;
    setEditMode: (value: boolean) => void;
    setActiveArea: (value: string | null) => void;
    openFocusEditor: (editor: FocusEditorState) => void;
    closeFocusEditor: () => void;
    updateField: <K extends keyof EditableFields>(field: K, value: EditableFields[K]) => void;
    addService: (value: string) => void;
    removeService: (index: number) => void;
    addPhotos: (files: FileList | File[]) => Promise<void>;
    replacePhoto: (index: number, file: File) => Promise<void>;
    removePhoto: (index: number) => void;
    replaceImageField: (field: EditableImageField, file: File) => Promise<void>;
    clearImageField: (field: EditableImageField) => void;
    handleSave: () => Promise<void>;
    handleCancel: () => void;
}

const EditableProfileContext = createContext<EditableProfileContextValue | null>(null);

function useEditableProfileOptional() {
    return useContext(EditableProfileContext);
}

export function EditableConditionalSection({ showWhenPublic, children }: { showWhenPublic: boolean; children: ReactNode }) {
    const context = useEditableProfileOptional();

    if (!showWhenPublic && !(context?.isOwner && context.editMode)) {
        return null;
    }

    return <>{children}</>;
}

function InlineEditFrame({
    active,
    areaKey,
    children,
    className = "",
    badgeLabel = "Edit",
    onActivate,
}: {
    active: boolean;
    areaKey: string;
    children: ReactNode;
    className?: string;
    badgeLabel?: string;
    onActivate?: () => void;
}) {
    const context = useEditableProfileOptional();
    const isActiveArea = context?.activeArea === areaKey;

    if (!active) {
        return <>{children}</>;
    }

    return (
        <div
            className={`group relative rounded-2xl border-2 border-dashed ${isActiveArea ? "border-orange-500 bg-orange-50/40" : "border-transparent hover:border-orange-500 hover:bg-orange-50/10"} transition-all duration-200 cursor-pointer ${className}`}
            data-inline-editable="true"
            onClick={() => {
                context?.setActiveArea(areaKey);
                onActivate?.();
            }}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    context?.setActiveArea(areaKey);
                    onActivate?.();
                }
            }}
            tabIndex={0}
            role="button"
        >
            <div className={`pointer-events-none absolute -top-3 right-4 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/25 transition-all ${isActiveArea ? "opacity-100 scale-100" : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-focus-visible:opacity-100 group-focus-visible:scale-100"}`}>
                <Pencil className="h-4 w-4" />
            </div>
            <span className="sr-only">{badgeLabel}</span>
            {!isActiveArea && false && (
                <div className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-zinc-100 px-2 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-600 opacity-95 shadow-sm">
                    <Pencil className="h-3 w-3" /> {badgeLabel}
                </div>
            )}
            {children}
        </div>
    );
}

export function EditableText({
    field,
    initialValue,
    fallback,
    placeholder,
    as = "div",
    multiline = false,
    rows = 4,
    className = "",
    inputClassName = "",
    frameClassName = "p-4",
    editorTitle,
    editorLabel,
    editorMinHeight,
    style,
}: {
    field: EditableTextField;
    initialValue?: string;
    fallback?: string;
    placeholder?: string;
    as?: keyof JSX.IntrinsicElements;
    multiline?: boolean;
    rows?: number;
    className?: string;
    inputClassName?: string;
    frameClassName?: string;
    editorTitle?: string;
    editorLabel?: string;
    editorMinHeight?: number;
    style?: CSSProperties;
}) {
    const context = useEditableProfileOptional();
    const value = context?.isOwner ? String(context.fields?.[field] ?? "") : (initialValue ?? "");
    const displayValue = value || fallback || "";
    const Component = as as keyof JSX.IntrinsicElements;
    const meta = DEFAULT_TEXT_EDITOR_META[field];

    if (!context?.isOwner || !context.editMode) {
        return <Component className={className} style={style}>{displayValue}</Component>;
    }

    return (
        <InlineEditFrame
            active
            areaKey={field}
            className={frameClassName}
            onActivate={() => context.openFocusEditor({
                kind: "text",
                areaKey: field,
                field,
                title: editorTitle || meta.title,
                label: editorLabel || meta.label,
                multiline,
                placeholder,
                fallback,
                minHeight: editorMinHeight || meta.minHeight || (multiline ? 300 : undefined),
            })}
        >
            <Component className={`${className} ${multiline ? "whitespace-pre-wrap" : ""} ${displayValue ? "" : "text-zinc-300"}`} style={style}>
                {displayValue || placeholder || fallback || "Click to add content"}
            </Component>
        </InlineEditFrame>
    );
}

export function EditableImage({
    field,
    initialValue,
    alt,
    className,
    empty,
    editorTitle,
    editorLabel,
}: {
    field: EditableImageField;
    initialValue?: string;
    alt: string;
    className: string;
    empty: ReactNode;
    editorTitle?: string;
    editorLabel?: string;
}) {
    const context = useEditableProfileOptional();
    const value = context?.isOwner ? context.fields?.[field] || "" : (initialValue || "");

    if (!context?.isOwner || !context.editMode) {
        if (value) {
            return <img src={value} alt={alt} className={className} />;
        }
        return <>{empty}</>;
    }

    return (
        <InlineEditFrame
            active
            areaKey={field}
            className="h-full min-h-full overflow-hidden"
            badgeLabel="Image"
            onActivate={() => context.openFocusEditor({
                kind: "image",
                areaKey: field,
                field,
                title: editorTitle || (field === "logo_url" ? "Edit Business Logo" : "Edit Cover Photo"),
                label: editorLabel || (field === "logo_url" ? "Business Logo" : "Cover Photo"),
                alt,
            })}
        >
            {value ? <img src={value} alt={alt} className={className} /> : empty}
        </InlineEditFrame>
    );
}

export function EditableServices({ initialServices, initialSpecialties = [] }: { initialServices: string[]; initialSpecialties?: string[] }) {
    const context = useEditableProfileOptional();
    const services = context?.isOwner ? (context.fields?.services || []) : initialServices;

    if (!context?.isOwner || !context.editMode) {
        return (
            <>
                {services.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                        {services.map((service) => (
                            <div key={service} className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-100 hover:border-orange-200 hover:bg-white transition-all">
                                <div className="h-5 w-5 shrink-0 rounded-full bg-orange-100 text-[#FF6600] flex items-center justify-center text-xs font-black">✓</div>
                                <span className="text-zinc-800 font-bold" style={{ fontSize: "16px" }}>{service}</span>
                            </div>
                        ))}
                    </div>
                )}
                {initialSpecialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {initialSpecialties.map((spec) => (
                            <div key={spec} className="px-3 py-2 bg-orange-50 border border-orange-100 text-orange-800 rounded-lg font-black hover:bg-orange-100 transition-all" style={{ fontSize: "16px" }}>
                                {spec}
                            </div>
                        ))}
                    </div>
                )}
            </>
        );
    }

    return (
        <InlineEditFrame
            active
            areaKey="services"
            className="p-5 space-y-4"
            badgeLabel="Services"
            onActivate={() => context.openFocusEditor({
                kind: "services",
                areaKey: "services",
                title: "Edit Services & Expertise",
                label: "Services (one per line)",
            })}
        >
            {services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {services.map((service, index) => (
                        <div key={`${service}-${index}`} className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                            <div className="h-5 w-5 shrink-0 rounded-full bg-orange-100 text-[#FF6600] flex items-center justify-center text-xs font-black">✓</div>
                            <span className="flex-1 text-zinc-800 font-bold" style={{ fontSize: "16px" }}>{service}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-5 py-8 text-center font-bold text-zinc-400" style={{ fontSize: "16px" }}>
                    Click to add your services and specialties
                </div>
            )}
            {initialSpecialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                    {initialSpecialties.map((spec) => (
                        <div key={spec} className="px-3 py-2 bg-orange-50 border border-orange-100 text-orange-800 rounded-lg font-black hover:bg-orange-100 transition-all" style={{ fontSize: "16px" }}>
                            {spec}
                        </div>
                    ))}
                </div>
            )}
        </InlineEditFrame>
    );
}

export function EditableGallery({ initialImages, businessName }: { initialImages: string[]; businessName: string }) {
    const context = useEditableProfileOptional();
    const images = context?.isOwner ? (context.fields?.photo_urls || []) : initialImages;

    if ((!images || images.length === 0) && (!context?.isOwner || !context.editMode)) {
        return null;
    }

    if (context?.isOwner && context.editMode) {
        return (
            <InlineEditFrame
                active
                areaKey="gallery"
                className="p-4"
                badgeLabel="Gallery"
                onActivate={() => context.openFocusEditor({
                    kind: "gallery",
                    areaKey: "gallery",
                    title: "Edit Project Gallery",
                    label: "Project Gallery",
                    businessName,
                })}
            >
                {images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {images.map((url, index) => (
                            <div key={`${url}-${index}`} className="aspect-square rounded-xl overflow-hidden bg-zinc-100 group relative">
                                <img src={url} alt={`${businessName} work`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="aspect-[3/1] rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 flex items-center justify-center font-bold text-zinc-400" style={{ fontSize: "16px" }}>
                        Click to add project photos
                    </div>
                )}
            </InlineEditFrame>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((url, index) => (
                <div key={`${url}-${index}`} className="aspect-square rounded-xl overflow-hidden bg-zinc-100 group relative">
                    <img src={url} alt={`${businessName} work`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 transition-opacity bg-black/20 opacity-0 group-hover:opacity-100" />
                </div>
            ))}
        </div>
    );
}

export function EditableFee({
    initialValue,
    title = "Referrer Reward",
    helperText = "Set the high-authority reward your referrers will see on the storefront.",
}: {
    initialValue?: number;
    title?: string;
    helperText?: string;
}) {
    const context = useEditableProfileOptional();
    const value = context?.isOwner ? (context.fields?.referral_fee_cents ?? initialValue ?? 1000) : (initialValue ?? 1000);
    const dollars = (value / 100).toFixed(2);

    if (!context?.isOwner || !context.editMode) {
        return (
            <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-zinc-400 mb-2">{title}</p>
                <p className="font-bold text-zinc-900" style={{ fontSize: 32 }}>${dollars}</p>
                <p className="text-sm text-zinc-500 font-medium mt-2">{helperText}</p>
            </div>
        );
    }

    return (
        <InlineEditFrame
            active
            areaKey="referral_fee_cents"
            className="p-4"
            badgeLabel="Fee"
            onActivate={() => context.openFocusEditor({
                kind: "fee",
                areaKey: "referral_fee_cents",
                title: "Edit Referral Fee",
                label: title,
                minDollars: 3,
            })}
        >
            <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-zinc-400 mb-2">{title}</p>
                <p className="font-bold text-zinc-900" style={{ fontSize: 32 }}>${dollars}</p>
                <p className="text-sm text-zinc-500 font-medium mt-2">{helperText}</p>
            </div>
        </InlineEditFrame>
    );
}

export function EditableContactField({
    field,
    initialValue,
    label,
    icon,
    type = "text",
}: {
    field: Extract<EditableTextField, "business_phone" | "business_email" | "website" | "abn">;
    initialValue?: string;
    label: string;
    icon: ReactNode;
    type?: "text" | "phone" | "email" | "website";
}) {
    const context = useEditableProfileOptional();
    const value = context?.isOwner ? String(context.fields?.[field] ?? "") : (initialValue ?? "");

    if (!value && !(context?.isOwner && context.editMode)) {
        return null;
    }

    const href = type === "phone"
        ? `tel:${value}`
        : type === "email"
            ? `mailto:${value}`
            : type === "website"
                ? (value.startsWith("http") ? value : `https://${value}`)
                : undefined;

    const content = (
        <>
            <div className="w-9 h-9 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="font-bold text-zinc-400 uppercase tracking-widest leading-none mb-0.5" style={{ fontSize: '16px' }}>{label}</p>
                <EditableText
                    field={field}
                    initialValue={initialValue}
                    as="p"
                    className={`font-bold ${type === "phone" || type === "website" ? "text-[#FF6600]" : "text-zinc-700 break-all"}`}
                    style={{ fontSize: '16px' }}
                    frameClassName="p-3"
                    editorTitle={`Edit ${label}`}
                    editorLabel={label}
                    editorMinHeight={type === "website" ? undefined : 300}
                />
            </div>
        </>
    );

    if (href && !(context?.isOwner && context.editMode)) {
        return (
            <a href={href} target={type === "website" ? "_blank" : undefined} rel={type === "website" ? "noopener noreferrer" : undefined} className="flex items-center gap-3 group">
                {content}
            </a>
        );
    }

    return <div className="flex items-start gap-3">{content}</div>;
}

function FocusEditorOverlay() {
    const context = useEditableProfileOptional();
    const imageInputId = useId();
    const galleryInputId = useId();

    if (!context?.focusEditor || !context.fields || !context.editMode) {
        return null;
    }

    const editor = context.focusEditor;
    const servicesValue = context.fields.services.join("\n");
    const imageValue = editor.kind === "image" ? (context.fields[editor.field] || "") : "";
    const feeValue = (context.fields.referral_fee_cents / 100).toFixed(2);

    return (
        <div className="fixed inset-0 z-40">
            <button type="button" className="absolute inset-0 bg-zinc-950/45 backdrop-blur-sm" onClick={context.closeFocusEditor} />
            <div className="absolute inset-0 overflow-y-auto px-4 py-24 pb-36 sm:px-8">
                <div className="mx-auto w-full max-w-4xl">
                    <div className="relative overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/20">
                        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 py-5 sm:px-8">
                            <div>
                                <h3 className="font-bold text-zinc-900" style={{ fontSize: 24 }}>{editor.title}</h3>
                                <p className="font-bold text-zinc-500 mt-2" style={{ fontSize: 18 }}>{editor.label}</p>
                            </div>
                            <button type="button" onClick={context.closeFocusEditor} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 text-zinc-500 hover:border-orange-200 hover:text-orange-600 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="max-h-[calc(100vh-14rem)] overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
                            {editor.kind === "text" && (
                                <div className="space-y-4">
                                    {editor.multiline ? (
                                        <textarea
                                            rows={12}
                                            value={String(context.fields[editor.field] ?? "")}
                                            onChange={(e) => context.updateField(editor.field, e.target.value)}
                                            placeholder={editor.placeholder || editor.fallback || "Start typing..."}
                                            className="w-full rounded-[28px] border-2 border-zinc-200 bg-zinc-50 px-6 py-5 text-zinc-900 outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 resize-y"
                                            style={{ minHeight: editor.minHeight || 300, fontSize: 18, lineHeight: 1.7 }}
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={String(context.fields[editor.field] ?? "")}
                                            onChange={(e) => context.updateField(editor.field, e.target.value)}
                                            placeholder={editor.placeholder || editor.fallback || "Start typing..."}
                                            className="h-16 w-full rounded-[28px] border-2 border-zinc-200 bg-zinc-50 px-6 text-zinc-900 outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                                            style={{ fontSize: 18, fontWeight: 700 }}
                                        />
                                    )}
                                </div>
                            )}
                            {editor.kind === "services" && (
                                <div className="space-y-5">
                                    <textarea
                                        rows={12}
                                        value={servicesValue}
                                        onChange={(e) => context.updateField("services", e.target.value.split(/\n+/).map((item) => item.trim()).filter(Boolean))}
                                        placeholder="Bathroom renovations&#10;Emergency plumbing&#10;Roof leak repairs"
                                        className="w-full rounded-[28px] border-2 border-zinc-200 bg-zinc-50 px-6 py-5 text-zinc-900 outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 resize-y"
                                        style={{ minHeight: 300, fontSize: 18, lineHeight: 1.7 }}
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        {context.fields.services.map((service, index) => (
                                            <div key={`${service}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-zinc-800" style={{ fontSize: 16, fontWeight: 700 }}>
                                                {service}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {editor.kind === "image" && (
                                <div className="space-y-5">
                                    <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-50">
                                        {imageValue ? (
                                            <img src={imageValue} alt={editor.alt} className="h-[320px] w-full object-cover" />
                                        ) : (
                                            <div className="flex h-[320px] items-center justify-center text-zinc-400 font-bold" style={{ fontSize: 18 }}>
                                                No image uploaded yet
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <label htmlFor={imageInputId} className="inline-flex h-14 cursor-pointer items-center gap-2 rounded-2xl bg-orange-600 px-6 text-base font-bold uppercase tracking-wide text-white hover:bg-orange-700 transition-colors">
                                            <Camera className="h-4 w-4" /> Upload Image
                                        </label>
                                        {imageValue && (
                                            <button type="button" onClick={() => context.clearImageField(editor.field)} className="inline-flex h-14 items-center gap-2 rounded-2xl border border-zinc-300 px-6 text-base font-bold uppercase tracking-wide text-zinc-600 hover:bg-zinc-50 transition-colors">
                                                <Trash2 className="h-4 w-4" /> Remove
                                            </button>
                                        )}
                                        <input
                                            id={imageInputId}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    await context.replaceImageField(editor.field, file);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                            {editor.kind === "gallery" && (
                                <div className="space-y-5">
                                    {context.fields.photo_urls.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            {context.fields.photo_urls.map((url, index) => {
                                                const inputId = `${galleryInputId}-${index}`;
                                                return (
                                                    <div key={`${url}-${index}`} className="overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-50">
                                                        <img src={url} alt={`${editor.businessName} work`} className="h-56 w-full object-cover" />
                                                        <div className="flex items-center justify-between gap-3 p-4">
                                                            <label htmlFor={inputId} className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-2xl border border-zinc-300 bg-white px-4 text-sm font-bold uppercase tracking-wide text-zinc-700 hover:border-orange-200 hover:text-orange-600 transition-colors">
                                                                <Camera className="h-4 w-4" /> Replace
                                                            </label>
                                                            <button type="button" onClick={() => context.removePhoto(index)} className="inline-flex h-12 items-center gap-2 rounded-2xl border border-zinc-300 bg-white px-4 text-sm font-bold uppercase tracking-wide text-zinc-600 hover:border-red-200 hover:text-red-500 transition-colors">
                                                                <Trash2 className="h-4 w-4" /> Remove
                                                            </button>
                                                            <input
                                                                id={inputId}
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={async (e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        await context.replacePhoto(index, file);
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="rounded-[28px] border border-dashed border-zinc-200 bg-zinc-50 px-6 py-16 text-center font-bold text-zinc-400" style={{ fontSize: 18 }}>
                                            Add project images to help referrers trust your work quality
                                        </div>
                                    )}
                                    <label htmlFor={galleryInputId} className="inline-flex h-14 cursor-pointer items-center gap-2 rounded-2xl bg-orange-600 px-6 text-base font-bold uppercase tracking-wide text-white hover:bg-orange-700 transition-colors">
                                        <Camera className="h-4 w-4" /> Add Photos
                                    </label>
                                    <input
                                        id={galleryInputId}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={async (e) => {
                                            if (e.target.files?.length) {
                                                await context.addPhotos(e.target.files);
                                            }
                                        }}
                                    />
                                </div>
                            )}
                            {editor.kind === "fee" && (
                                <div className="space-y-6">
                                    <div className="rounded-[32px] bg-zinc-950 px-6 py-8 text-white shadow-2xl shadow-zinc-900/20">
                                        <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-white/60 mb-4">{editor.label}</p>
                                        <div className="relative max-w-sm">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-white/70" style={{ fontSize: 24 }}>$</span>
                                            <input
                                                type="number"
                                                min={editor.minDollars}
                                                step="1"
                                                value={feeValue}
                                                onChange={(e) => {
                                                    const next = parseFloat(e.target.value) || 0;
                                                    context.updateField("referral_fee_cents", Math.round(next * 100));
                                                }}
                                                className="h-20 w-full rounded-[28px] border border-white/15 bg-white/10 pl-14 pr-6 text-white outline-none transition-all focus:border-orange-400 focus:ring-4 focus:ring-orange-500/20"
                                                style={{ fontSize: 32, fontWeight: 700 }}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                                            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-zinc-400 mb-2">Referrer Reward</p>
                                            <p className="font-bold text-zinc-900" style={{ fontSize: 32 }}>${feeValue}</p>
                                        </div>
                                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                                            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-zinc-400 mb-2">Platform Fee</p>
                                            <p className="font-bold text-zinc-900" style={{ fontSize: 32 }}>${(context.fields.referral_fee_cents * 0.2 / 100).toFixed(2)}</p>
                                        </div>
                                        <div className="rounded-2xl bg-orange-50 border border-orange-200 p-5">
                                            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-orange-500 mb-2">Total Unlock Price</p>
                                            <p className="font-bold text-zinc-900" style={{ fontSize: 32 }}>${(context.fields.referral_fee_cents * 1.2 / 100).toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function EditableProfile({ businessSlug, children }: EditableProfileProps) {
    const { getToken, isSignedIn, isLoaded } = useAuth();
    const searchParams = useSearchParams();
    const [isOwner, setIsOwner] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeArea, setActiveArea] = useState<string | null>(null);
    const [focusEditor, setFocusEditor] = useState<FocusEditorState | null>(null);
    const [fields, setFields] = useState<EditableFields | null>(null);
    const [originalFields, setOriginalFields] = useState<EditableFields | null>(null);
    const apiUrl = "/api/backend";
    const shouldOpenEditMode = searchParams?.get("edit") === "1";

    const updateField = useCallback(<K extends keyof EditableFields>(field: K, value: EditableFields[K]) => {
        setFields((current) => current ? { ...current, [field]: value } : current);
    }, []);

    const checkOwnership = useCallback(async () => {
        if (!isSignedIn) return;
        try {
            const token = await getToken();
            const res = await fetch(`${apiUrl}/business/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                if (data.slug === businessSlug) {
                    setIsOwner(true);
                    const nextFields: EditableFields = {
                        business_name: data.business_name || "",
                        trade_category: data.trade_category || "",
                        description: data.description || "",
                        why_refer_us: data.why_refer_us || "",
                        suburb: data.suburb || "",
                        state: data.state || "VIC",
                        address: data.address || "",
                        service_radius_km: data.service_radius_km || 25,
                        years_experience: data.years_experience || "",
                        business_phone: data.business_phone || "",
                        business_email: data.business_email || "",
                        website: data.website || "",
                        logo_url: data.logo_url || "",
                        cover_photo_url: data.cover_photo_url || "",
                        photo_urls: data.photo_urls || [],
                        features: data.features || [],
                        services: data.services || [],
                        slug: data.slug || "",
                        abn: data.abn || "",
                        referral_fee_cents: data.referral_fee_cents || 1000,
                    };
                    setFields(nextFields);
                    setOriginalFields(nextFields);
                }
            }
        } catch {
        }
    }, [apiUrl, businessSlug, getToken, isSignedIn]);

    useEffect(() => {
        if (isLoaded) {
            checkOwnership();
        }
    }, [checkOwnership, isLoaded]);

    useEffect(() => {
        if (isOwner && shouldOpenEditMode) {
            setEditMode(true);
        }
    }, [isOwner, shouldOpenEditMode]);

    useEffect(() => {
        if (!editMode) {
            setActiveArea(null);
            setFocusEditor(null);
        }
    }, [editMode]);

    useEffect(() => {
        if (!focusEditor) {
            document.body.style.overflow = "";
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [focusEditor]);

    const openFocusEditor = useCallback((editor: FocusEditorState) => {
        setActiveArea(editor.areaKey);
        setFocusEditor(editor);
    }, []);

    const closeFocusEditor = useCallback(() => {
        setFocusEditor(null);
        setActiveArea(null);
    }, []);

    const uploadMedia = useCallback(async (file: File, folder: string) => {
        const token = await getToken();
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const response = await fetch(`${apiUrl}/media/upload`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => null);
            throw new Error(error?.detail || "Upload failed");
        }

        const data = await response.json();
        return data.url as string;
    }, [apiUrl, getToken]);

    const addPhotos = useCallback(async (files: FileList | File[]) => {
        const items = Array.from(files);
        if (!items.length) return;
        try {
            const urls = await Promise.all(items.map((file) => uploadMedia(file, "gallery")));
            setFields((current) => current ? { ...current, photo_urls: [...current.photo_urls, ...urls] } : current);
            toast.success(`${urls.length} photo${urls.length > 1 ? "s" : ""} added`);
        } catch (error) {
            toast.error((error as Error).message || "Failed to add photos");
        }
    }, [uploadMedia]);

    const replacePhoto = useCallback(async (index: number, file: File) => {
        try {
            const url = await uploadMedia(file, "gallery");
            setFields((current) => current ? {
                ...current,
                photo_urls: current.photo_urls.map((photo, photoIndex) => photoIndex === index ? url : photo),
            } : current);
            toast.success("Photo replaced");
        } catch (error) {
            toast.error((error as Error).message || "Failed to replace photo");
        }
    }, [uploadMedia]);

    const removePhoto = useCallback((index: number) => {
        setFields((current) => current ? {
            ...current,
            photo_urls: current.photo_urls.filter((_, photoIndex) => photoIndex !== index),
        } : current);
    }, []);

    const replaceImageField = useCallback(async (field: EditableImageField, file: File) => {
        try {
            const folder = field === "logo_url" ? "logos" : "covers";
            const url = await uploadMedia(file, folder);
            updateField(field, url);
            toast.success(field === "logo_url" ? "Logo updated" : "Cover photo updated");
        } catch (error) {
            toast.error((error as Error).message || "Failed to update image");
        }
    }, [updateField, uploadMedia]);

    const clearImageField = useCallback((field: EditableImageField) => {
        updateField(field, "");
    }, [updateField]);

    const addService = useCallback((value: string) => {
        const nextService = value.trim();
        if (!nextService) return;
        setFields((current) => current ? { ...current, services: [...current.services, nextService] } : current);
    }, []);

    const removeService = useCallback((index: number) => {
        setFields((current) => current ? {
            ...current,
            services: current.services.filter((_, serviceIndex) => serviceIndex !== index),
        } : current);
    }, []);

    const handleSave = useCallback(async () => {
        if (!fields) return;
        setSaving(true);
        try {
            const token = await getToken();
            const response = await fetch(`${apiUrl}/business/update`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(fields),
            });

            if (response.ok) {
                toast.success("Profile updated! Changes are live.");
                setOriginalFields({ ...fields });
                setEditMode(false);
                window.location.href = `/b/${fields.slug}`;
                return;
            }

            const error = await response.json().catch(() => null);
            toast.error(error?.detail || "Failed to save changes.");
        } catch {
            toast.error("Connection issue. Please try again.");
        } finally {
            setSaving(false);
        }
    }, [apiUrl, fields, getToken]);

    const handleCancel = useCallback(() => {
        if (originalFields) {
            setFields({ ...originalFields });
        }
        setFocusEditor(null);
        setEditMode(false);
    }, [originalFields]);

    const hasChanges = useMemo(() => {
        return !!(fields && originalFields && JSON.stringify(fields) !== JSON.stringify(originalFields));
    }, [fields, originalFields]);

    if (!isOwner) {
        return <>{children}</>;
    }

    const contextValue: EditableProfileContextValue = {
        editMode,
        isOwner,
        saving,
        hasChanges,
        activeArea,
        focusEditor,
        fields,
        setEditMode,
        setActiveArea,
        openFocusEditor,
        closeFocusEditor,
        updateField,
        addService,
        removeService,
        addPhotos,
        replacePhoto,
        removePhoto,
        replaceImageField,
        clearImageField,
        handleSave,
        handleCancel,
    };

    return (
        <EditableProfileContext.Provider value={contextValue}>
            <>
                <div className={`fixed top-[72px] md:top-[100px] left-0 right-0 z-40 border-b ${editMode ? "bg-slate-50 border-slate-200" : "bg-zinc-50 border-zinc-200"}`}>
                    <div className="w-full px-12 pr-12 h-12 flex items-center justify-between gap-4">
                        <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                            {editMode ? "Editing your profile" : "Viewing as owner"}
                        </span>
                        <div className="flex items-center gap-2">
                            {hasChanges && editMode && (
                                <span className="text-xs font-bold text-orange-500 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full hidden sm:block">
                                    Unsaved changes
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    if (editMode) {
                                        handleCancel();
                                    } else {
                                        setEditMode(true);
                                    }
                                }}
                                className={`relative inline-flex h-8 w-[110px] items-center rounded-full border transition-colors ${editMode ? "border-orange-500 bg-orange-500" : "border-zinc-300 bg-zinc-200"}`}
                                aria-pressed={editMode}
                            >
                                <span className={`absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm transition-transform ${editMode ? "translate-x-[78px]" : "translate-x-0"}`}>
                                    <Pencil className={`w-3.5 h-3.5 ${editMode ? "text-orange-500" : "text-zinc-400"}`} />
                                </span>
                                <span className={`w-full px-3 text-[11px] font-black uppercase tracking-widest transition-opacity ${editMode ? "pr-8 text-white text-left opacity-100" : "pl-8 text-zinc-600 text-right opacity-100"}`}>
                                    Edit Mode
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="h-[48px]" />

                <div className={`${editMode ? "bg-slate-50/70" : ""} [&_[data-claim-banner]]:hidden ${editMode ? "pb-28" : ""}`}>
                    {children}
                </div>

                {editMode && fields && <FocusEditorOverlay />}

                {editMode && fields && (
                    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur">
                        <div className="w-full px-12 pr-12 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3 text-sm font-bold text-zinc-500">
                                <span>{hasChanges ? "Unsaved changes" : "No unpublished changes"}</span>
                                <Link href={`/b/${fields.slug}`} target="_blank" className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-700 transition-colors">
                                    Live Preview <ExternalLink className="h-4 w-4" />
                                </Link>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleCancel}
                                    className="h-14 px-6 rounded-2xl border border-zinc-300 text-zinc-600 font-bold uppercase tracking-wide text-base hover:bg-zinc-50 transition-colors"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !hasChanges}
                                    className="h-14 px-8 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase tracking-wide text-base shadow-lg shadow-orange-200 disabled:opacity-50 flex items-center gap-2 transition-colors"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {saving ? "Saving..." : "Save & Publish"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        </EditableProfileContext.Provider>
    );
}
