/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import {
  List,
  Map,
  OrderedSet,
  fromJS
} from 'immutable';
import { Models } from 'lattice';

import SimpleMap from '../map/SimpleMap';
import ResourceDropdownFilter from './resources/ResourceDropdownFilter';
import { getEntityTitle } from '../../utils/TagUtils';
import { CenteredColumnContainer, FixedWidthWrapper, TitleText } from '../layout/Layout';
import { PROPERTY_TYPES } from '../../utils/constants/DataModelConstants';
import { getEntityKeyId } from '../../utils/DataUtils';

const { FullyQualifiedName } = Models;

const FilterWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin-bottom: 30px;
`;

const PaddedTitleText = styled(TitleText)`
  justify-self: flex-start;
  font-size: 16px;
`;

const MapWrapper = styled(FixedWidthWrapper)`
  height: 600px;
  position: relative;
`;

const FILTERS = {
  SELECTED_UTILIZER: 'SELECTED_UTILIZER',
  SELECTED_TYPE: 'SELECTED_TYPE'
};

const BLANK_OPTION = fromJS({
  value: '',
  label: 'All'
});

type Props = {
  entityTypes :List;
  entityTypesIndexMap :Map;
  locationsById :Map<*, *>;
  neighborTypes :List<*>;
  neighborsById :Map<*, *>;
  propertyTypes :List;
  propertyTypesIndexMap :Map;
  results :List<*>;
  selectedEntitySet :Map<*, *>;
}

type State = {
  SELECTED_TYPE :Object;
  SELECTED_UTILIZER :Object;
  locationId :UUID;
  neighborOptions :List<*>;
};

export default class TopUtilizerMap extends React.Component<Props, State> {

  constructor(props :Props) {

    super(props);

    const {
      entityTypes,
      entityTypesIndexMap,
      neighborTypes,
      propertyTypes,
      selectedEntitySet,
    } = props;

    const locationId = propertyTypes
      .find((propertyType :Map) => {
        const propertyTypeFQN = FullyQualifiedName.toString(propertyType.get('type', Map()));
        return propertyTypeFQN === PROPERTY_TYPES.LOCATION;
      })
      .get('id');

    const neighborOptions = this.getNeighborOptions({
      entityTypes,
      entityTypesIndexMap,
      locationId,
      neighborTypes,
      selectedEntitySet,
    });

    this.state = {
      locationId,
      neighborOptions,
      [FILTERS.SELECTED_TYPE]: neighborOptions.get(0),
      [FILTERS.SELECTED_UTILIZER]: BLANK_OPTION.toJS()
    };
  }

  componentWillReceiveProps(nextProps :Props) {

    const { selectedEntitySet, neighborsById } = this.props;
    const { locationId } = this.state;
    const {
      entityTypes,
      entityTypesIndexMap,
      neighborTypes,
      neighborsById: nextNeighborsById,
      selectedEntitySet: nextSelectedEntitySet,
    } = nextProps;

    if (selectedEntitySet !== nextSelectedEntitySet || neighborsById !== nextNeighborsById) {
      const neighborOptions = this.getNeighborOptions({
        entityTypes,
        entityTypesIndexMap,
        locationId,
        neighborTypes,
        selectedEntitySet: nextSelectedEntitySet,
      });
      this.setState({
        neighborOptions,
        [FILTERS.SELECTED_TYPE]: neighborOptions.get(0)
      });
    }
  }

  hasLocations = (locationId :UUID, entityType :Map) => entityType.get('properties', List()).includes(locationId);

  getNeighborOptions = ({
    entityTypes,
    entityTypesIndexMap,
    locationId,
    neighborTypes,
    selectedEntitySet,
  } :Object) => {

    const entityTypeId = selectedEntitySet.get('entityTypeId');
    const entityTypeIndex = entityTypesIndexMap.get(entityTypeId);
    const entityType = entityTypes.get(entityTypeIndex, Map());
    const neighborTypeList = this.hasLocations(locationId, entityType)
      ? List.of({
        value: selectedEntitySet.get('id'),
        label: selectedEntitySet.get('title')
      }) : List();

    return neighborTypeList.concat(
      neighborTypes
        .filter((type) => type.getIn(['neighborEntityType', 'properties']).includes(locationId))
        .map((type) => ({
          value: type.getIn(['neighborEntityType', 'id']),
          label: type.getIn(['neighborEntityType', 'title'])
        }))
    );
  }

  renderSelectDropdown = (key :string, label :string, options :Object[]) => {

    const { [key]: value } = this.state;
    const onChange = (newValue) => {
      this.setState({ [key]: newValue });
    };
    return (
      <ResourceDropdownFilter
          value={value}
          label={label}
          options={options}
          onChange={onChange}
          withMargin />
    );
  }

  getLocations = () => {

    const {
      results,
      neighborsById,
      selectedEntitySet,
      locationsById
    } = this.props;

    const {
      [FILTERS.SELECTED_TYPE]: selectedType,
      [FILTERS.SELECTED_UTILIZER]: selectedUtilizerState,
    } = this.state;
    const selectedItem = selectedType.value;
    const selectedUtilizer = selectedUtilizerState.value;

    let locations = Map();

    const utilizerList = selectedUtilizer
      ? results.filter((result) => getEntityKeyId(result) === selectedUtilizer)
      : results;

    utilizerList.forEach((result) => {
      const entityKeyId = getEntityKeyId(result);

      if ((selectedItem === selectedEntitySet.get('id')) && locationsById.get(entityKeyId, List()).size) {
        locations = locations.set(entityKeyId, locationsById.get(entityKeyId, List()));
      }
      else {
        const coords = neighborsById
          .get(entityKeyId, List())
          .filter((neighborObj) => selectedItem === neighborObj.getIn(['neighborEntitySet', 'entityTypeId']))
          .flatMap(
            (neighborObj) => locationsById.get(getEntityKeyId(neighborObj.get('neighborDetails', Map())), List())
          );

        if (coords && coords.size) {
          locations = locations.set(entityKeyId, coords);
        }
      }

    });

    return locations;
  }

  render() {
    const {
      entityTypes,
      entityTypesIndexMap,
      propertyTypes,
      propertyTypesIndexMap,
      results,
      selectedEntitySet,
    } = this.props;
    const { neighborOptions } = this.state;

    const entityTypeId = selectedEntitySet.get('entityTypeId');
    const entityTypeIndex = entityTypesIndexMap.get(entityTypeId);
    const selectedEntityType = entityTypes.get(entityTypeIndex, Map());

    const utilizerOptions = [
      BLANK_OPTION.toJS(),
      ...results.map((utilizer, index) => {
        const value = getEntityKeyId(utilizer);
        const num = index + 1;
        const label = getEntityTitle(selectedEntityType, propertyTypes, propertyTypesIndexMap, utilizer);
        return { value, num, label };
      }).toJS()
    ];

    return (
      <CenteredColumnContainer>
        <FixedWidthWrapper>
          <PaddedTitleText>Filter by event types and utilizers</PaddedTitleText>
          <FilterWrapper>
            {this.renderSelectDropdown(FILTERS.SELECTED_UTILIZER, selectedEntityType.get('title'), utilizerOptions)}
            {this.renderSelectDropdown(FILTERS.SELECTED_TYPE, 'Event Type', neighborOptions)}
          </FilterWrapper>
          <MapWrapper>
            <SimpleMap
                coordinatesByEntity={this.getLocations()}
                selectedEntityKeyIds={OrderedSet()}
                selectEntity={() => {}} />
          </MapWrapper>
        </FixedWidthWrapper>
      </CenteredColumnContainer>
    );
  }
}
