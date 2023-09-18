import './communication_types';
import {UUID} from './uuid_types';
import {Entity, EntityMentionSet} from './entities_types';
import {Section, Sentence, Tokenization, Token} from './structure_types';
import {SituationMention} from './situations_types';

declare module "./communication_types" {
  interface Communication {
    addInternalReferences(): void;
    getEntityForEntityMentionUUID(uuid: UUID): Entity?;
    getEntityMentionSetWithToolname(toolname: string): EntityMentionSet;
    getEntityMentionWithUUID(uuid: UUID): EntityMention?;
    getEntityWithEntityId(entityId: string): Entity?;
    getFirstSentence(): Sentence?;
    getFirstTokenization(): (Tokenization | null)?;
    getSentenceWithUUID(uuid: UUID): Sentence?;
    getSituationMentionWithUUID(uuid: UUID): SituationMention?;
    getSectionsAsList(): Section[];
    getSentencesAsList(): Section[];
    getTokenizationsAsList(): (Tokenization | null)[];
    getTokenizationWithUUID(uuid: UUID): (Tokenization | null)?;
    getTokensForEntityMentionID(mentionId: UUID): Token[];
    initFromTJSONProtocolObject(commJSONObject: object): Communication;
    initFromTJSONProtocolString(commJSONString: string): Communication;
    toTJSONProtocolObject(): object;
    toTJSONProtocolString(): string;
  }
}
