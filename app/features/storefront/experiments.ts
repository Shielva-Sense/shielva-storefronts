import { FALLBACK_SECTION_PREFIX } from "./constants";
import type { ResolvedSection, SectionInstance } from "./types";

/** FNV-1a → 0..99. Same visitor + section always lands in the same bucket (server and client agree). */
export function bucket(anonId: string, sectionId: string): number {
    let h = 0x811c9dc5;
    const s = `${anonId}:${sectionId}`;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0) % 100;
}

export function resolveSections(sections: SectionInstance[], anonId: string | null, editor = false): { sections: ResolvedSection[]; experiments: Record<string, "A" | "B"> } {
    const experiments: Record<string, "A" | "B"> = {};
    const resolved = sections.map((s): ResolvedSection => {
        // Built-in fallback sections (API down) have no stored row to edit.
        const editable = editor && !s.id.startsWith(FALLBACK_SECTION_PREFIX);
        if (s.abSplit <= 0 || !s.variantBProps || !anonId) return { id: s.id, type: s.type, props: s.props, variant: null, editable };
        const variant: "A" | "B" = bucket(anonId, s.id) < s.abSplit ? "B" : "A";
        experiments[s.id] = variant;
        return { id: s.id, type: s.type, props: variant === "B" ? { ...s.props, ...s.variantBProps } : s.props, variant, editable };
    });
    return { sections: resolved, experiments };
}
