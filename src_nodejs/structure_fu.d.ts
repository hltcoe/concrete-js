import {TaggedToken} from './structure_types';

type BIOValue = 'B' | 'I' | 'O';

declare module "./structure_types" {
  interface Tokenization {
    addTokenTagging(tokenTagging: TokenTagging): void;
    getTokenTaggingsOfType(taggingType: string): TokenTagging[];
  }
  // How to declare type of TokenTagging.create?
  interface TokenTagging {
    bioGetBIOValue(tokenIndex: number): BIOValue | null;
    bioGetTagValue(tokenIndex: number): BIOValue | null;
    bioGetTagSeparator(): string;
    bioGetTokenIndexForB(tokenIndex: number): number;
    bioSetTaggedTokenTag(bioValue: BIOValue, tagText: string, tokenIndex: number): void;
    bioSetTagSeparator(separator: string): void;
    deepCopyTaggedTokenList(): TaggedToken[];
    getTaggedTokenWithTokenIndex(tokenIndex: number): TaggedToken | null;
    setAllTaggedTokenTags(tokenization: Tokenization, tagText: string): void;
    setTaggedTokenTag(tagText: string, tokenIndex: number): void;
  }
}
