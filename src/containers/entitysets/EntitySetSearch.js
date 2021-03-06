/*
 * @flow
 */

import React from 'react';

import styled from 'styled-components';
import { List, Map } from 'immutable';
import {
  AppContentWrapper,
  Card,
  Checkbox,
  SearchInput,
  Sizes,
  Spinner,
} from 'lattice-ui-kit';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { RequestStates } from 'redux-reqseq';
import type { Location } from 'react-router';
import type { RequestSequence, RequestState } from 'redux-reqseq';

import EntitySetCard from '../../components/cards/EntitySetCard';
import Pagination from '../../components/explore/Pagination';
import { ENTITY_SETS, STATE } from '../../utils/constants/StateConstants';
import * as EntitySetActions from './EntitySetActions';
import * as ReduxActions from '../../core/redux/ReduxActions';
import * as Routes from '../../core/router/Routes';
import * as RoutingActions from '../../core/router/RoutingActions';
import type { GoToRoute } from '../../core/router/RoutingActions';

const { APP_CONTENT_WIDTH } = Sizes;
const { SEARCH_ENTITY_SETS } = EntitySetActions;

const SearchSection = styled.section`
  align-items: center;
  align-self: center;
  display: flex;
  flex-direction: column;
  padding: 30px 0;
  width: 600px;

  > h1 {
    font-size: 28px;
    font-weight: normal;
    margin: 0;
  }

  > div {
    margin-top: 50px;
    width: 100%;
  }
`;

const CheckboxRow = styled.div`
  align-self: flex-end;
  display: flex;
  margin-bottom: 30px;

  > label:last-child {
    margin-left: 10px;
  }
`;

const EntitySetCardGrid = styled.div`
  display: grid;
  grid-gap: 30px;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));

  ${Card} {
    min-width: 0; /* setting min-width ensures cards do not overflow the grid column */
  }
`;

const PAGE_SIZE = 24;

type Props = {
  actions :{
    goToRoute :GoToRoute;
    resetRequestState :(actionType :string) => void;
    searchEntitySets :RequestSequence;
    selectEntitySet :RequestSequence;
    selectEntitySetPage :RequestSequence;
    setShowAssociationEntitySets :RequestSequence;
    setShowAuditEntitySets :RequestSequence;
  };
  entitySetSearchResults :List<*>;
  location :Location;
  page :number;
  requestStates :{
    SEARCH_ENTITY_SETS :RequestState;
  };
  showAssociationEntitySets :boolean;
  showAuditEntitySets :boolean;
  totalHits :number;
};

type State = {
  valueOfSearchQuery :string;
};

class EntitySetSearch extends React.Component<Props, State> {

  constructor(props :Props) {
    super(props);
    this.state = {
      valueOfSearchQuery: '',
    };
  }

  componentDidMount() {

    const { actions } = this.props;
    actions.searchEntitySets({
      searchTerm: '*',
      start: 0,
      maxHits: 10000
    });
  }

  handleOnChangeSearch = (event :SyntheticInputEvent<HTMLInputElement>) => {

    const valueOfSearchQuery = event.target.value || '';
    this.setState({ valueOfSearchQuery });
  }

  handleOnKeyPressSearch = (event :SyntheticKeyboardEvent<HTMLInputElement>) => {

    const { key } = event;
    if (key === 'Enter') {
      this.search();
    }
  }

  search = () => {

    const { actions } = this.props;
    const { valueOfSearchQuery } = this.state;

    // TODO: refactor maxHits
    actions.searchEntitySets({
      searchTerm: valueOfSearchQuery,
      start: 0,
      maxHits: 10000
    });
    actions.selectEntitySetPage(1);
  }

  goToEntitySet = (entitySetId :UUID) => {

    const { actions, location } = this.props;

    if (location.pathname.startsWith(Routes.EXPLORE)) {
      actions.goToRoute(Routes.EXPLORE_ES.replace(Routes.ID_PARAM, entitySetId));
    }
    else if (location.pathname.startsWith(Routes.TOP_UTILIZERS)) {
      actions.goToRoute(Routes.TOP_UTILIZERS_ES.replace(Routes.ID_PARAM, entitySetId));
    }
  }

