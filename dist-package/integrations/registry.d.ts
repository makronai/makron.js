/**
 * @license MIT
 * Makron.js Comprehensive Integration Ecosystem Registry
 */
import { IntegrationCategory, IntegrationRecord, IntegrationSupportLevel } from './types';
export declare const INTEGRATION_CATALOG: IntegrationRecord[];
export declare class IntegrationRegistry {
    private records;
    constructor();
    register(record: IntegrationRecord): void;
    get(id: string): IntegrationRecord | undefined;
    list(filter?: {
        category?: IntegrationCategory;
        supportLevel?: IntegrationSupportLevel;
    }): IntegrationRecord[];
}
export declare const defaultIntegrationRegistry: IntegrationRegistry;
