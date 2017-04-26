// Define NER tagset as an array. Modify this variable to specify a different tagset. Default is ["PER", "ORG", "LOC"].
var tagSet = ["PERSON", "ORGANIZATION", "LOCATION"];

// Set of 5 colorblind-friendly colors for NER tag backgrounds.
// Recommended source for expanding palette: http://mkweb.bcgsc.ca/colorblind/
var colorSet = ["rgb(182, 219, 255)", "rgb(255,255,109)", "rgb(255,182,219)", "rgb(36,255,36)","rgb(182,109,255)"];

// creates dictionary of tag/color pairs

function zipTagColor(){
    var tagColorPairs = {};
    for (i=0; i < tagSet.length; i++){
        tagColorPairs[i] = colorSet[i];
    }
    // adds null/"O" tag and background color
    tagColorPairs[-1] = "transparent";
    return tagColorPairs;
}

var tagColorPairs = zipTagColor();

/** Check for NER tags in tokenTaggingList.
 * @param {Tokenization} tokenization
 * @returns {Integer} tokenTaggingIndex
 */
function checkForPreviousNERTags(tokenization) {
    var NERIndex = false;
    if (tokenization.tokenTaggingList && tokenization.tokenTaggingList.length > 0) {
        for (i=0; i < tokenization.tokenTaggingList.length; i++) {
            if (tokenization.tokenTaggingList[i].taggingType==='NER') {
                NERIndex = i;
                break;
            }
        }
    }
    return NERIndex;
}


/** Duplicate a TokenTagging object with the specified taggingType
 * @param {Tokenization} tokenization
 * @param {String} taggingType
 * @returns {TokenTagging}
 */
function duplicateTokenTagging(tokenization, tokenTaggingIndex, taggingType) {
    var tokenTagging = jQuery.extend(true, {}, tokenization.tokenTaggingList[tokenTaggingIndex]);
    tokenTagging.metadata.timestamp = Math.floor(Date.now()/1000);
    tokenTagging.metadata.tool = 'HIT';
    tokenTagging.taggingType = taggingType;
    tokenTagging.uuid = generateUUID();
    return tokenTagging;
}

/** Return the TaggedToken specified by tokenIndex if it exists - otherwise, create and return a new TaggedToken
 * @param {TokenTagging} tokenTagging
 * @param {Integer} tokenIndex
 * @returns {TaggedToken}
 */
function findOrCreateTaggedTokenWithIndex(tokenTagging, tokenIndex) {
    var taggedToken = getTaggedTokenWithIndex(tokenTagging, tokenIndex);
    if (taggedToken) {
        return taggedToken;
    }
    else {
        taggedToken = new TaggedToken();
        taggedToken.tokenIndex = tokenIndex;
        tokenTagging.taggedTokenList.push(taggedToken);
        return taggedToken;
    }
}

/**
 * Return the proper CSS class for a tokenTag based on its taggingType.
 * @param  {TokenTagging} tokenTagging
 * @param  {Integer} tokenIndex
 * @return {String} CSS class.
 */
function getCSSClassForTag(tokenTagging, tokenIndex) {
    if (getTaggedTokenWithIndex(tokenTagging, tokenIndex).tag.charAt(0) == "B") {
        return "token_tag_type_B";
    }
    else if (getTaggedTokenWithIndex(tokenTagging, tokenIndex).tag.charAt(0) == "I") {
        return "token_tag_type_I";
    }
    else {
        return "token_tag_type_O";
    }
}

/** Get the TaggedToken specified by tokenIndex if it exists, or return null
 * @param {TokenTagging} tokenTagging
 * @param {Integer} tokenIndex
 * @returns {TaggedToken|null}
 */
function getTaggedTokenWithIndex(tokenTagging, tokenIndex) {
    for (var taggedTokenIndex in tokenTagging.taggedTokenList) {
        if (tokenTagging.taggedTokenList[taggedTokenIndex].tokenIndex == tokenIndex) {
            return tokenTagging.taggedTokenList[taggedTokenIndex];
        }
    }
    return null;
}

