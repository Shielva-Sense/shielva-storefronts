/** Admin content domain — page builder, journal, theme tokens. Interfaces only. */

export interface SchemaToggles {
    product: boolean;
    breadcrumb: boolean;
    faq: boolean;
    localBusiness: boolean;
}

export type SectionProps = Record<string, string>;


export interface PageSection {
    id: string;
    pageId: string;
    type: string;
    position: number;
    enabled: boolean;
    props: SectionProps;
    variantBProps: SectionProps | null;
    abSplit: number;
    startsAt: string | null;
    endsAt: string | null;
    updatedAt: string;
}

export interface AdminPage {
    id: string;
    slug: string;
    title: string;
    seoTitle: string;
    seoDescription: string;
    canonicalPath: string;
    schemaToggles: SchemaToggles;
    collectionCopy: string;
    updatedAt: string;
    sections: PageSection[];
}

export type AdminPageRecord = Omit<AdminPage, "sections">;

export interface PagesResponse {
    items: AdminPage[];
}

export interface PageSeoInput {
    title: string;
    seoTitle: string;
    seoDescription: string;
    canonicalPath: string;
    schemaToggles: SchemaToggles;
    collectionCopy: string;
}

export interface SectionField {
    key: string;
    label: string;
    multiline?: boolean;
}

export interface SectionDef {
    type: string;
    label: string;
    description: string;
    fields: SectionField[];
    defaults: SectionProps;
}

export interface SectionPatch {
    enabled?: boolean;
    props?: SectionProps;
    variantBProps?: SectionProps | null;
    abSplit?: number;
    startsAt?: string | null;
    endsAt?: string | null;
}

export type PostStatus = "draft" | "published";

export interface Post {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    bodyMd: string;
    author: string;
    status: PostStatus;
    publishedAt: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    updatedAt: string;
}

export interface PostsResponse {
    items: Post[];
}

export interface PostInput {
    slug: string;
    title: string;
    excerpt: string;
    bodyMd: string;
    author: string;
    status: PostStatus;
    seoTitle: string | null;
    seoDescription: string | null;
}

export type ThemeKey = "brand" | "brandStrong" | "accent" | "background" | "surface" | "text" | "textMuted" | "radius";

export type ThemeTokens = Partial<Record<ThemeKey, string>>;

export interface ThemeResponse {
    tokens: ThemeTokens;
    /** Theme key → CSS custom property the storefront maps it to. */
    keys: Record<ThemeKey, string>;
    warnings: string[];
}

export interface ThemeSaveResponse {
    tokens: ThemeTokens;
    warnings: string[];
}
