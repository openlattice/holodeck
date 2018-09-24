/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import { List, Map, fromJS } from 'immutable';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import PersonResultCard from '../../components/people/PersonResultCard';
import ButtonToolbar from '../../components/buttons/ButtonToolbar';
import InfoButton from '../../components/buttons/InfoButton';
import DataTable from '../../components/data/DataTable';
import EntityDetails from '../data/EntityDetails';
import { COUNT_FQN } from '../../utils/constants/DataConstants';
import { PERSON_ENTITY_TYPE_FQN, IMAGE_PROPERTY_TYPES } from '../../utils/constants/DataModelConstants';
import { TOP_UTILIZERS_FILTER } from '../../utils/constants/TopUtilizerConstants';
import {
  STATE,
  EDM,
  ENTITY_SETS,
  EXPLORE,
  TOP_UTILIZERS
} from '../../utils/constants/StateConstants';
import { CenteredColumnContainer, FixedWidthWrapper, TableWrapper } from '../../components/layout/Layout';
import { getEntityKeyId, getFqnString, isPersonType } from '../../utils/DataUtils';
import * as ExploreActionFactory from './ExploreActionFactory';

type Props = {
  results :List<*>,
  filteredPropertyTypes? :Set<string>,
  isTopUtilizers :boolean,

  countBreakdown :Map<*, *>,
  selectedEntitySet :Map<*, *>,
  breadcrumbs :List<string>,
  neighborsById :Map<string, *>,
  entityTypesById :Map<string, *>,
  entitySetsById :Map<string, *>,
  propertyTypesById :Map<string, *>,
  actions :{
    selectEntity :(entityKeyId :string) => void,
    loadEntityNeighbors :({ entitySetId :string, entity :Map<*, *> }) => void
  }
}

type State = {
  layout :string,
  showCountDetails :boolean
}


const ToolbarWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const SmallInfoButton = styled(InfoButton)`
  font-size: 12px;
`;

const LAYOUTS = {
  PERSON: 'PERSON',
  TABLE: 'TABLE'
};

class SearchResultsContainer extends React.Component<Props, State> {

  constructor(props :Props) {
    super(props);
    this.state = {
      layout: isPersonType(props) ? LAYOUTS.PERSON : LAYOUTS.TABLE,
      showCountDetails: false
    };
  }

  updateLayout = layout => this.setState({ layout });

  onSelect = (index, entity) => {
    const {
      actions,
      entityTypesById,
      neighborsById,
      selectedEntitySet
    } = this.props;

    const entityKeyId = getEntityKeyId(entity);
    const entitySetId = selectedEntitySet.get('id');
    const entityType = entityTypesById.get(selectedEntitySet.get('entityTypeId'), Map());
    actions.selectEntity({ entityKeyId, entitySetId, entityType });
    if (!neighborsById.has(entityKeyId)) {
      actions.loadEntityNeighbors({ entitySetId, entity });
    }
  };

  getCountsForUtilizer = (entityKeyId) => {
    const { countBreakdown, entityTypesById, propertyTypesById } = this.props;

    const getEntityTypeTitle = id => entityTypesById.getIn([id, 'title'], '');

    return countBreakdown.get(entityKeyId, Map()).entrySeq()
      .filter(([pair]) => pair !== 'score')
      .flatMap(([pair, pairMap]) => {
        const pairTitle = `${getEntityTypeTitle(pair.get(0))} ${getEntityTypeTitle(pair.get(1))}`;
        return pairMap.entrySeq().map(([key, count]) => {
          const title = key === COUNT_FQN
            ? pairTitle
            : `${pairTitle} -- ${propertyTypesById.getIn([key, 'title'], '')}`;
          return Map().set(TOP_UTILIZERS_FILTER.LABEL, title).set(COUNT_FQN, count);
        });
      });
  }

  renderPersonResults = () => {
    const { isTopUtilizers, results } = this.props;
    const { showCountDetails } = this.state;

    return results.map((person, index) => (
      <PersonResultCard
          key={getEntityKeyId(person)}
          counts={isTopUtilizers && showCountDetails ? this.getCountsForUtilizer(getEntityKeyId(person)) : null}
          index={index + 1}
          person={person}
          onClick={() => this.onSelect(index, person)} />
    ));
  }

