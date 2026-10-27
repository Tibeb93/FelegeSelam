import { SectionRegistryEntry, SectionStyle, SectionType } from './types';
export declare const defaultSectionStyle: SectionStyle;
export declare const SECTION_REGISTRY: Record<SectionType, SectionRegistryEntry>;
export declare function getSectionDefinition(type: SectionType): SectionRegistryEntry | undefined;
export declare function getAllSectionDefinitions(): SectionRegistryEntry[];
export declare function validateSection(section: {
    type: string;
    content: any;
    config: any;
    style?: any;
}): {
    success: boolean;
    errors?: string[];
};
//# sourceMappingURL=registry.d.ts.map