/** Add a <div> to DOM containing a select box for changing the NE label for a token
 * @param {Integer} commIndex
 * @param {Tokenization} tokenization
 * @param {Integer} tokenIndex
 * @param {TokenTagging} tokenTagging}
 */
function addNEInputControl(commIndex, tokenization, tokenIndex, tokenTagging, tagSet) {
    tokenIndex = parseInt(tokenIndex);
    $('#comm_' + commIndex + '_token_' + tokenIndex + '_ne_input_container').append(
        createNEInputControlDiv(commIndex, tokenization, tokenIndex, tokenTagging, tagSet));
}

function createNEInputControlDiv(commIndex, tokenization, tokenIndex, tokenTagging, tagSet) {
    tokenIndex = parseInt(tokenIndex);
    var $selector =  $('<select id=comm_' + commIndex + '_token_' + tokenIndex + '_selector>');
    var div = $('<div>')
            .attr('id', 'comm_' + commIndex + '_token_' + tokenIndex + '_ne_input')
            .append(
                $('<span>')
                    .attr('id', 'comm_' + commIndex + '_token_' + tokenIndex + '_ne_input_text')
                    .text(getMultiTokenNEText(tokenization, tokenTagging, tokenIndex)))
            .append(
                $selector
                    .on('change',
                        {'commIndex': commIndex, 'tokenIndex': tokenIndex, 'tokenTagging': tokenTagging},
                        changeTokenTagCallback)
            );

    var selectOptions = [];
    for (var option in tagSet) {
        selectOptions.push("<option value='"+tagSet[option]+"'>"+tagSet[option]+"</option>");
    }
    $selector.append(selectOptions);
    // Returns tag text minus any BIO prefixes.
    var tokenTag = getTaggedTokenWithIndex(tokenTagging,tokenIndex).tag.split("-").pop();
    $selector.val(tokenTag);

    return div;
}


/** Get a string containing token text of all tokens in (possibly multi-word) NE identified by tokenIndex
 * @param {Tokenization} tokenization
 * @param {TokenTagging} tokenTagging
 * @param {Integer} tokenIndex
 */
function getMultiTokenNEText(tokenization, tokenTagging, tokenIndex) {
    var firstTokenIndex = getTokenIndexOfFirstTokenOfNE(tokenTagging, tokenIndex);
    var lastTokenIndex = tokenIndex;
    while (isTaggedTokenI(tokenTagging, lastTokenIndex+1)) {
        lastTokenIndex += 1;
    }

    var s = "";
    for (var i = firstTokenIndex; i < lastTokenIndex+1; i++) {
        s += tokenization.tokenList.tokenList[i].text + " ";
    }
    return s;
}

/** Get token index of first token of (possibly multi-word) NE identified by tokenIndex
 * @param {TokenTagging} tokenTagging
 * @param {Integer} tokenIndex
 * @returns {Integer}
 */
function getTokenIndexOfFirstTokenOfNE(tokenTagging, tokenIndex) {
    var firstTokenIndex = tokenIndex;
    while (isTaggedTokenI(tokenTagging, firstTokenIndex)) {
        firstTokenIndex -= 1;
    }
    return firstTokenIndex;
}

/** Check if token tag is a "B" tag
 * @param {TokenTagging} tokenTagging
 * @param {Integer} tokenIndex
 * @returns {Boolean}
 */
function isTaggedTokenB(tokenTagging, tokenIndex) {
    var taggedToken = getTaggedTokenWithIndex(tokenTagging, tokenIndex);
    if (taggedToken && taggedToken.tag) {
        if (taggedToken.tag.charAt(0) == "B") {
            return true;
        }
    }
    return false;
}

/** Check if token tag is an I" tag
 * @param {TokenTagging} tokenTagging
 * @param {Integer} tokenIndex
 * @returns {Boolean}
 */
