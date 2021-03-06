/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import { List, Map } from 'immutable';

import StyledCheckbox from '../../controls/StyledCheckbox';
import StyledRadio from '../../controls/StyledRadio';
import StyledInput from '../../controls/StyledInput';
import {
  DropdownWrapper,
  DropdownRowWrapper,
  PropertyTypeCheckboxWrapper,
  RadioTitle
} from '../../layout/Layout';
import { COUNT_TYPES } from '../../../utils/constants/TopUtilizerConstants';

const TopBorderRowWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 30px 0;
  margin-top: 20px;
  border-top: 1px solid #e6e6eb;

  div {
    font-family: 'Open Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #555e6f;
  }
`;

const Subtitle = styled.div`
  font-size: 14px;
  line-height: normal;
  color: #555e6f;
  margin-bottom: 10px;
`;

type Props = {
  availableDurationProperties :Map<*, *>;
  countType :string;
  durationTypeWeights :Map<*, *>;
  entityTypes :List;
  entityTypesIndexMap :Map;
  numberOfUtilizers :number;
  onChange :(e :Object) => void;
  onDurationWeightChange :(newWeights :Map<*, *>) => void;
  onNumUtilizersChange :(numUtilizers :number) => void;
  propertyTypes :List;
  propertyTypesIndexMap :Map;
  selectedNeighborTypes :Object[];
}

const CountTypeOptions = ({
  availableDurationProperties,
  countType,
  durationTypeWeights,
  entityTypes,
  entityTypesIndexMap,
  numberOfUtilizers,
  onChange,
  onDurationWeightChange,
  onNumUtilizersChange,
  propertyTypes,
  propertyTypesIndexMap,
  selectedNeighborTypes,
} :Props) => {

  const isDisabled = !availableDurationProperties.size
    || availableDurationProperties.size !== selectedNeighborTypes.length;

  return (
    <DropdownWrapper>
      <RadioTitle>Count Type</RadioTitle>
      <DropdownRowWrapper radioHalfSize>
        <StyledRadio
            checked={countType === COUNT_TYPES.EVENTS}
            value={COUNT_TYPES.EVENTS}
            onChange={onChange}
            label="Events" />
        <StyledRadio
            disabled={isDisabled}
            checked={countType === COUNT_TYPES.DURATION}
            value={COUNT_TYPES.DURATION}
            onChange={onChange}
            label="Duration" />
      </DropdownRowWrapper>
      {
        countType === COUNT_TYPES.DURATION ? (
          <DropdownWrapper noPadding>
            <TopBorderRowWrapper>
              <div>Properties to include</div>
            </TopBorderRowWrapper>
            <PropertyTypeCheckboxWrapper twoCols>
              {availableDurationProperties.entrySeq().flatMap(([pair, propertyTypeIds]) => {

                const index1 = entityTypesIndexMap.get(pair.get(0));
                const index2 = entityTypesIndexMap.get(pair.get(1));
                const entityType1 = entityTypes.get(index1, Map());
                const entityType2 = entityTypes.get(index2, Map());
                const assocTitle = entityType1.get('title');
                const neighborTitle = entityType2.get('title');

                return propertyTypeIds.map((propertyTypeId) => {
                  const weight = durationTypeWeights.getIn([pair, propertyTypeId], 0);
                  const propertyTypeIndex = propertyTypesIndexMap.get(propertyTypeId);
                  const propertyType = propertyTypes.get(propertyTypeIndex, Map());
                  const propertyTypeTitle = propertyType.get('title', '');
                  const label = `${assocTitle} ${neighborTitle} -- ${propertyTypeTitle}`;
                  const onDurationChange = (e) => {
                    const { checked } = e.target;
                    const newWeight = checked ? 1 : 0;
                    onDurationWeightChange(durationTypeWeights.setIn([pair, propertyTypeId], newWeight));
                  };
                  return (
                    <div key={label}>
                      <StyledCheckbox
                          checked={weight > 0}
                          label={label}
                          onChange={onDurationChange} />
                    </div>
                  );
                });
              })}
            </PropertyTypeCheckboxWrapper>
          </DropdownWrapper>
        ) : null
      }
      <TopBorderRowWrapper>Search result</TopBorderRowWrapper>
      <Subtitle># of top utilizers</Subtitle>
      <StyledInput
          width="120px"
          type="number"
          value={numberOfUtilizers}
          onChange={({ target }) => onNumUtilizersChange(target.value)} />
    </DropdownWrapper>
  );
};

export default CountTypeOptions;
