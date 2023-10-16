import './communication_types';
import {UUID} from './uuid_types';
import {Entity, EntityMention, EntityMentionSet} from './entities_types';
import {Section, Sentence, Tokenization, Token} from './structure_types';
import {Situation, SituationMention} from './situations_types';

declare module "./communication_types" {
  interface Communication {
    addInternalReferences(): {
      entityForUUID: {[index: string]: Entity},
      entityMentionForUUID: {[index: string]: EntityMention},
      sectionForUUID: {[index: string]: Section},
      sentenceForUUID: {[index: string]: Sentence},
      situationForUUID: {[index: string]: Situation},
      situationMentionForUUID: {[index: string]: SituationMention},
      tokenizationForUUID: {[index: string]: Tokenization},
    };
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
