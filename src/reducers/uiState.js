import { handleActions } from 'redux-actions'
import {
  setSettingsOpen,
  setServicesListOpen,
  setHighlights,
  setSelectedSource,
  setSortBy,
  setSortOptions,
  setLayout,
  setLayouts,
  fitNetworkView,
  update,
  setAnnotations
} from '../actions/uiState'

const DEF_STATE = {
  isSettingsOpen: false,
  servicesListOpen: false,
  highlights: true,
  selectedSource: 'enrichment',
  sortOptions: ['Overlap', 'p-Value', 'Similarity'],
  sortBy: 'Similarity',
  layout: 'Preset',
  layouts: [],
  fit: true,
  annotations: false
}

const uiState = handleActions(
  {
    [setSettingsOpen]: (state, payload) => {
      console.log('OPEN = ', payload.payload)
      return { ...state, isSettingsOpen: payload.payload }
    },
    [setServicesListOpen]: (state, payload) => {
      return { ...state, servicesListOpen: payload.payload }
    },
    [setHighlights]: (state, payload) => {
      return { ...state, highlights: payload.payload }
    },
    [setSelectedSource]: (state, payload) => {
      return { ...state, selectedSource: payload.payload }
    },
    [setSortOptions]: (state, payload) => {
      return {
        ...state,
        sortOrder: payload.payload
      }
    },
    [setSortBy]: (state, payload) => {
      return {
        ...state,
        sortBy: payload.payload
      }
    },
    [setLayout]: (state, payload) => {
      return {
        ...state,
        layout: payload.payload
      }
    },
    [setLayouts]: (state, payload) => {
      return {
        ...state,
        layouts: payload.payload
      }
    },
    [fitNetworkView]: (state, payload) => {
      return {
        ...state,
        fit: !state.fit
      }
    },
    [update]: (state, payload) => {
      return {
        ...state,
        //fit: payload.payload.fit,
        //highlights: payload.payload.highlights,
        layouts: payload.payload.layouts,
        layout: payload.payload.layout
      }
    },
    [setAnnotations]: (state, payload) => {
      return {
        ...state,
        annotations: payload.payload
      }
    }
  },
  DEF_STATE
)

export default uiState
