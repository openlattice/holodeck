/*
 * @flow
 */

import { put, takeEvery } from '@redux-saga/core/effects';
import { push } from 'connected-react-router';

import Logger from '../../utils/Logger';
import {
  GO_TO_ROOT,
  GO_TO_ROUTE,
  routingFailure,
} from './RoutingActions';

import type { RoutingAction } from './RoutingActions';

const LOG :Logger = new Logger('RoutingSagas');

const ERR_INVALID_ROUTE :string = 'invalid route: a route must be a non-empty string that starts with "/"';

/*
 *
 * RoutingActions.goToRoute()
 *
 */

function* goToRouteWorker(action :RoutingAction) :Generator<*, *, *> {

  const { route, state = {} } = action;
  if (route === null || route === undefined || !route.startsWith('/', 0)) {
    LOG.error(ERR_INVALID_ROUTE, route);
    yield put(routingFailure(ERR_INVALID_ROUTE, route));
    return;
  }

  yield put(push({ state, pathname: route }));
}

function* goToRouteWatcher() :Generator<*, *, *> {

  yield takeEvery(GO_TO_ROUTE, goToRouteWorker);
}

/*
 *
 * RoutingActions.goToRoot()
 *
 */

function* goToRootWatcher() :Generator<*, *, *> {

  yield takeEvery(GO_TO_ROOT, goToRouteWorker);
}

export {
  goToRootWatcher,
  goToRouteWatcher,
  goToRouteWorker,
};
