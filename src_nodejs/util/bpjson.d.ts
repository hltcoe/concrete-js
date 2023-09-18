import {Communication} from '../communication_types';

declare export function convertConcreteToBPJson(communication: Communication,
                                                templateSituationType?: string,
                                                entitySetTool?: (string | null),
                                                situationSetTool?: (string | null)): object;
declare export function convertBPJsonToConcrete(corpusEntry: object, templateSituationType?: string): Communication;
declare export const DEFAULT_TEMPLATE_SITUATION_TYPE: string;
