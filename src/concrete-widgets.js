/**
 * @namespace concrete.widget
 */

var concrete = concrete || {};

concrete.widget = (function() {
    var widget = {};

    /**
     * Returns a jQuery object containing the DOM structure:
     * <pre>
     *     &lt;div class="communication communication_[COMMUNICATION_UUID]"&gt;
     *         &lt;div class="section section_[SECTION_UUID]"&gt;
     *             [...]
     *         &lt;div class="section section_[SECTION_UUID]"&gt;
     *             [...]
     * </pre>
     * createCommunicationDiv() calls createSectionDiv() to create the
     * DOM structure for the Sections.
     *
     * @memberof concrete.widget
     * @param {Communication} communication
     * @param {Object} options
     * @returns {jQuery_Object}
     */
    widget.createCommunicationDiv = function(communication, options) {
        if (!communication) {
            throw 'ERROR: CreateWidgets.createCommunicationDiv() must be passed a communication';
        }

        var communicationDiv = $('<div>')
            .addClass('communication communication_' + communication.uuid.uuidString);

        if (communication.sectionList && communication.sectionList.length) {
            for (var i = 0; i < communication.sectionList.length; i++) {
                communicationDiv.append(
                    widget.createSectionDiv(communication.sectionList[i], options));
            }
        }
        else {
            console.log('WARNING: CreateWidgets.createCommunicationsDiv() was passed a Communication ' +
                        'without any Sections');
        }

        return communicationDiv;
    };

    /**
     * Returns a jQuery object containing the DOM structure:
     * <pre>
     *     &lt;div class="section section_[SECTION_UUID]"&gt;
     *         &lt;div class="sentence sentence_[SENTENCE_UUID]"&gt;
     *             [...]
     *         &lt;span class="sentence_padding"&gt; &lt;/span&gt;
     *         &lt;div class="sentence sentence_[SENTENCE_UUID]"&gt;
     *             [...]
     * </pre>
     * createSectionDiv() calls createSentenceDiv() to create the
     * DOM structure for the Sentence.
     *
     * @memberof concrete.widget
     * @param {Section} section
     * @param {Object} options
     * @returns {jQuery_Object}
     */
    widget.createSectionDiv = function(section, options) {
        if (!section) {
            throw 'CreateWidgets.createSectionDiv() must be passed a section';
        }

        var opts = $.extend({}, widget.createSectionDiv.defaultOptions, options);

        var textSpansUsed = false;
        if (section.sentenceList.length > 0) {
            textSpansUsed = concreteObjectUsesTextSpans(section.sentenceList[0]);
        }

        var sectionDiv = $('<div>')
            .addClass('section section_' + section.uuid.uuidString);

        for (var i = 0; i < section.sentenceList.length; i++) {
            sectionDiv.append(
                widget.createSentenceDiv(section.sentenceList[i], options));

            if (i+1 < section.sentenceList.length) {
                if (textSpansUsed && !opts.whitespaceTokenization) {
                    // Add whitespace IFF there is a character-offset gap between sentences
                    if ((section.sentenceList[i+1].textSpan.start - section.sentenceList[i].textSpan.ending) > 0) {
                        sectionDiv.append(
                            $('<span>')
                                .addClass('sentence_padding')
                                .text(' '));
                    }
                }
            }
        }

        return sectionDiv;
    };

    widget.createSectionDiv.defaultOptions = {
        'whitespaceTokenization': false,
    };

    /**
     * Returns a jQuery object containing the DOM structure:
     * <pre>
     *     &lt;div class="sentence sentence_[SENTENCE_UUID]"&gt;
     *         &lt;div class="tokenization tokenization_[TOKENIZATION_UUID]"&gt;
     *             [...]
     * </pre>
     * createSentenceDiv() calls createTokenizationDiv() to create the
     * DOM structure for the Sentence's Tokenization.
     *
     * @memberof concrete.widget
     * @param {Sentence} sentence
     * @param {Object} options
     * @returns {jQuery_Object}
     */
    widget.createSentenceDiv = function(sentence, options) {
        if (!sentence) {
            throw 'CreateWidgets.createSentenceDiv() must be passed a sentence';
        }

        var sentenceDiv = $('<div>')
            .addClass('sentence sentence_' + sentence.uuid.uuidString)
            .append(widget.createTokenizationDiv(sentence.tokenization, options));
        return sentenceDiv;
    };

    /**
     * Returns a jQuery object containing the DOM structure:
     * <pre>
     *     &lt;div class="tokenization tokenization_[TOKENIZATION_UUID]"&gt;
     *         &lt;span class="token tokenization_[TOKENIZATION_UUID]_[TOKEN_INDEX_0]"&gt;
     *         &lt;span class="token_padding"&gt;
     *         &lt;span class="token tokenization_[TOKENIZATION_UUID]_[TOKEN_INDEX_1]"&gt;
     *         &lt;span class="token_padding"&gt;
     *         [...]
     * </pre>
     *
     * @memberof concrete.widget
     * @param {Tokenization} tokenization
     * @param {Object} options
     * @returns {jQuery_Object}
     */
    widget.createTokenizationDiv = function(tokenization, options) {
        if (!tokenization) {
            throw 'CreateWidgets.createTokenizationDiv() must be passed a tokenization';
        }

        var opts = $.extend({}, widget.createTokenizationDiv.defaultOptions, options);
        var textSpansUsed = tokenizationUsesTextSpans(tokenization);
        var tokenList = tokenization.tokenList.tokenList;

        var tokenizationDiv = $('<div>')
            .addClass('tokenization tokenization_' + tokenization.uuid.uuidString);

        for (var i = 0; i < tokenList.length; i++) {
            var tokenText;
            if (opts.convertTreebankBrackets) {
                tokenText = convertTreebankBrackets(tokenList[i].text);
            }
            else {
                tokenText = tokenList[i].text;
            }

            var tokenSpan = $('<span>')
                .addClass('token tokenization_' + tokenization.uuid.uuidString + '_' + i)
                .text(tokenText);
            tokenizationDiv.append(tokenSpan);

            if (i+1 < tokenList.length) {
                var tokenPaddingSpan = $('<span>')
                    .addClass('token_padding');

                if (textSpansUsed && !opts.whitespaceTokenization) {
                    // Add whitespace IFF there is a character-offset gap between tokens
                    if ((tokenList[i+1].textSpan.start - tokenList[i].textSpan.ending) > 0) {
                        tokenPaddingSpan.text(' ');
                    }
                }
                else {
                    // Without TextSpans, we can't determine character offsets between
                    // tokens, so we default to using whitespace tokenization
                    tokenPaddingSpan.text(' ');
                }
                tokenizationDiv.append(tokenPaddingSpan);
            }
        }
        return tokenizationDiv;
    };

    widget.createTokenizationDiv.defaultOptions = {
        'convertTreebankBrackets': true,
        'whitespaceTokenization': false,
    };

    /**
     * Returns a boolean indicating if a Concrete Object (e.g. Section, Sentence, Token)
     * uses an (optional) TextSpan field.
     *
     * @param {Concrete_Object} concreteObject
     * @returns {Boolean}
     */
    function concreteObjectUsesTextSpans(concreteObject) {
        if (concreteObject &&
            concreteObject.textSpan &&
            concreteObject.textSpan.start &&
            concreteObject.textSpan.ending) {
            return true;
        }
        else {
            return false;
        }
    }

    /**
     * Function takes a token string, returns a "cleaned" version of that string
     *  with Penn Treebank-style bracket symbols replaced with actual bracket symbols.
     *
     * @param {String} tokenText
     * @returns {String}
     */
    function convertTreebankBrackets(tokenText) {
        // Convert Penn Treebank-style symbols for brackets to bracket characters
        //   http://www.cis.upenn.edu/~treebank/tokenization.html
        switch(tokenText) {
        case '-LRB-':
            return '(';
        case '-RRB-':
            return ')';
        case '-LSB-':
            return '[';
        case '-RSB-':
            return ']';
        case '-LCB-':
            return '{';
        case '-RCB-':
            return '}';
        default:
            return tokenText;
        }
    }

    /**
     * Returns a boolean indicating if a Tokenization's Tokens use (optional) TextSpans
     * @param {Tokenization} tokenization
     * @returns {Boolean}
     */
    function tokenizationUsesTextSpans(tokenization) {
        // We currently assume that if the first Token has a TextSpan, all Tokens have TextSpans
        return concreteObjectUsesTextSpans(tokenization.tokenList.tokenList[0]);
    }

    return widget;
})();


