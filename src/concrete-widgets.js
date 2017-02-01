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
        if (options && options.communicationDivClass) {
            communicationDiv.addClass(options.communicationDivClass);
        }

        if (communication.sectionList && communication.sectionList.length) {
            for (var i = 0; i < communication.sectionList.length; i++) {
                communicationDiv.append(
                    widget.createSectionDiv(communication.sectionList[i], options));
            }
        }
        else {
            console.log('WARNING: CreateWidgets.createCommunicationsDiv() was passed a Communication ' +
                        'without any Sections');
            communicationDiv.text(communication.text);
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

        var sectionDiv = $('<div>')
            .addClass('section section_' + section.uuid.uuidString);
        if (opts.sectionDivClass) {
            sectionDiv.addClass(opts.sectionDivClass);
        }

        if (!section.sentenceList) {
            return sectionDiv;
        }

        var textSpansUsed = false;
        if (section.sentenceList.length > 0) {
            textSpansUsed = concreteObjectUsesTextSpans(section.sentenceList[0]);
        }

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
        if (options && options.sentenceDivClass) {
            sentenceDiv.addClass(options.sentenceDivClass);
        }
        return sentenceDiv;
    };

    /**
     * Returns a jQuery object containing the DOM structure:
     * <pre>
     *     &lt;div class="tokenization_container"&gt;
     *         &lt;div class="tokenization tokenization_[TOKENIZATION_UUID]"&gt;
     *             &lt;span class="token token_[TOKENIZATION_UUID]_[TOKEN_INDEX_0]"&gt;
     *             &lt;span class="token_padding token_padding_[TOKENIZATION_UUID]_[TOKEN_INDEX_0]"&gt;
     *             &lt;span class="token token_[TOKENIZATION_UUID]_[TOKEN_INDEX_1]"&gt;
     *             &lt;span class="token_padding token_padding_[TOKENIZATION_UUID]_[TOKEN_INDEX_1]"&gt;
     *             [...]
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

        var tokenizationContainerDiv = $('<div>')
            .addClass('tokenization_container');

        var tokenizationDiv = $('<div>')
            .addClass('tokenization tokenization_' + tokenization.uuid.uuidString)
            .data('tokenization', tokenization);
        if (opts.tokenizationDivClass) {
            tokenizationDiv.addClass(opts.tokenizationDivClass);
        }

        for (var i = 0; i < tokenList.length; i++) {
            var tokenText;
            if (opts.convertTreebankBrackets) {
                tokenText = convertTreebankBrackets(tokenList[i].text);
            }
            else {
                tokenText = tokenList[i].text;
            }

            var tokenSpan = $('<span>')
                .addClass('token token_' + tokenization.uuid.uuidString + '_' + i)
                .data('tokenization', tokenization)
                .data('tokenIndex', i)
                .text(tokenText);
            tokenizationDiv.append(tokenSpan);

            if (i+1 < tokenList.length) {
                var tokenPaddingSpan = $('<span>')
                    .addClass('token_padding token_padding_' + tokenization.uuid.uuidString + '_' + i);

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
        tokenizationContainerDiv.append(tokenizationDiv);
        return tokenizationContainerDiv;
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
            Number.isInteger(concreteObject.textSpan.start) &&
            Number.isInteger(concreteObject.textSpan.ending)) {
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
                this.addEntityMentionSet(communication.entityMentionSetList[i]);
            }
        }
        return this;
    };

    /**
     * @memberOf jQuery.fn
     * @param {Communication} communication
     * @returns {jQuery_Object}
     */
    $.fn.addAllEntitiesInCommunication = function(communication) {
        // Add DOM classes for entity and entity_set UUID's to EntityMentions for the Entities
        if (communication.entitySetList) {
            for (var entitySetListIndex in communication.entitySetList) {
                for (var entityListIndex in communication.entitySetList[entitySetListIndex].entityList) {
                    var entity = communication.entitySetList[entitySetListIndex].entityList[entityListIndex];
                    for (var i = 0; i < entity.mentionIdList.length; i++) {
                        var entityMentionId = entity.mentionIdList[i];
                        this.find('.entity_mention_' + entityMentionId.uuidString)
                            .addClass('entity_' + entity.uuid.uuidString)
                            .addClass('entity_set_' + communication.entitySetList[entitySetListIndex].uuid.uuidString);
                    }
                }
            }
        }
    };

    /**
     * @memberOf jQuery.fn
     * @param {EntityMention} entityMention
     * @returns {jQuery_Object}
     */
    $.fn.addEntityMention = function(entityMention) {
        this.getEntityMentionElements(entityMention)
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
                this.addEntityMention(entityMentionSet.mentionList[i]);
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
     * Add a callback function that will be called when the user
     * selects DOM elements with their mouse.  If the selected
     * elements contain token text, all callback functions registered
     * with addTokenSelectCallback() will be called and passed a
     * TokenRefSequence for the user-selected tokens.
     *
     * @memberOf jQuery.fn
     * @returns {jQuery_Object}
     */
    $.fn.enableTokenSelectCallbacks = function() {
        this.mouseup({tokenSelectCallbacks: this.getTokenSelectCallbacks()}, function (event) {
            var selection = window.getSelection();
            if (selection.rangeCount) {
                // Selection objects have, at most, one Range:
                //   https://developer.mozilla.org/en-US/docs/Web/API/Selection
                var range = selection.getRangeAt(0);
                var ancestorElement = $(range.commonAncestorContainer);
                if (ancestorElement.hasClass('tokenization')) {
                    var firstTokenElement = $(range.startContainer).parents('.token,.token_padding');
                    var lastTokenElement = $(range.endContainer).parents('.token,.token_padding');
                    var tokenElements = firstTokenElement.nextUntil(lastTokenElement).filter('.token');
                    var tokenRefSequence = new TokenRefSequence();
                    var tokenIndex;
                    var tokenizationId;

                    tokenIndexAndUUID = getTokenIndexAndUUID(firstTokenElement);
                    tokenRefSequence.tokenizationId = tokenIndexAndUUID[1];
                    tokenRefSequence.tokenIndexList = [tokenIndexAndUUID[0]];
                    tokenElements.each(function(i, tokenElement) {
                        tokenRefSequence.tokenIndexList.push(getTokenIndex($(tokenElement)));
                    });
                    tokenRefSequence.tokenIndexList.push(getTokenIndex(lastTokenElement));
                    event.data.tokenSelectCallbacks.fire(tokenRefSequence);
                }
                else if (ancestorElement.hasClass('section')) {
                    // TODO: What to do when user selects tokens from multiple sentences?
                }
                else if (ancestorElement.hasClass('communication')) {
                    // TODO: What to do when user selections tokens from multiple sections?
                }
            }
        });
        return this;
    };

    /**
     * @memberOf jQuery.fn
     * @param {EntityMention} entityMention
     * @returns {jQuery_Object}
     */
    $.fn.getEntityMentionElements = function(entityMention) {
        return this.getTokenRefSequenceElements(entityMention.tokens);
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
     * Returns a jQuery object for DOM element(s) specified by tokenization+tokenIndex
     *
     * @memberOf jQuery.fn
     * @param {Tokenization} tokenization
     * @param {int} tokenIndex
     * @returns {jQuery_Object} - jQuery Object for DOM element(s) for tokenization+tokenIndex
     */
    $.fn.getTokenElementsWithIndex = function(tokenization, tokenIndex) {
        if (!tokenization) {
            return $();
        }

        return this.find('.token_' + tokenization.uuid.uuidString + '_' + tokenIndex);
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
                    '.token_' + tokenization.uuid.uuidString +
                        '_' + tokenTagging.taggedTokenList[i].tokenIndex);
            }
        }

        var tokenizationObject = this.find('.tokenization_' + tokenization.uuid.uuidString);
        var tokenObjects = tokenizationObject.find(tokenSelectorStrings.join(', '));

        return tokenObjects;
    };

    /**
     * @memberOf jQuery.fn
     * @param {Tokenization} tokenization
     * @returns {jQuery_Object}
     */
    $.fn.getTokenizationElements = function(tokenization) {
        return this.find('.tokenization.tokenization_' + tokenization.uuid.uuidString);
    };

    /**
     * @memberOf jQuery.fn
     * @param {Tokenization} tokenization
     * @returns {jQuery_Object}
     */
    $.fn.getTokenElements = function(tokenization) {
        return this.getTokenizationElements(tokenization).find('.token');
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
                '.token_' + tokenRefSequence.tokenizationId.uuidString +
                    '_' + tokenRefSequence.tokenIndexList[i]);
        }

        var tokenizationObject = this.find('.tokenization_' + tokenRefSequence.tokenizationId.uuidString);
        var tokenObjects = tokenizationObject.find(tokenSelectorStrings.join(', '));

        return tokenObjects;
    };

    /**
     * Returns the jQuery.Callbacks object for "token select" callback
     * functions.  If the jQuery.Callbacks object does not already exist,
     * create it.  For details about jQuery.Callbacks, see:
     *
     *   http://api.jquery.com/category/callbacks-object/
     *
     * The "token select" callback functions will not be called unless
     * the user has also called enableTokenSelectCallbacks().
     *
     * When the user selects a set of displayed tokens, all registered
     * "token select" callback functions will be called and passed a
     * TokenRefSequence containing the selected tokens.
     *
     * @memberOf jQuery.fn
     * @returns {jQuery.Callbacks}
     */
    $.fn.getTokenSelectCallbacks = function() {
        if (!this.data('tokenSelectCallbacks')) {
            this.data('tokenSelectCallbacks', jQuery.Callbacks());
        }
        return this.data('tokenSelectCallbacks');
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


    function getTokenIndexAndUUID(tokenElement) {
        var classList = tokenElement.attr('class').split(' ');
        for (var i in classList) {
            var fields = classList[i].split('_');
            if (fields.length === 3 && fields[0] == 'token' && fields[1].length === 36) {
                return [parseInt(fields[2]), new UUID({'uuidString': fields[1]})];
            }
        }
        return [undefined, undefined];
    }

    function getTokenIndex(tokenElement) {
        return getTokenIndexAndUUID(tokenElement)[0];
    }

    function getTokenUUID(tokenElement) {
        return getTokenIndexAndUUID(tokenElement)[1];
    }

})(jQuery);
