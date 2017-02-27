/**
 * Creates a Tokenization for a manualTokenizationWidget
 *
 * The {@link external:"jQuery.fn".manualTokenizationWidget jQuery.fn.manualTokenizationWidget}
 * function creates a UI widget that allows a user to specify
 * token boundaries between characters.  This function creates
 * a Tokenization object based on the token boundaries currently
 * shown in the UI.
 *
 * This function should be called on the same jQuery element
 * that {@link external:"jQuery.fn".manualTokenizationWidget jQuery.fn.manualTokenizationWidget}
 * was called on.
 *
 * @returns {Tokenization}
 *
 * @function external:"jQuery.fn".getManualTokenization
 */
$.fn.getManualTokenization = function() {
  var tokenizeSentenceDiv;
  if (this.hasClass('manual_tokenization')) {
    tokenizeSentenceDiv = this;
  }
  else {
    tokenizeSentenceDiv = this.find('.manual_tokenization').first();
  }
  var sentence = tokenizeSentenceDiv.data('sentence');

  var joinedTokenIndices = [];
  tokenizeSentenceDiv.find('.concrete_character_gap.connected_concrete_characters').each(function() {
    joinedTokenIndices.push($(this).data('tokenIndex'));
  });

  var tokenization = new Tokenization();
  tokenization.kind = TokenizationKind.TOKEN_LIST;
  tokenization.metadata = new AnnotationMetadata();
  tokenization.metadata.timestamp = Math.floor(Date.now()/1000);
  tokenization.metadata.tool = 'concrete.js - getManualTokenization()';
  tokenization.tokenList = new TokenList();
  tokenization.tokenList.tokenList = [];
  tokenization.uuid = concrete.util.generateUUID();

  for (var i = sentence.textSpan.start; i < sentence.textSpan.ending-1; i++) {
    var textSpan = new TextSpan();
    textSpan.start = i;
    while (joinedTokenIndices.includes(i)) {
      i += 1;
    }
    textSpan.ending = i+1;
    var token = new Token();
    token.text = sentence.section.comm.text.substring(textSpan.start, textSpan.ending);
    token.textSpan = textSpan;
    token.tokenIndex = tokenization.tokenList.tokenList.length;

    // Don't create Tokens if the text field contains only whitespace
    if (token.text.trim().length !== 0) {
      tokenization.tokenList.tokenList.push(token);
    }
  }

  return tokenization;
};


/**
 * UI widget for manual tokenization of a Concrete Sentence
 *
 * Takes a Sentence, creates DOM structure for characters in
 * Sentence, attaches event handlers for keyboard input and
 * navigation.  When the widget is first created, each character
 * is treated as a separate token.  The 'x' key can be used
 * to connect/disconnect characters, and the arrow keys used
 * to navigate between characters.
 *
 * Use {@link external:"jQuery.fn".getManualTokenization jQuery.fn.getManualTokenization}
 * to get a Tokenization object reflecting the current token
 * boundaries shown in the UI.
 *
 * This function attaches a div to the jQuery element with
 * the structure:
 *
 * ```
 * <div class="manual_tokenization">
 *   <span class="concrete_character">A</span>
 *   <span class="concrete_character_gap">&nbsp; </span>
 *   <span class="concrete_character">B</span>
 *   <span class="concrete_character_gap">&nbsp; </span>
 *   <span class="concrete_character">C</span>
 *   <span class="concrete_character_gap">&nbsp; </span>
 *   ...
 *   <span class="concrete_character">Z</span>
 * </div>
 * ```
 *
 * When the user uses the UI to "connect" two characters into
 * a single token, the .concrete_connected_character_class will
 * be added to the .concrete_character spans for the two
 * characters and the .concrete_character_gap span between the
 * character spans.
 *
 * Using the DOM structure shown above, if the character spans
 * for 'A' and 'B' were connected, the new DOM structure would be:
 *
 * ```
 * <div class="manual_tokenization">
 *   <span class="concrete_character connected_concrete_characters">A</span>
 *   <span class="concrete_character_gap connected_concrete_characters">&nbsp; </span>
 *   <span class="concrete_character connected_concrete_characters">B</span>
 *   <span class="concrete_character_gap">&nbsp; </span>
 *   <span class="concrete_character">C</span>
 *   <span class="concrete_character_gap">&nbsp; </span>
 *   ...
 *   <span class="concrete_character">Z</span>
 * </div>
 * ```
 *
 * This function does not set any CSS properties on the elements
 * it creates.  Here is some suggested CSS styling:
 *
 * ```
 *   .concrete_character {
 *     display: inline-block;
 *     border-bottom: 10px solid #F4F4F4;
 *   }
 *   .concrete_character_gap {
 *     cursor: pointer;
 *     display: inline-block;
 *     min-width: 1em;
 *   }
 *   .connected_concrete_characters {
 *     background-color: yellow;
 *     border-bottom: 10px solid #CCCCCC;
 *   }
 * ```
 *
 * Parameters for `options` object:
 * - `toggleConnectionKey` (String): Key used to toggle
 *   the connection between characters.  The string should
 *   be a
 *   {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
 *    valid KeyboardEvent.key value}.
 *   Please note that Safari/WebKit does not currently
 *   support the KeyboardEvent.key field, so you need
 *   to set the `toggleConnectionKeyCode` option for
 *   these browsers.
 *   Default value: 'x'
 * - `toggleConnectionKeyCode` (Number): KeyCode used to
 *   toggle the connection between characters.  Please
 *   note that KeyCode values are system and implementation
 *   dependent.
 *   Default value: 88 (KeyCode for 'x')
 *
 * @param {Sentence} sentence
 * @param {Object} options
 * @returns {external:jQuery_Object} - this jQuery object
 *
 * @function external:"jQuery.fn".manualTokenizationWidget
 */
