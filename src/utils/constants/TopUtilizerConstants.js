import { PROPERTY_TYPES } from './DataModelConstants';

export const TOP_UTILIZERS_FILTER = {
  ASSOC_ID: 'assocId',
  ASSOC_TITLE: 'assocTitle',
  NEIGHBOR_ID: 'neighborId',
  NEIGHBOR_TITLE: 'neighborTitle',
  IS_SRC: 'src',
  VALUE: 'value',
  LABEL: 'label',
  WEIGHT: 'weight'
};

export const RESULT_DISPLAYS = {
  SEARCH_RESULTS: 'Search Results',
  DASHBOARD: 'Dashboard',
  RESOURCES: 'Resources',
  MAP: 'Map'
};

/* eslint-disable max-len */
export const CHART_EXPLANATIONS = {
  EVENTS_PER_PERSON: 'The distribution of top utilizer usage in each circumstance. The number of times someone has appeared in an event is on the x-axis, and the number of people with such history is on the y-axis.',
  PARETO: 'Starting with the highest utilizing individual on the bottom left, the line shows the cumulative % of events that a small # of individuals account for.',
  RESOURCE_TIMELINE: 'The unique events and resources spent on any one top utilizer over time.'
};
/* eslint-enable */

export const PARETO_LABELS = {
  UTILIZER_NUM: '#',
  COUNT: 'count',
  INDIVIDUAL_PERCENTAGE: 'Individual percentage',
  CUMULATIVE_PERCENTAGE: 'Cumulative percentage'
};

export const RESOURCE_TYPES = {
  EVENTS: 'EVENTS',
  DURATION: 'DURATION',
  COST: 'COST'
};

export const COUNT_TYPES = {
  EVENTS: 'EVENTS',
  DURATION: 'DURATION'
};

export const DEFAULT_COST_RATES = {
  [PROPERTY_TYPES.DURATION_DAYS]: 99.45,
  [PROPERTY_TYPES.TIME_SERVED_DAYS]: 99.45,
  [PROPERTY_TYPES.EMS_MINUTES_PER_PERSON]: 8.33,
  'psa.ftaScale': 15.2,
  'psa.ncaScale': 42
};
