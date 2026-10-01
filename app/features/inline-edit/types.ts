import type { EditTarget } from "./markers";

/** One pending in-place change, keyed by its marker so re-editing a field replaces it. */
export interface InlineChange {
    key: string;
    target: EditTarget;
    value: string;
    /** For one item of a list prop: the whole list as rendered (the item is replaced in it). */
    list?: readonly string[];
    /** Not one of the allowed values (attributes) — blocks publishing. */
    invalid?: boolean;
}

export interface PublishSummary {
    sections: number;
    site: boolean;
    products: number;
    prices: number;
    names: number;
}
