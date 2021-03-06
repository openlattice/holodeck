import { RESOURCE_TYPES } from './TopUtilizerConstants';

export const BLUE = {
  BLUE_1: '#c3ceff',
  BLUE_2: '#0021ba'
};

export const DEFAULT_COLORS = [
  {
    PRIMARY: '#0021ba',
    SECONDARY: '#c3ceff'
  },
  {
    PRIMARY: '#d15200',
    SECONDARY: '#ffd5b9'
  },
  {
    PRIMARY: '#bc0000',
    SECONDARY: '#ffd8d8'
  },
  {
    PRIMARY: '#008f63',
    SECONDARY: '#bdedde'
  },
  {
    PRIMARY: '#555e6f',
    SECONDARY: '#dcdce7'
  },
  {
    PRIMARY: '#6124e2',
    SECONDARY: '#e3d6ff'
  }
];

export const CHART_COLORS = [
  '#6124e2',
  '#00be84',
  '#bc0000',
  '#0021ba',
  '#ff9a58',
  '#f25497'
];

export const RESOURCE_COLORS = {
  [RESOURCE_TYPES.EVENTS]: ['#ffc59e', '#ff9a58'],
  [RESOURCE_TYPES.DURATION]: ['#a57cff', '#6124e2'],
  [RESOURCE_TYPES.COST]: ['#75d6b7', '#00be84']
};

export const MAP_COLORS = [
  '#f4d681', // yellow
  '#da3bca', // pink
  '#5d9df8' // blue
];