function isTaggedTokenI(tokenTagging, tokenIndex) {
    var taggedToken = getTaggedTokenWithIndex(tokenTagging, tokenIndex);
    if (taggedToken && taggedToken.tag) {
        if (taggedToken.tag.charAt(0) == "I") {
            return true;
        }
    }
    return false;
}

/** Event handler that updates token tag when NE select box changes
 * @param {Event} event - An Event object with data fields commIndex, tokenIndex, tokenTagging
 */
function changeTokenTagCallback(event) {
    var taggedToken = findOrCreateTaggedTokenWithIndex(event.data.tokenTagging, event.data.tokenIndex);
    var updatedBTag = $(this).val();
    updateTokenTag(event.data.commIndex, event.data.tokenIndex, taggedToken, "B-" + updatedBTag);
    if (isTaggedTokenI(event.data.tokenTagging, event.data.tokenIndex+1)) {
        updateContiguousITagsStartingWithTokenIndex(event.data.commIndex, event.data.tokenTagging, event.data.tokenIndex+1, updatedBTag);
    }
}

/** Update token tag both in the Concrete datastructure and shown in UI
 * @param {Integer} commIndex
 * @param {Integer} tokenIndex
 * @param {TaggedToken} tokenTag
 * @param {String} tagText
 */
function updateTokenTag(commIndex, tokenIndex, taggedToken, tagText) {
    // Modify Concrete data structure
    taggedToken.tag = tagText;

    // Update the token tag that is displayed in parentheses after the token text
    // $('#comm_'+commIndex+'_token_'+tokenIndex + ' .tokenTag').text("(" + tagText + ")");

    // Change background color for token text based on tagText
    var tokenSpan = $('#comm_' + commIndex + '_token_' + tokenIndex);
    var foo = tagSet.indexOf(tagText.split("-").pop());
    tokenSpan.attr('data-tag-type-index', foo);
    tokenSpan.css("background-color", tagColorPairs[foo]);

    if (tagText.charAt(0) == "O") {
        tokenSpan.removeClass("token_tag_type_B");
        tokenSpan.removeClass("token_tag_type_I");
        tokenSpan.addClass("token_tag_type_O");
    }
    else if (tagText.charAt(0) == "B") {
        tokenSpan.removeClass("token_tag_type_I");
        tokenSpan.removeClass("token_tag_type_O");
        tokenSpan.addClass("token_tag_type_B");
    }
    else if (tagText.charAt(0) == "I") {
        tokenSpan.removeClass("token_tag_type_B");
        tokenSpan.removeClass("token_tag_type_O");
        tokenSpan.addClass("token_tag_type_I");
    }
}

/** Update 'I-' tags that immediately follow a 'B-' tag **/
function updateContiguousITagsStartingWithTokenIndex(commIndex, tokenTagging, tokenIndex, updatedBTag) {
    var updatingToken = getTaggedTokenWithIndex(tokenTagging, tokenIndex);
    if (isTaggedTokenI(tokenTagging, tokenIndex)) {
        updateTokenTag(commIndex, tokenIndex, updatingToken, "I-" + updatedBTag);
        updateContiguousITagsStartingWithTokenIndex(commIndex, tokenTagging,
                                                    tokenIndex+1,updatedBTag);
    }
}

/** Callback function for when a user clicks on the displayed token text
 * @param {Event} event - An Event object with data fields commIndex, tokenization, tokenIndex, tokenTagging
 */
