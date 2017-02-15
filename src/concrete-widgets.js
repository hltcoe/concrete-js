/**
 * @external jQuery_Object
 * @see https://learn.jquery.com/using-jquery-core/jquery-object/
 */

/**
 * @namespace concrete
 */
var concrete = concrete || {};

/**
 * @namespace concrete.widget
 */
concrete.widget = (function() {
    var widget = {};

    /**
     * Returns a jQuery object containing the DOM structure:
     *
     *     <div class="communication communication_[COMMUNICATION_UUID]">
     *         <div class="section section_[SECTION_UUID]">
     *             [...]
     *         <div class="section section_[SECTION_UUID]">
     *             [...]
     *
     * {@link concrete.widget.createCommunicationDiv} calls
     * {@link concrete.widget.createSectionDiv} to create the
     * DOM structure for the Sections.
     *
     * @function concrete.widget.createCommunicationDiv
     * @memberof concrete.widget
     * @param {Communication} communication
     * @param {Object} options
     * @returns {external:jQuery_Object}
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
     *
     *     <div class="section section_[SECTION_UUID]">
     *         <div class="sentence sentence_[SENTENCE_UUID]">
     *             [...]
     *         <span class="sentence_padding"> </span>
     *         <div class="sentence sentence_[SENTENCE_UUID]">
     *             [...]
     *
     * {@link concrete.widget.createSectionDiv} calls
     * {@link concrete.widget.createSentenceDiv}
     * to create the DOM structure for the Sentence.
     *
     * @function concrete.widget.createSectionDiv
     * @memberof concrete.widget
     * @param {Section} section
     * @param {Object} options
     * @returns {external:jQuery_Object}
     */
    widget.createSectionDiv = function(section, options) {
        if (!section) {
            throw 'CreateWidgets.createSectionDiv() must be passed a section';
        }

        var opts = $.extend({}, widget.createSectionDiv.defaultOptions, options);

        var sectionDiv = $('<div>')
            .addClass('section section_' + section.uuid.uuidString)
            .data('section', section);
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
     *
     *     <div class="sentence sentence_[SENTENCE_UUID]">
     *         <div class="tokenization tokenization_[TOKENIZATION_UUID]">
     *             [...]
     *
     * {@link concrete.widget.createSentenceDiv} calls
     * {@link concrete.widget.createTokenizationDiv}
     * to create the DOM structure for the Sentence's Tokenization.
     *
     * @function concrete.widget.createSentenceDiv
     * @memberof concrete.widget
     * @param {Sentence} sentence
     * @param {Object} options
     * @returns {external:jQuery_Object}
     */
    widget.createSentenceDiv = function(sentence, options) {
        if (!sentence) {
            throw 'CreateWidgets.createSentenceDiv() must be passed a sentence';
        }

        var sentenceDiv = $('<div>')
            .addClass('sentence sentence_' + sentence.uuid.uuidString)
            .append(widget.createTokenizationDiv(sentence.tokenization, options))
            .data('sentence', sentence);
        if (options && options.sentenceDivClass) {
            sentenceDiv.addClass(options.sentenceDivClass);
        }
        return sentenceDiv;
    };

    /**
     * Returns a jQuery object containing the DOM structure:
     *
     *     <div class="tokenization_container">
     *         <div class="tokenization tokenization_[TOKENIZATION_UUID]">
     *             <span class="token token_[TOKENIZATION_UUID]_[TOKEN_INDEX_0]">
     *             <span class="token_padding token_padding_[TOKENIZATION_UUID]_[TOKEN_INDEX_0]">
     *             <span class="token token_[TOKENIZATION_UUID]_[TOKEN_INDEX_1]">
     *             <span class="token_padding token_padding_[TOKENIZATION_UUID]_[TOKEN_INDEX_1]">
     *             [...]
     *
     * @function concrete.widget.createTokenizationDiv
     * @memberof concrete.widget
     * @param {Tokenization} tokenization
     * @param {Object} options
     * @returns {external:jQuery_Object}
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
     * Return a list of TokenRefSequences containing all tokens
     * that are currently selected.
     *
     * If all the selected tokens belong to the same tokenization,
     * then there will only be one TokenRefSequence in the list.  But
     * if the selected tokens include tokens from multiple sentences
     * or sections, multiple TokenRefSequences will be returned.
     *
     * @function concrete.widget.getSelectedTokenRefSequences
     * @memberof concrete.widget
     * @returns {TokenRefSequence[]}
     */
    widget.getSelectedTokenRefSequences = function() {
        function getTokenRefSequenceForEndContainer(range) {
            var lastTokenesqueLastSentence = $(range.endContainer).parents('.token,.token_padding');
            var tokenRefSequence = new TokenRefSequence();

            if (lastTokenesqueLastSentence.hasClass('token')) {
                tokenRefSequence.tokenizationId = widget.getTokenizationUUIDForToken(lastTokenesqueLastSentence);
            }
            else {
                tokenRefSequence.tokenizationId = widget.getTokenizationUUIDForToken(
                    lastTokenesqueLastSentence.prev('.token'));
            }
            tokenRefSequence.tokenIndexList = [];
            lastTokenesqueLastSentence.prevAll('.token').each(function(i, tokenElement) {
                tokenRefSequence.tokenIndexList.push(widget.getTokenIndex($(tokenElement)));
            });
            if (lastTokenesqueLastSentence.hasClass('token')) {
                tokenRefSequence.tokenIndexList.push(widget.getTokenIndex(lastTokenesqueLastSentence));
            }

            return tokenRefSequence;
        }

        function getTokenRefSequenceForEntireTokenization(tokenizationElement) {
            var tokenRefSequence = new TokenRefSequence();
            tokenRefSequence.tokenizationId = widget.getTokenizationUUIDForToken(tokenizationElement.find('.token').first());
            tokenRefSequence.tokenIndexList = [];
            tokenizationElement.find('.token').each(function(i, tokenElement) {
                tokenRefSequence.tokenIndexList.push(widget.getTokenIndex($(tokenElement)));
            });
            return tokenRefSequence;
        }

        function getTokenRefSequenceForStartContainer(range) {
            var firstTokenesqueFirstSentence = $(range.startContainer).parents('.token,.token_padding');

            var tokenRefSequence = new TokenRefSequence();
            tokenRefSequence.tokenIndexList = [];
            if (firstTokenesqueFirstSentence.hasClass('token')) {
                tokenRefSequence.tokenizationId = widget.getTokenizationUUIDForToken(firstTokenesqueFirstSentence);
                tokenRefSequence.tokenIndexList.push(widget.getTokenIndex(firstTokenesqueFirstSentence));
            }
            else {
                tokenRefSequence.tokenizationId = widget.getTokenizationUUIDForToken(
                    firstTokenesqueFirstSentence.next('.token'));
            }
            firstTokenesqueFirstSentence.nextAll('.token').each(function(i, tokenElement) {
                tokenRefSequence.tokenIndexList.push(widget.getTokenIndex($(tokenElement)));
            });

            return tokenRefSequence;
        }

        var selection = window.getSelection();
        var tokenRefSequenceList = [];

        if (selection.rangeCount) {
            // Selection objects have, at most, one Range:
            //   https://developer.mozilla.org/en-US/docs/Web/API/Selection
            var range = selection.getRangeAt(0);
            var ancestorElement = $(range.commonAncestorContainer);

            if (ancestorElement.hasClass('tokenization')) {
                // The selected elements all belong to a single tokenization

                // The starting and ending elements of range may be tokens or token_padding ("tokenesque")
                var firstTokenesqueElement = $(range.startContainer).parents('.token,.token_padding');
                var lastTokenesqueElement = $(range.endContainer).parents('.token,.token_padding');
                var middleTokenElements = firstTokenesqueElement.nextUntil(lastTokenesqueElement).filter('.token');

                var tokenRefSequence = new TokenRefSequence();
                tokenRefSequence.tokenIndexList = [];
                if (firstTokenesqueElement.hasClass('token')) {
                    tokenRefSequence.tokenizationId = widget.getTokenizationUUIDForToken(firstTokenesqueElement);
                    tokenRefSequence.tokenIndexList.push(widget.getTokenIndex(firstTokenesqueElement));
                }
                else {
                    tokenRefSequence.tokenizationId = widget.getTokenizationUUIDForToken(
                        firstTokenesqueElement.next('.token'));
                }
                middleTokenElements.each(function(i, tokenElement) {
                    tokenRefSequence.tokenIndexList.push(widget.getTokenIndex($(tokenElement)));
                });
                if (lastTokenesqueElement.hasClass('token')) {
                    tokenRefSequence.tokenIndexList.push(widget.getTokenIndex(lastTokenesqueElement));
                }
                tokenRefSequenceList.push(tokenRefSequence);
            }
            else if (ancestorElement.hasClass('section')) {
                // The selected elements belong to multiple tokenizations in a single section

                var firstSentenceElement = $(range.startContainer).parents('.sentence');
                var lastSentenceElement = $(range.endContainer).parents('.sentence');
                var middleSentenceElements = firstSentenceElement.nextUntil(lastSentenceElement).filter('.sentence');

                tokenRefSequenceList.push(getTokenRefSequenceForStartContainer(range));
                middleSentenceElements.each(function(i, middleSentenceElement) {
                    tokenRefSequenceList.push(
                        getTokenRefSequenceForEntireTokenization(
                            $(middleSentenceElement).find('.tokenization')));
                });
                tokenRefSequenceList.push(getTokenRefSequenceForEndContainer(range));
            }
            else if (ancestorElement.hasClass('communication')) {
                // The selected elements belong to tokenizations in multiple sections

                var firstSectionElement = $(range.startContainer).parents('.section');
                var lastSectionElement = $(range.endContainer).parents('.section');
                var middleSectionElements = firstSectionElement.nextUntil(lastSectionElement).filter('.section');

                tokenRefSequenceList.push(getTokenRefSequenceForStartContainer(range));
                var firstSectionFirstSentence = $(range.startContainer).parents('.sentence');
                var firstSectionSentences = firstSectionFirstSentence.nextAll('.sentence').each(
                    function(i, sentenceElement) {
                        tokenRefSequenceList.push(
                            getTokenRefSequenceForEntireTokenization(
                                $(sentenceElement).find('.tokenization')));
                    }
                );

                middleSectionElements.find('.tokenization').each(function(i, tokenizationElement) {
                    tokenRefSequenceList.push(
                        getTokenRefSequenceForEntireTokenization(
                            $(tokenizationElement)));
                });

                var lastSectionLastSentence = $(range.endContainer).parents('.sentence');
                var lastSectionSentences = lastSectionLastSentence.prevAll('.sentence').each(
                    function(i, sentenceElement) {
                        tokenRefSequenceList.push(
                            getTokenRefSequenceForEntireTokenization(
                                $(sentenceElement).find('.tokenization')));
                    }
                );
                tokenRefSequenceList.push(getTokenRefSequenceForEndContainer(range));
            }
        }

        return tokenRefSequenceList;
    };

    widget.getTokenIndexAndTokenizationUUID = function(tokenElement) {
        var classList = tokenElement.attr('class').split(' ');
        for (var i in classList) {
            var fields = classList[i].split('_');
            if (fields.length === 3 && fields[0] === 'token' && fields[1].length === 36) {
                return [parseInt(fields[2]), new UUID({'uuidString': fields[1]})];
            }
            else if (fields.length === 4 && fields[0] === 'token' &&
                     fields[1] === 'padding' && fields[2].length === 36) {
                return [parseInt(fields[3]), new UUID({'uuidString': fields[2]})];
            }
        }
        return [undefined, undefined];
    };

    widget.getTokenIndex = function(tokenElement) {
        return widget.getTokenIndexAndTokenizationUUID(tokenElement)[0];
    };

    widget.getTokenizationUUIDForToken = function(tokenElement) {
        return widget.getTokenIndexAndTokenizationUUID(tokenElement)[1];
    };


    /**
     * @function concrete.widget.getTokenRefSequenceForTokenObject
     * @memberof concrete.widget
     * @param {external:jQuery_Object} tokenObject - jQuery object for a Token element
     * @returns {TokenRefSequence}
     */
    widget.getTokenRefSequenceForTokenObject = function(tokenObject) {
        var tokenRefSequence = new TokenRefSequence();
        tokenRefSequence.tokenizationId = widget.getTokenizationUUIDForToken(tokenObject);
        tokenRefSequence.tokenIndexList = [widget.getTokenIndex(tokenObject)];
        return tokenRefSequence;
    };

    /**
     * @function concrete.widget.getTokenRefSequenceForTokensMatchingSelector
     * @memberof concrete.widget
     * @param {external:jQuery_Object} tokenizationObject - jQuery object for a Tokenization element
     * @param {String} selector - CSS selector string, e.g. '.selected_token'
     * @returns {TokenRefSequence}
     */
    widget.getTokenRefSequenceForTokensMatchingSelector = function(tokenizationObject, selector) {
        if (!tokenizationObject.hasClass('tokenization')) {
            console.error("getTokenRefSequenceForTokensWithClass() expected a jQuery object " +
                          "with class 'tokenization', but object has class(es) '" +
                          tokenizationObject.attr('class') + "'");
            return;
        }
        var tokenRefSequence = new TokenRefSequence();
        var tokenElements = tokenizationObject.find('.token');
        tokenRefSequence.tokenizationId = widget.getTokenizationUUIDForToken(tokenElements.first());
        tokenRefSequence.tokenIndexList = [];
        tokenElements.filter(selector).each(function(i, tokenElement) {
            tokenRefSequence.tokenIndexList.push(widget.getTokenIndex($(tokenElement)));
        });
        return tokenRefSequence;
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
 * The jQuery plugin namespace.
 * @external "jQuery.fn"
 * @see {@link http://learn.jquery.com/plugins/|jQuery Plugins}
 */

(function($) {
    /**
     * @function external:"jQuery.fn".addAllEntityMentionsInCommunication
     * @param {Communication} communication
     * @returns {external:jQuery_Object}
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
     * @function external:"jQuery.fn".addAllEntitiesInCommunication
     * @param {Communication} communication
     * @returns {external:jQuery_Object}
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
     * @function external:"jQuery.fn".addEntityMention
     * @param {EntityMention} entityMention
     * @returns {external:jQuery_Object}
     */
    $.fn.addEntityMention = function(entityMention) {
        this.getEntityMentionElements(entityMention)
            .addClass('entity_mention entity_mention_' + entityMention.uuid.uuidString);
        return this;
    };

    /**
     * @function external:"jQuery.fn".addEntityMentionSet
     * @param {EntityMentionSet} entityMentionSet
     * @returns {external:jQuery_Object}
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
     * @function external:"jQuery.fn".communicationWidget
     * @param {Communication} communication
     * @param {Object} options
     * @returns {external:jQuery_Object}
     */
    $.fn.communicationWidget = function(communication, options) {
        this.append(concrete.widget.createCommunicationDiv(communication, options));
        return this;
    };

    /**
     * Enable "token click" callback functions that are registered
     * through $.fn.getTokenClickCallbacks().
     *
     * When the user clicks on a displayed tokens, all registered
     * "token select" callback functions will be called and passed a
     * list of TokenRefSequences containing the selected token.
     *
     * @function external:"jQuery.fn".enableTokenClickCallbacks
     * @returns {external:jQuery_Object}
     */
    $.fn.enableTokenClickCallbacks = function() {
        this.find('.token').click({tokenClickCallbacks: this.getTokenClickCallbacks()}, function(event) {
            var tokenRefSequenceList = [concrete.widget.getTokenRefSequenceForTokenObject($(this))];
            event.data.tokenClickCallbacks.fire(tokenRefSequenceList);
        });
    };

    /**
     * Enable "token select" callback functions that are registered
     * through $.fn.getTokenSelectCallbacks().
     *
     * When the user selects a set of displayed tokens, all registered
     * "token select" callback functions will be called and passed a
     * list of TokenRefSequences containing the selected tokens.
     *
     * @function external:"jQuery.fn".enableTokenSelectCallbacks
     * @returns {external:jQuery_Object}
     */
    $.fn.enableTokenSelectCallbacks = function() {
        this.mouseup({tokenSelectCallbacks: this.getTokenSelectCallbacks()}, function (event) {
            var tokenRefSequenceList = concrete.widget.getSelectedTokenRefSequences();
            event.data.tokenSelectCallbacks.fire(tokenRefSequenceList);

            // Unselect the selected elements
            selection = window.getSelection();
            if (selection.rangeCount) {
                selection.removeAllRanges();
            }
        });
        return this;
    };

    /**
     * @function external:"jQuery.fn".getEntityMentionElements
     * @param {EntityMention} entityMention
     * @returns {external:jQuery_Object}
     */
    $.fn.getEntityMentionElements = function(entityMention) {
        return this.getTokenRefSequenceElements(entityMention.tokens);
    };

    /**
     * @function external:"jQuery.fn".getSentenceElements
     * @param {Sentence} sentence
     * @returns {external:jQuery_Object}
     */
    $.fn.getSentenceElements = function(sentence) {
        return this.find('.sentence.sentence_' + sentence.uuid.uuidString);
    };

    /**
     * Returns the jQuery.Callbacks object for "token click" callback
     * functions.  If the jQuery.Callbacks object does not already
     * exist, it will be created.
     *
     * @function external:"jQuery.fn".getTokenClickCallbacks
     * @returns {jQuery.Callbacks}
     */
    $.fn.getTokenClickCallbacks = function() {
        if (!this.data('tokenClickCallbacks')) {
            this.data('tokenClickCallbacks', jQuery.Callbacks());
        }
        return this.data('tokenClickCallbacks');
    };

    /**
     * @function external:"jQuery.fn".getTokenElements
     * @param {Tokenization} tokenization
     * @returns {external:jQuery_Object}
     */
    $.fn.getTokenElements = function(tokenization) {
        return this.getTokenizationElements(tokenization).find('.token');
    };

    /**
     * Returns a jQuery object for .token element(s) specified by tokenization+tokenIndex
     *
     * @function external:"jQuery.fn".getTokenElementsWithIndex
     * @param {Tokenization} tokenization
     * @param {int} tokenIndex
     * @returns {external:jQuery_Object} - jQuery Object for .token element(s) for tokenization+tokenIndex
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
     * @function external:"jQuery.fn".getTokenElementsWithMatchingTag
     * @param {Tokenization} tokenization
     * @param {TokenTagging} tokenTagging - The TokenTagging must be for the Tokenization
     *                                      specified as the first parameter.
     * @param {Function} matchFunction - Function that takes as input a TaggedToken.tag string,
     *                                   and returns true or false based on whether or not the
     *                                   string "matches".
     * @returns {external:jQuery_Object} - jQuery Object for DOM elements for "matching" Tokens
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
     * @function external:"jQuery.fn".getTokenizationElements
     * @param {Tokenization} tokenization
     * @returns {external:jQuery_Object}
     */
    $.fn.getTokenizationElements = function(tokenization) {
        return this.find('.tokenization.tokenization_' + tokenization.uuid.uuidString);
    };

    /**
     * Returns a jQuery object for .token_padding element(s) specified by tokenization+tokenIndex
     *
     * @function external:"jQuery.fn".getTokenPaddingElementsWithIndex
     * @param {Tokenization} tokenization
     * @param {int} tokenIndex
     * @returns {external:jQuery_Object} - jQuery Object for .token_padding element(s) for tokenization+tokenIndex
     */
    $.fn.getTokenPaddingElementsWithIndex = function(tokenization, tokenIndex) {
        if (!tokenization) {
            return $();
        }

        return this.find('.token_padding_' + tokenization.uuid.uuidString + '_' + tokenIndex);
    };

    /**
     * @function external:"jQuery.fn".getTokenRefSequenceElements
     * @param {TokenRefSequence} tokenRefSequence
     * @returns {external:jQuery_Object}
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
     * @function external:"jQuery.fn".getTokenRefSequenceForTokensMatchingSelector
     * @param {String} selector - CSS selector string, e.g. '.selected_token'
     * @returns {TokenRefSequence}
     */
    $.fn.getTokenRefSequenceForTokensMatchingSelector = function(selector) {
        return concrete.widget.getTokenRefSequenceForTokensMatchingSelector(this, selector);
    };

    /**
     * Returns the jQuery.Callbacks object for "token select" callback
     * functions.  If the jQuery.Callbacks object does not already exist,
     * it will be created.  For details about jQuery.Callbacks, see:
     *
     *   http://api.jquery.com/category/callbacks-object/
     *
     * The "token select" callback functions will not be called unless
     * the user has also called enableTokenSelectCallbacks().  Once
     * enableTokenSelectCallbacks() has been called, when the user
     * selects a set of displayed tokens, all registered "token
     * select" callback functions will be called and passed a
     * list of TokenRefSequences containing the selected tokens.
     *
     * @function external:"jQuery.fn".getTokenSelectCallbacks
     * @returns {jQuery.Callbacks}
     */
    $.fn.getTokenSelectCallbacks = function() {
        if (!this.data('tokenSelectCallbacks')) {
            this.data('tokenSelectCallbacks', jQuery.Callbacks());
        }
        return this.data('tokenSelectCallbacks');
    };

    /**
     * @function external:"jQuery.fn".sectionWidget
     * @param {Section} section
     * @param {Object} options
     * @returns {external:jQuery_Object}
     */
    $.fn.sectionWidget = function(section, options) {
        this.append(concrete.widget.createSectionDiv(section, options));
        return this;
    };

    /**
     * @function external:"jQuery.fn".sentenceWidget
     * @param {Sentence} sentence
     * @param {Object} options
     * @returns {external:jQuery_Object}
     */
    $.fn.sentenceWidget = function(sentence, options) {
        this.append(concrete.widget.createSentenceDiv(sentence, options));
        return this;
    };

    /**
     * @function external:"jQuery.fn".tokenizationWidget
     * @param {Tokenization} tokenization
     * @param {Object} options
     * @returns {external:jQuery_Object}
     */
    $.fn.tokenizationWidget = function(tokenization, options) {
        this.append(concrete.widget.createTokenizationDiv(tokenization, options));
        return this;
    };

})(jQuery);
