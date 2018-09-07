/*
 * @flow
 */

import React from 'react';
import moment from 'moment';
import styled from 'styled-components';
import { List, Map, Set } from 'immutable';

import { DATE_DATATYPES } from '../../utils/constants/DataModelConstants';
import { BLUE } from '../../utils/constants/Colors';
import { getEntityKeyId, getFqnString } from '../../utils/DataUtils';

type Props = {
  neighbors :Map<string, Map<string, Map<*, *>>>,
  propertyTypesById :Map<string, *>,
  entityTypesById :Map<string, *>,
  entitySetsById :Map<string, *>,
  entitiesById :Map<string, *>,
  onSelectEntity :({ entitySetId :string, entity :Map<*, *> }) => void
};

type State = {
  orderedNeighbors :List<*>
}

// associationEntitySetId | neighborEntitySetId | datePropertyTypeId | date => entitySetId | entityKeyId

type DateEntry = {
  entitySetId :string,
  entityKeyId :string,
  propertyTypeFqn :string,
  date :string,
  neighbor :Map<*, *>
}

const Wrapper = styled.div`
  width: 100%;

  h1 {
    font-family: 'Open Sans';
    font-size: 20px;
    font-weight: 600;
    color: #2e2e34;
    margin: 50px 0 20px 0;
  }
`;

const TimelineWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const EventRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 10px 0;
  justify-content: space-between;
`;

const DateLabel = styled.div`
  display: flex;
  flex-direction: row;
  font-family: 'Open Sans', sans-serif;
  font-size: 20px;
  color: #555e6f;

  div:first-child {
    font-weight: bold;
    width: 50px;
    margin-right: 20px;
  }

  div:last-child {
    width: 130px;
  }
`;

const EventItem = styled.div`
  background-color: ${BLUE.BLUE_1};
  color: ${BLUE.BLUE_2};
  padding: 15px 20px;
  font-family: 'Open Sans', sans-serif;
  font-size: 16px;
  border-radius: 5px;
  margin-left: 45px;
  width: 100%;
`;

export default class NeighborTimeline extends React.Component<Props, State> {

  constructor(props :Props) {
    super(props);

    this.state = {
      orderedNeighbors: this.sortNeighbors(props)
    };
  }

  getDatePropertyTypeIds = (propertyTypesById) => {
    let dateIds = Set();
    propertyTypesById.valueSeq().forEach((propertyType) => {
      if (DATE_DATATYPES.includes(propertyType.get('datatype'))) {
        dateIds = dateIds.add(propertyType.get('id'));
      }
    });
    return dateIds;
  }

  getDatePropertiesForEntitySets = (entitySetsById, entityTypesById, propertyTypesById) => {
    let entitySetMap = Map();
    entitySetsById.valueSeq().forEach((entitySet) => {
      const entitySetId = entitySet.get('id');
      const dateFqns = entityTypesById
        .getIn([entitySet.get('entityTypeId'), 'properties'])
        .filter(propertyTypeId => DATE_DATATYPES.includes(propertyTypesById.getIn([propertyTypeId, 'datatype'])))
        .map(propertyTypeId => getFqnString(propertyTypesById.getIn([propertyTypeId, 'type'])));

      entitySetMap = entitySetMap.set(entitySetId, dateFqns);
    });

    return entitySetMap;
  }

  getUpdatedNeighborsList = (orderedNeighbors, entitySetId, entity, neighbor, entitySetMap) => {
    let updatedNeighbors = orderedNeighbors;

    const propertyTypeFQNs = entitySetMap.get(entitySetId, List());
    const entityKeyId = getEntityKeyId(entity);
    propertyTypeFQNs.forEach((propertyTypeFqn) => {
      entity.get(propertyTypeFqn, List()).forEach((dateStr) => {
        const date = moment(dateStr);
        if (date.isValid()) {
          const dateEntry :DateEntry = {
            entitySetId,
            entityKeyId,
            propertyTypeFqn,
            date,
            neighbor
          };

          updatedNeighbors = updatedNeighbors.push(dateEntry);
        }
      });
    });

    return updatedNeighbors;
  }

  sortNeighbors = (props :Props) => {
    const {
      entitySetsById,
      entityTypesById,
      neighbors,
      propertyTypesById
    } = props;
    const entitySetMap = this.getDatePropertiesForEntitySets(entitySetsById, entityTypesById, propertyTypesById);

    let orderedNeighbors = List();

    neighbors.forEach((neighbor) => {
      const associationEntitySetId = neighbor.getIn(['associationEntitySetId', 'id']);
      const associationEntity = neighbor.get('associationDetails');
      orderedNeighbors = this.getUpdatedNeighborsList(
        orderedNeighbors,
        associationEntitySetId,
        associationEntity,
        neighbor,
        entitySetMap
      );
      const neighborEntitySetId = neighbor.getIn(['neighborEntitySet', 'id']);
      const neighborEntity = neighbor.get('neighborDetails');
      if (neighborEntitySetId) {
        orderedNeighbors = this.getUpdatedNeighborsList(
          orderedNeighbors,
          neighborEntitySetId,
          neighborEntity,
          neighbor,
          entitySetMap
        );
      }
    });

    return orderedNeighbors.sort((n1, n2) => (n1.date.isBefore(n2.date) ? 1 : -1));
  }

  getEventName = (dateEntry) => {
    return dateEntry.neighbor.getIn(['neighborEntitySet', 'title']);
  }

  renderTimeline = () => {
    const { orderedNeighbors } = this.state;

    let lastYear;

    const rows = orderedNeighbors.map((dateEntry :DateEntry) => {
      const { date } = dateEntry;
      const year = date.format('YYYY');
      const day = date.format('MMMM D');

      const yearStr = year === lastYear ? '' : year;
      lastYear = year;
      return (
        <EventRow>
          <DateLabel>
            <div>{yearStr}</div>
            <div>{day}</div>
          </DateLabel>
          <EventItem>{this.getEventName(dateEntry)}</EventItem>
        </EventRow>
      )
    });

    return (
      <TimelineWrapper>
        {rows}
      </TimelineWrapper>
    )
  }

  render() {
    return (
      <Wrapper>
        <h1>Timeline</h1>
        {this.renderTimeline()}
      </Wrapper>
    );
  }
}