  renderSearchResults = () => {

    const {
      actions,
      entitySetSearchResults,
      page,
      requestStates,
      showAssociationEntitySets,
      showAuditEntitySets,
      totalHits,
    } = this.props;

    if (requestStates[SEARCH_ENTITY_SETS] === RequestStates.PENDING) {
      return (
        <Spinner size="2x" />
      );
    }

    if (requestStates[SEARCH_ENTITY_SETS] === RequestStates.FAILURE) {
      return (
        <p>
          Sorry, something went wrong. Please try refreshing the page, or contact support.
        </p>
      );
    }

    if (entitySetSearchResults.isEmpty()) {
      return (
        <p>
          No matching entity sets found.
        </p>
      );
    }

    const entitySetCards = entitySetSearchResults.map((searchResult :Map) => {

      const entitySet :Map = searchResult.get('entitySet', Map());
      const entitySetId :UUID = entitySet.get('id');

      return (
        <EntitySetCard
            key={entitySetId}
            entitySet={entitySet}
            onClick={() => this.goToEntitySet(entitySetId)} />
      );
    });

    return (
      <>
        <CheckboxRow>
          <Checkbox
              checked={showAssociationEntitySets}
              onChange={({ target }) => actions.setShowAssociationEntitySets(!!target.checked)}
              label="Show association datasets" />
          <Checkbox
              checked={showAuditEntitySets}
              onChange={({ target }) => actions.setShowAuditEntitySets(!!target.checked)}
              label="Show audit datasets" />
        </CheckboxRow>
        <EntitySetCardGrid>
          {entitySetCards}
        </EntitySetCardGrid>
        {
          totalHits > PAGE_SIZE && (
            <Pagination
                numPages={Math.ceil(totalHits / PAGE_SIZE)}
                activePage={page}
                onChangePage={actions.selectEntitySetPage} />
          )
        }
      </>
    );
  }

  render() {

    const { valueOfSearchQuery } = this.state;

    return (
      <>
        <AppContentWrapper bgColor="#fff">
          <SearchSection>
            <h1>Select a dataset to search</h1>
            <SearchInput
                onChange={this.handleOnChangeSearch}
                onKeyPress={this.handleOnKeyPressSearch}
                placeholder="Search"
                value={valueOfSearchQuery} />
          </SearchSection>
        </AppContentWrapper>
        <AppContentWrapper contentWidth={APP_CONTENT_WIDTH}>
          {this.renderSearchResults()}
        </AppContentWrapper>
      </>
    );
  }
}

function mapStateToProps(state :Map<*, *>) :Object {

  const entitySets = state.get(STATE.ENTITY_SETS);
  const showAssociationEntitySets = entitySets.get(ENTITY_SETS.SHOW_ASSOCIATION_ENTITY_SETS);
  const showAuditEntitySets = entitySets.get(ENTITY_SETS.SHOW_AUDIT_ENTITY_SETS);
  const page = entitySets.get(ENTITY_SETS.PAGE);

  let entitySetSearchResults = entitySets.get(ENTITY_SETS.ENTITY_SET_SEARCH_RESULTS);
  if (!showAssociationEntitySets || !showAuditEntitySets) {
    entitySetSearchResults = entitySetSearchResults.filter((entitySetObj) => {
      const flags = entitySetObj.getIn(['entitySet', 'flags'], List());
      if (!showAssociationEntitySets && flags.includes('ASSOCIATION')) {
        return false;
      }
      if (!showAuditEntitySets && flags.includes('AUDIT')) {
        return false;
      }
      return true;
    });
  }
  const totalHits = entitySetSearchResults.count();
  entitySetSearchResults = entitySetSearchResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return {
    page,
    entitySetSearchResults,
    showAssociationEntitySets,
    showAuditEntitySets,
    totalHits,
    requestStates: {
      [SEARCH_ENTITY_SETS]: state.getIn([STATE.ENTITY_SETS, SEARCH_ENTITY_SETS, 'requestState']),
    },
  };
}

const mapActionsToProps = (dispatch :Function) => ({
  actions: bindActionCreators({
    goToRoute: RoutingActions.goToRoute,
    resetRequestState: ReduxActions.resetRequestState,
    searchEntitySets: EntitySetActions.searchEntitySets,
    selectEntitySet: EntitySetActions.selectEntitySet,
    selectEntitySetPage: EntitySetActions.selectEntitySetPage,
    setShowAssociationEntitySets: EntitySetActions.setShowAssociationEntitySets,
    setShowAuditEntitySets: EntitySetActions.setShowAuditEntitySets,
  }, dispatch)
});

export default withRouter(
  connect(mapStateToProps, mapActionsToProps)(EntitySetSearch)
);
