/**
 * @module @hltcoe/concrete
 */

let concrete = module.exports = {};

// Add Concrete types and services
// Add to separate "modules" first, for backward compatibility, then merge into top level exports
concrete.access = require('./access_types');
/**
 * @const FetchCommunicationService
 * @property {Class} Client
 * @property {Class} Processor
 * @static
 */
concrete.access.FetchCommunicationService = require('./FetchCommunicationService');
/**
 * @const StoreCommunicationService
 * @property {Class} Client
 * @property {Class} Processor
 * @static
 */
concrete.access.StoreCommunicationService = require('./StoreCommunicationService');
concrete = Object.assign(concrete, concrete.access);

concrete.annotate = require('./annotate_types');
/**
 * @const AnnotateCommunicationService
 * @property {Class} Client
 * @property {Class} Processor
 * @static
 */
concrete.annotate.AnnotateCommunicationService = require('./AnnotateCommunicationService');
/**
 * @const AnnotateCommunicationBatchService
 * @property {Class} Client
 * @property {Class} Processor
 * @static
 */
concrete.annotate.AnnotateCommunicationBatchService = require('./AnnotateCommunicationBatchService');
/**
 * @const AnnotateWithContextService
 * @property {Class} Client
 * @property {Class} Processor
 * @static
 */
concrete.annotate.AnnotateWithContextService = require('./AnnotateWithContextService');
concrete = Object.assign(concrete, concrete.annotate);

concrete.audio = require('./audio_types');
concrete = Object.assign(concrete, concrete.audio);

concrete.cluster = require('./cluster_types');
concrete = Object.assign(concrete, concrete.cluster);

concrete.communication = require('./communication_types');
concrete = Object.assign(concrete, concrete.communication);

concrete.context = require('./context_types');
concrete = Object.assign(concrete, concrete.context);

concrete.convert = require('./convert_types');
/**
 * @const ConvertCommunicationService
 * @property {Class} Client
 * @property {Class} Processor
 * @static
 */
concrete.convert.ConvertCommunicationService = require('./ConvertCommunicationService');
concrete = Object.assign(concrete, concrete.convert);

concrete.email = require('./email_types');
concrete = Object.assign(concrete, concrete.email);

concrete.entities = require('./entities_types');
concrete = Object.assign(concrete, concrete.entities);

concrete.ex = require('./ex_types');
concrete = Object.assign(concrete, concrete.ex);

concrete.language = require('./language_types');
concrete = Object.assign(concrete, concrete.language);

concrete.learn = require('./learn_types');
/**
 * @const ActiveLearnerClientService
 * @property {Class} Client
 * @property {Class} Processor
 * @static
 */
concrete.learn.ActiveLearnerClientService = require('./ActiveLearnerClientService');
/**
 * @const ActiveLearnerServerService
 * @property {Class} Client
 * @property {Class} Processor
 * @static
 */
concrete.learn.ActiveLearnerServerService = require('./ActiveLearnerServerService');
concrete = Object.assign(concrete, concrete.learn);

concrete.linking = require('./linking_types');
concrete = Object.assign(concrete, concrete.linking);

concrete.metadata = require('./metadata_types');
concrete = Object.assign(concrete, concrete.metadata);

concrete.nitf = require('./nitf_types');
concrete = Object.assign(concrete, concrete.nitf);

concrete.property = require('./property_types');
concrete = Object.assign(concrete, concrete.property);

concrete.results = require('./results_types');
/**
 * @const ResultsServerService
 * @property {Class} Client
 * @property {Class} Processor
 * @static
 */
concrete.results.ResultsServerService = require('./ResultsServerService');
concrete = Object.assign(concrete, concrete.results);

concrete.search = require('./search_types');
/**
 * @const FeedbackService
 * @property {Class} Client
 * @property {Class} Processor
 * @static
 */
concrete.search.FeedbackService = require('./FeedbackService');
/**
 * @const SearchProxyService
 * @property {Class} Client
 * @property {Class} Processor
 * @static
 */
concrete.search.SearchProxyService = require('./SearchProxyService');
/**
 * @const SearchService
 * @property {Class} Client
 * @property {Class} Processor
 * @static
 */
concrete.search.SearchService = require('./SearchService');
concrete = Object.assign(concrete, concrete.search);

concrete.services = require('./services_types');
concrete.services.Service = require('./Service');
concrete = Object.assign(concrete, concrete.services);

concrete.situations = require('./situations_types');
concrete = Object.assign(concrete, concrete.situations);

concrete.spans = require('./spans_types');
concrete = Object.assign(concrete, concrete.spans);

concrete.structure = require('./structure_types');
concrete = Object.assign(concrete, concrete.structure);

concrete.summarization = require('./summarization_types');
/**
 * @const SummarizationService
 * @property {Class} Client
 * @property {Class} Processor
 * @static
 */
concrete.summarization.SummarizationService = require('./SummarizationService');
concrete = Object.assign(concrete, concrete.summarization);

concrete.twitter = require('./twitter_types');
concrete = Object.assign(concrete, concrete.twitter);

concrete.uuid = require('./uuid_types');
concrete = Object.assign(concrete, concrete.uuid);

// Add extensions
require('./communication_fu');
require('./structure_fu');

// Add utilities to "module" for backward compatibility
concrete.util = require('./util');