/**
 * See (http://jquery.com/).
 * @name jQuery
 * @class
 * See the jQuery Library  (http://jquery.com/) for full details.  This just
 * documents the function and classes that are added to jQuery by this plug-in.
 */

/**
 * See (http://jquery.com/)
 * @name fn
 * @class
 * See the jQuery Library  (http://jquery.com/) for full details.  This just
 * documents the function and classes that are added to jQuery by this plug-in.
 * @memberOf jQuery
 */

(function($) {
    /**
     * @memberOf jQuery.fn
     * @param {Communication} communication
     * @returns {jQuery_Object}
     */
    $.fn.addAllEntityMentionsInCommunication = function(communication) {
        if (communication && communication.entityMentionSetList && communication.entityMentionSetList.length > 0) {
            for (var i = 0; i < communication.entityMentionSetList.length; i++) {
                $.fn.addEntityMentionSet(communication.entityMentionSetList[i]);
            }
        }
        return this;
    };

    /**
     * @memberOf jQuery.fn
     * @param {EntityMention} entityMention
     * @returns {jQuery_Object}
     */
    $.fn.addEntityMention = function(entityMention) {
        $.fn.getEntityMentionElements(entityMention)
            .addClass('entity_mention entity_mention_' + entityMention.uuid.uuidString);
        return this;
    };

    /**
     * @memberOf jQuery.fn
     * @param {EntityMentionSet} entityMentionSet
     * @returns {jQuery_Object}
     */
    $.fn.addEntityMentionSet = function(entityMentionSet) {
        if (entityMentionSet && entityMentionSet.mentionList && entityMentionSet.mentionList.length > 0) {
            for (var i = 0; i < entityMentionSet.mentionList.length; i++) {
                $.fn.addEntityMention(entityMentionSet.mentionList[i]);
            }
        }
        return this;
    };

    /**
     * @memberOf jQuery.fn
     * @param {Communication} communication
     * @param {Object} options
     * @returns {jQuery_Object}
     */
    $.fn.communicationWidget = function(communication, options) {
        this.append(concrete.widget.createCommunicationDiv(communication, options));
        return this;
    };

    /**
     * @memberOf jQuery.fn
     * @param {EntityMention} entityMention
     * @returns {jQuery_Object}
     */
    $.fn.getEntityMentionElements = function(entityMention) {
        return $.fn.getTokenRefSequenceElements(entityMention.tokens);
    };

    /**
     * @memberOf jQuery.fn
     * @param {Sentence} sentence
     * @returns {jQuery_Object}
     */
    $.fn.getSentenceElements = function(sentence) {
        return this.find('.sentence.sentence_' + sentence.uuid.uuidString);
    };

    /**
     * Returns a jQuery object for the DOM elements for the Tokens in a Tokenization,
     * selecting only those Tokens whose TokenTagging tags satisfy the specified
     * matchFunction.
     *
     * @memberOf jQuery.fn
     * @param {Tokenization} tokenization
     * @param {TokenTagging} tokenTagging - The TokenTagging must be for the Tokenization
     *                                      specified as the first parameter.
     * @param {Function} matchFunction - Function that takes as input a TaggedToken.tag string,
     *                                   and returns true or false based on whether or not the
     *                                   string "matches".
     * @returns {jQuery_Object} - jQuery Object for DOM elements for "matching" Tokens
     */
    $.fn.getTokenElementsWithMatchingTag = function(tokenization, tokenTagging, matchFunction) {
        if (!tokenization || !tokenTagging || !tokenTagging.taggedTokenList || !matchFunction) {
            return $();
        }

        var tokenSelectorStrings = [];
        for (var i = 0; i < tokenTagging.taggedTokenList.length; i++) {
            if (matchFunction(tokenTagging.taggedTokenList[i].tag)) {
                tokenSelectorStrings.push(
                    '.tokenization_' + tokenization.uuid.uuidString +
                        '_' + tokenTagging.taggedTokenList[i].tokenIndex);
            }
        }

        var tokenizationObject = this.find('.tokenization_' + tokenization.uuid.uuidString);
        var tokenObjects = tokenizationObject.find(tokenSelectorStrings.join(', '));

        return tokenObjects;
    };

    /**
     * @memberOf jQuery.fn
     * @param {TokenRefSequence} tokenRefSequence
     * @returns {jQuery_Object}
     */
    $.fn.getTokenRefSequenceElements = function(tokenRefSequence) {
        if (!tokenRefSequence && !tokenRefSequence.tokenizationId) {
            return $();
        }

        var tokenSelectorStrings = [];
        for (var i = 0; i < tokenRefSequence.tokenIndexList.length; i++) {
            tokenSelectorStrings.push(
                '.tokenization_' + tokenRefSequence.tokenizationId.uuidString +
                    '_' + tokenRefSequence.tokenIndexList[i]);
        }

        var tokenizationObject = this.find('.tokenization_' + tokenRefSequence.tokenizationId.uuidString);
        var tokenObjects = tokenizationObject.find(tokenSelectorStrings.join(', '));

        return tokenObjects;
    };

    /**
     * @memberOf jQuery.fn
     * @param {Section} section
     * @param {Object} options
     * @returns {jQuery_Object}
     */
    $.fn.sectionWidget = function(section, options) {
        this.append(concrete.widget.createSectionDiv(section, options));
        return this;
    };

    /**
     * @memberOf jQuery.fn
     * @param {Sentence} sentence
     * @param {Object} options
     * @returns {jQuery_Object}
     */
    $.fn.sentenceWidget = function(sentence, options) {
        this.append(concrete.widget.createSentenceDiv(sentence, options));
        return this;
    };

    /**
     * @memberOf jQuery.fn
     * @param {Tokenization} tokenization
     * @param {Object} options
     * @returns {jQuery_Object}
     */
    $.fn.tokenizationWidget = function(tokenization, options) {
        this.append(concrete.widget.createTokenizationDiv(tokenization, options));
        return this;
    };

})(jQuery);