  renderTableResults = () => {
    const {
      entityTypesById,
      filteredPropertyTypes,
      isTopUtilizers,
      propertyTypesById,
      results,
      selectedEntitySet
    } = this.props;

    let propertyTypeHeaders = List();

    if (isTopUtilizers) {
      propertyTypeHeaders = propertyTypeHeaders.push(fromJS({
        id: COUNT_FQN,
        value: 'Score'
      }));
    }

    const propertyTypes = entityTypesById
      .getIn([selectedEntitySet.get('entityTypeId'), 'properties'])
      .map(id => propertyTypesById.get(id));

    propertyTypes.forEach((propertyType) => {
      const id = getFqnString(propertyType.get('type'));
      const value = propertyType.get('title');
      if (!filteredPropertyTypes || filteredPropertyTypes.has(propertyType.get('id'))) {
        const isImg = IMAGE_PROPERTY_TYPES.includes(id);
        propertyTypeHeaders = propertyTypeHeaders.push(fromJS({ id, value, isImg }));
      }
    });

    return (
      <TableWrapper>
        <DataTable headers={propertyTypeHeaders} data={results} onRowClick={this.onSelect} />
      </TableWrapper>
    );
  };

  renderLayoutToolbar = () => {
    const { isTopUtilizers } = this.props;
    const { layout, showCountDetails } = this.state;
    const options = [
      {
        label: 'List',
        value: LAYOUTS.PERSON,
        onClick: () => this.updateLayout(LAYOUTS.PERSON)
      },
      {
        label: 'Table',
        value: LAYOUTS.TABLE,
        onClick: () => this.updateLayout(LAYOUTS.TABLE)
      }
    ];
    return (
      <ToolbarWrapper>
        <ButtonToolbar options={options} value={layout} noPadding />
        { isTopUtilizers && layout === LAYOUTS.PERSON ? (
          <SmallInfoButton onClick={() => this.setState({ showCountDetails: !showCountDetails })}>
            {`${showCountDetails ? 'Hide' : 'Show'} Score Details`}
          </SmallInfoButton>
        ) : null}
      </ToolbarWrapper>
    );
  }

  renderTopUtilizerSearchResults = () => {
    const { layout } = this.state;

    return (isPersonType(this.props) && layout === LAYOUTS.PERSON)
      ? this.renderPersonResults()
      : this.renderTableResults();
  }

  render() {
    const { breadcrumbs, results } = this.props;

    const isExploring = !!breadcrumbs.size;

    let rankingsById = Map();
    results.forEach((utilizer, index) => {
      rankingsById = rankingsById.set(getEntityKeyId(utilizer), index + 1);
    });

    const resultContent = isExploring
      ? <EntityDetails rankingsById={rankingsById} />
      : this.renderTopUtilizerSearchResults();

    return (
      <CenteredColumnContainer>
        <FixedWidthWrapper>
          {(isPersonType(this.props) && !isExploring) ? this.renderLayoutToolbar() : null}
          {resultContent}
        </FixedWidthWrapper>
      </CenteredColumnContainer>
    );
  }
}

function mapStateToProps(state :Map<*, *>) :Object {
  const edm = state.get(STATE.EDM);
  const entitySets = state.get(STATE.ENTITY_SETS);
  const explore = state.get(STATE.EXPLORE);
  const topUtilizers = state.get(STATE.TOP_UTILIZERS);
  return {
    entityTypesById: edm.get(EDM.ENTITY_TYPES_BY_ID),
    entitySetsById: edm.get(EDM.ENTITY_SETS_BY_ID),
    propertyTypesById: edm.get(EDM.PROPERTY_TYPES_BY_ID),
    selectedEntitySet: entitySets.get(ENTITY_SETS.SELECTED_ENTITY_SET),
    breadcrumbs: explore.get(EXPLORE.BREADCRUMBS),
    neighborsById: explore.get(EXPLORE.ENTITY_NEIGHBORS_BY_ID),
    countBreakdown: topUtilizers.get(TOP_UTILIZERS.COUNT_BREAKDOWN)
  };
}

function mapDispatchToProps(dispatch :Function) :Object {
  const actions :{ [string] :Function } = {};

  Object.keys(ExploreActionFactory).forEach((action :string) => {
    actions[action] = ExploreActionFactory[action];
  });

  return {
    actions: {
      ...bindActionCreators(actions, dispatch)
    }
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(SearchResultsContainer));