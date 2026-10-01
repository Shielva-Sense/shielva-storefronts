"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { SectionDef } from "../types";
import styles from "./PageBuilder.module.scss";

interface AddSectionModalProps {
    open: boolean;
    library: readonly SectionDef[];
    onClose: () => void;
    onPick: (def: SectionDef) => void;
}

/** Pick a section type from this storefront's library; it is appended with library defaults. */
export function AddSectionModal({ open, library, onClose, onPick }: AddSectionModalProps): React.JSX.Element | null {
    return (
        <Modal
            open={open}
            size="lg"
            onClose={onClose}
            title="Add a section"
            description="Sections are appended to the end of the page with sensible defaults — edit and reorder them afterwards."
            footer={<Button variant="secondary" onClick={onClose}>Cancel</Button>}
        >
            <ul className={styles.library}>
                {library.map((def) => (
                    <li key={def.type}>
                        <button type="button" className={styles.libraryItem} onClick={() => onPick(def)}>
                            <span className={styles.libraryLabel}>
                                <Plus size={14} aria-hidden="true" /> {def.label}
                            </span>
                            <span className={styles.libraryDesc}>{def.description}</span>
                            <code className={styles.type}>{def.type}</code>
                        </button>
                    </li>
                ))}
            </ul>
        </Modal>
    );
}