$.fn.manualTokenizationWidget = function(sentence, options) {

  // onkeydown event handler for navigating manualTokenizationWidget
  //
  // 'x' key connects/disconnects characters, arrow keys used for
  // navigation.
  //
  // Tab and shift-tab can also be used to navigate, but tab
  // navigation is handled by the browser (using 'tabindex'
  // attributes) instead of this function.
  function manualTokenizationKeyboardNavigation(event) {
    var el = $(this);
    if (el.hasClass('concrete_character_gap')) {
      var characterGapEls;
      var characterGapIndex;

      if (event.key === opts.toggleConnectionKey || event.keyCode === opts.toggleConnectionKeyCode) {
        toggleConnectedCharacters(el);
      }
      else if (event.key === 'ArrowLeft' || event.keyCode === 37) {
        if (el.prev().prev('.concrete_character_gap').length !== 0) {
          // Move cursor to left
          el.prev().prev('.concrete_character_gap').focus();
        }
        else {
          characterGapEls = $('.concrete_character_gap');
          characterGapIndex = characterGapEls.index(el);
          if (characterGapIndex === 0) {
            // Wraparound
            characterGapEls.last().focus();
          }
          else {
            characterGapEls.eq(characterGapIndex-1).focus();
          }
        }
      }
      else if (event.key === 'ArrowRight' || event.keyCode === 39) {
        if (el.next().next('.concrete_character_gap').length !== 0) {
          // Move cursor to right
          el.next().next('.concrete_character_gap').focus();
        }
        else {
          characterGapEls = $('.concrete_character_gap');
          characterGapIndex = characterGapEls.index(el);
          if (characterGapIndex >= characterGapEls.length-1) {
            // Wraparound
            characterGapEls.first().focus();
          }
          else {
            characterGapEls.eq(characterGapIndex+1).focus();
          }
        }
      }
      else if (event.key === 'ArrowUp' || event.keyCode === 38) {
        characterGapEls = $('.concrete_character_gap');
        characterGapIndex = characterGapEls.index(el);
        if (characterGapIndex === 0 ||
            characterGapEls.index(el.siblings('.concrete_character_gap').first()) === 0)
        {
          // Wraparound
          characterGapEls.eq(characterGapEls.length-1).siblings('.concrete_character_gap').first().focus();
        }
        else {
          var firstInSentenceIndex = characterGapEls.index(el.siblings('.concrete_character_gap').first());
          if (characterGapEls.index(el) < firstInSentenceIndex) {
            // All siblings are to right of current element
            characterGapEls.eq(characterGapEls.index(el)-1).siblings('.concrete_character_gap').first().focus();
          }
          else {
            characterGapEls.eq(firstInSentenceIndex-1).siblings('.concrete_character_gap').first().focus();
          }
        }
      }
      else if (event.key === 'ArrowDown' || event.keyCode === 40) {
        characterGapEls = $('.concrete_character_gap');
        var lastInSentence = el.siblings('.concrete_character_gap').last();
        var lastInSentenceIndex = characterGapEls.index(lastInSentence);
        if (lastInSentenceIndex === characterGapEls.length-1) {
          // Wraparound
          characterGapEls.first().focus();
        }
        else {
          if (characterGapEls.index(el) > lastInSentenceIndex) {
            // All siblings are to left of current element
            characterGapEls.eq(characterGapEls.index(el)+1).focus();
          }
          else {
            characterGapEls.eq(lastInSentenceIndex+1).focus();
          }
        }
      }
    }
  }

  /**
   * mousedown event handler.  Toggles connected characters IFF
   * the element already has the focus.
   */
  function mouseToggleConnectedCharacters() {
    var el = $(this);
    if (el.hasClass('concrete_character_gap')) {
      if (el.is(':focus')) {
        toggleConnectedCharacters(el);
      }
    }
  }

  function toggleConnectedCharacters(el) {
    var prevEl = el.prev();
    var nextEl = el.next();

    if (el.hasClass('connected_concrete_characters')) {
      el.removeClass('connected_concrete_characters');
      if (!el.prev().prev('.concrete_character_gap').hasClass('connected_concrete_characters')) {
        prevEl.removeClass('connected_concrete_characters');
      }
      if (!el.next().next('.concrete_character_gap').hasClass('connected_concrete_characters')) {
        nextEl.removeClass('connected_concrete_characters');
      }
    }
    else {
      el.addClass('connected_concrete_characters');
      prevEl.addClass('connected_concrete_characters');
      nextEl.addClass('connected_concrete_characters');
    }
  }


  var opts = $.extend({}, $.fn.manualTokenizationWidget.defaultOptions, options);

  // We do not want any of the .concrete_character_gap spans to have a tabindex of 0, as
  // a tabindex of 0 is treated differently than a tabindex of 1 or greater:
  //   https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex
  // We use a positive offset, so that the character in the Communication with
  // character index 0 is not assigned a tabindex of 0.
  var TOKENIZE_TABINDEX_OFFSET = 10;

  var tokenizeSentenceDiv = $('<div>').addClass('manual_tokenization')
                                      .data('sentence', sentence);

  var hasTokenization = !!sentence.tokenization;
  var tokenConnectedCharacters = [];

  if (hasTokenization) {
    for (var j = 0; j < sentence.tokenization.tokenList.tokenList.length; j++) {
      var tokenTextSpan = sentence.tokenization.tokenList.tokenList[j].textSpan;
      if (tokenTextSpan.ending - tokenTextSpan.start > 1) {
        for (var k = tokenTextSpan.start; k < tokenTextSpan.ending-1; k++) {
          tokenConnectedCharacters.push(k);
        }
      }
    }
  }

  for (var i = sentence.textSpan.start; i < sentence.textSpan.ending; i++) {
    var characterSpan = $('<span>').addClass('concrete_character')
                                   .text(sentence.section.comm.text.substring(i, i+1));
    if (hasTokenization) {
      if (tokenConnectedCharacters.includes(i-1) || tokenConnectedCharacters.includes(i)) {
        characterSpan.addClass('connected_concrete_characters');
      }
    }

    tokenizeSentenceDiv.append(characterSpan);
    if (i < sentence.textSpan.ending-1) {
      var characterGapSpan = $('<span>').addClass('concrete_character_gap')
                                        .attr('tabindex', TOKENIZE_TABINDEX_OFFSET + i)
                                        .data('tokenIndex', i)
                                        .html('&nbsp; ')
                                        .keydown(manualTokenizationKeyboardNavigation)
                                        .mousedown(mouseToggleConnectedCharacters);
      if (hasTokenization && tokenConnectedCharacters.includes(i)) {
        characterGapSpan.addClass('connected_concrete_characters');
      }

      tokenizeSentenceDiv.append(characterGapSpan);
    }
  }
  this.append(tokenizeSentenceDiv);

  return this;
};

$.fn.manualTokenizationWidget.defaultOptions = {
  'toggleConnectionKey': 'x',
  'toggleConnectionKeyCode': 88,
};
