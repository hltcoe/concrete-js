const concrete = module.exports = {};

// Add Concrete types and services
concrete.access = require('./access_types');
concrete.access.FetchCommunicationService = require('./FetchCommunicationService');
concrete.access.StoreCommunicationService = require('./StoreCommunicationService');
concrete.annotate = require('./annotate_types');
concrete.annotate.AnnotateCommunicationService = require('./AnnotateCommunicationService');
concrete.annotate.AnnotateCommunicationBatchService = require('./AnnotateCommunicationBatchService');
concrete.annotate.AnnotateWithContextService = require('./AnnotateWithContextService');
concrete.audio = require('./audio_types');
concrete.cluster = require('./cluster_types');
concrete.communication = require('./communication_types');
concrete.context = require('./context_types');
concrete.convert = require('./convert_types');
concrete.convert.ConvertCommunicationService = require('./ConvertCommunicationService');
concrete.email = require('./email_types');
concrete.entities = require('./entities_types');
concrete.ex = require('./ex_types');
concrete.language = require('./language_types');
concrete.learn = require('./learn_types');
concrete.learn.ActiveLearnerClientService = require('./ActiveLearnerClientService');
concrete.learn.ActiveLearnerServerService = require('./ActiveLearnerServerService');
concrete.linking = require('./linking_types');
concrete.metadata = require('./metadata_types');
concrete.nitf = require('./nitf_types');
concrete.property = require('./property_types');
concrete.results = require('./results_types');
concrete.results.ResultsServerService = require('./ResultsServerService');
concrete.search = require('./search_types');
concrete.search.FeedbackService = require('./FeedbackService');
concrete.search.SearchProxyService = require('./SearchProxyService');
concrete.search.SearchService = require('./SearchService');
concrete.services = require('./services_types');
concrete.services.Service = require('./Service');
concrete.situations = require('./situations_types');
concrete.spans = require('./spans_types');
concrete.structure = require('./structure_types');
concrete.summarization = require('./summarization_types');
concrete.summarization.SummarizationService = require('./SummarizationService');
concrete.twitter = require('./twitter_types');
concrete.uuid = require('./uuid_types');

// Add extensions
require('./communication_fu');
require('./structure_fu');

// Add utilities
concrete.util = require('./util');