function updateTagForNECallback(event) {
    /** Remove the <div> from DOM containing control for changing the NE label of the specified token
     * @param {Integer} commIndex
     * @param {Integer} tokenIndex
     */
    function removeNEInputControl(commIndex, tokenIndex) {
        $('#comm_' + commIndex + '_token_' + tokenIndex + '_ne_input').remove();
    }

    /** Check if token tag is a "B" or an "I" tag
     * @param {TokenTagging} tokenTagging
     * @param {Integer} tokenIndex
     * @returns {Boolean}
     */
    function isTaggedTokenBorI(tokenTagging, tokenIndex) {
        return isTaggedTokenB(tokenTagging, tokenIndex) || isTaggedTokenI(tokenTagging, tokenIndex);
    }

    /** Remove "I" tags that are part of the multi-token NE identified by tokenIndex
     * @param {Integer} commIndex
     * @param {TokenTagging} tokenTagging
     * @param {Integer} tokenIndex
     */
    function removeContiguousITagsStartingWithTokenIndex(commIndex, tokenTagging, tokenIndex) {
        if (isTaggedTokenI(tokenTagging, tokenIndex)) {
            var taggedToken = getTaggedTokenWithIndex(tokenTagging, tokenIndex);
            updateTokenTag(commIndex, tokenIndex, taggedToken, "O");
            removeContiguousITagsStartingWithTokenIndex(commIndex, tokenTagging, tokenIndex+1);
        }
    }

    /** Updates text for NE input control.  Displays text of all tokens for the specified NE.
     * @param {Integer} commIndex
     * @param {TokenTagging} tokenTagging
     * @param {Tokenization} tokenization
     * @param {Integer} tokenIndex
     */
    function updateNEInputControlText(commIndex, tokenTagging, tokenization, tokenIndex) {
        if (tokenIndex >= 0) {
            var firstTokenIndex = getTokenIndexOfFirstTokenOfNE(tokenTagging, tokenIndex);
            $("#comm_" + commIndex + "_token_" + firstTokenIndex + '_ne_input_text').text(
                getMultiTokenNEText(tokenization, tokenTagging, tokenIndex)
            );
        }
    }


    var commIndex = event.data.commIndex;
    var tokenization = event.data.tokenization;
    var tokenIndex = parseInt(event.data.tokenIndex);
    var tokenTagging = event.data.tokenTagging;
    var taggedToken = findOrCreateTaggedTokenWithIndex(tokenTagging, tokenIndex);

    // Check if previous token has a "B" or "I" token tag
    if (isTaggedTokenBorI(tokenTagging, tokenIndex-1)) {
        // When clicking on the current token, if the previous token has a
        // "B" or "I" tag, then the tag transition order is:
        //   "O" -> "I" -> "B" -> "O"
        if (!taggedToken.tag || taggedToken.tag == "O") {
            // Set Intermediate tag type based on tag type of previous tag
            var previousTokenTag = getTaggedTokenWithIndex(tokenTagging, tokenIndex-1).tag;
            updateTokenTag(commIndex, tokenIndex, taggedToken, "I-" + previousTokenTag.substring(2));
            updateNEInputControlText(commIndex, tokenTagging, tokenization, tokenIndex);
        }
        else if (taggedToken.tag.charAt(0) == "I") {
            // Default NE type is first in tagSet
            updateTokenTag(commIndex, tokenIndex, taggedToken, "B-"+tagSet[0]);
            addNEInputControl(commIndex, tokenization, tokenIndex, tokenTagging, tagSet);
            // Update text for select box for *previous* token
            updateNEInputControlText(commIndex, tokenTagging, tokenization, tokenIndex-1);
        }
        else if (taggedToken.tag.charAt(0) == "B") {
            updateTokenTag(commIndex, tokenIndex, taggedToken, "O");
            removeContiguousITagsStartingWithTokenIndex(commIndex, tokenTagging, tokenIndex+1);
            removeNEInputControl(commIndex, tokenIndex);
        }
    }
    else {
        // When clicking on the current token, if the previous token does
        // NOT have a "B" or "I" tag, then the tag transition order is:
        //   "O" -> "B" -> "O"
        if (isTaggedTokenBorI(tokenTagging, tokenIndex)) {
            updateTokenTag(commIndex, tokenIndex, taggedToken, "O");
            removeContiguousITagsStartingWithTokenIndex(commIndex, tokenTagging, tokenIndex+1);
            removeNEInputControl(commIndex, tokenIndex);
        }
        else {
            // Default NE type is first in tagSet
            updateTokenTag(commIndex, tokenIndex, taggedToken, "B-"+tagSet[0]);
            addNEInputControl(commIndex, tokenization, tokenIndex, tokenTagging, tagSet);
        }
    }
}
