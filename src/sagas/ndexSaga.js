import { all, call, put, takeLatest } from 'redux-saga/effects'
import * as api from '../api/ndex'
import * as myGeneApi from '../api/mygene'
import * as cySearchApi from '../api/search'

import {
  SEARCH_STARTED,
  SEARCH_FAILED,
  SEARCH_SUCCEEDED,
  FETCH_RESULT_STARTED,
  FETCH_RESULT_SUCCEEDED,
  FETCH_RESULT_FAILED,
  SET_SEARCH_RESULT
} from '../actions/search'

import {
  FIND_SOURCE_STARTED,
  FIND_SOURCE_FAILED,
  FIND_SOURCE_SUCCEEDED
} from '../actions/source'

import {
  NETWORK_FETCH_STARTED,
  NETWORK_FETCH_SUCCEEDED,
  NETWORK_FETCH_FAILED
} from '../actions/network'

const API_CALL_INTERVAL = 500

export default function* rootSaga() {
  yield takeLatest(SEARCH_STARTED, watchSearch)
  yield takeLatest(FETCH_RESULT_STARTED, watchSearchResult)
  yield takeLatest(NETWORK_FETCH_STARTED, fetchNetwork)
  yield takeLatest(FIND_SOURCE_STARTED, fetchSource)
}

/**
 * Calls Cytoscape Search service and set state
 *
 * @param action
 * @returns {IterableIterator<*>}
 */
function* watchSearch(action) {
  const geneList = action.payload.geneList
  let sourceNames = action.payload.sourceNames

  // If source names are missing, find them:
  if (
    sourceNames === undefined ||
    sourceNames === null ||
    sourceNames.length === 0
  ) {
    const sources = yield call(cySearchApi.getSource, null)
    const sourceJson = yield call([sources, 'json'])
    const sourceList = sourceJson.results
    sourceNames = sourceList.map(source => source.name)
    sourceNames = sourceNames.filter(name => name !== 'keyword')
  }
  const geneListString = geneList.join()

  try {
    // Call 1: Send query and get JobID w/ gene props from MyGene
    const [geneRes, searchRes] = yield all([
      call(myGeneApi.searchGenes, geneListString),
      call(cySearchApi.postQuery, geneList, sourceNames)
    ])

    const geneJson = yield call([geneRes, 'json'])
    const resultLocation = searchRes.headers.get('Location')
    const parts = resultLocation.split('/')
    const jobId = parts[parts.length - 1]
    const filtered = filterGenes(geneJson)

    yield put({
      type: SEARCH_SUCCEEDED,
      payload: {
        genes: filtered.uniqueGeneMap,
        notFound: filtered.notFound,
        resultLocation,
        jobId
      }
    })
  } catch (e) {
    console.warn('NDEx search error:', e)
    yield put({
      type: SEARCH_FAILED,
      payload: {
        message: 'NDEx network search error',
        query: geneListString,
        error: e.message
      }
    })
  }
}

// Simple sleep function using Promise
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

function* watchSearchResult(action) {
  const jobId = action.payload.jobId

  const individualResults = []

  try {
    while (true) {
      // Check overall status
      const statusRes = yield call(cySearchApi.checkStatus, jobId)
      const statusJson = yield call([statusRes, 'json'])

      const status = statusJson.sources
      let idx = status.length

      while (idx--) {
        const src = status[idx]
        const { progress, sourceName } = src
        if (progress === 100) {
          const resultRes = yield call(cySearchApi.getResult, jobId, sourceName)
          const json = yield call([resultRes, 'json'])

          individualResults.push(json.sources[0])
          json.sources = individualResults

          yield put({
            type: SET_SEARCH_RESULT,
            payload: {
              singleResult: json
            }
          })
          // console.log(idx + ': Individual check finished:', src, json)
        }
      }

      idx = status.length
      let finishCount = 0
      while (idx--) {
        if (status[idx].progress === 100) {
          finishCount++
        }
      }
      if (finishCount === status.length) {
        console.log('!! Search & fetch finished:', finishCount, individualResults)
        break
      }

      // Wait 1 sec. and try API call again.
      yield call(sleep, API_CALL_INTERVAL)
    }

    yield put({
      type: FETCH_RESULT_SUCCEEDED,
      payload: {}
    })
  } catch (e) {
    console.warn('NDEx search error:', e)
    yield put({
      type: FETCH_RESULT_FAILED,
      payload: {
        message: 'Failed to fetch search result',
        jobId,
        error: e.message
      }
    })
  }
}

function* fetchNetwork(action) {
  try {
    const params = action.payload
    const id = params.id
    const sourceUUID = params.sourceUUID
    const networkUUID = params.networkUUID

    const cx = yield call(api.fetchNetwork, id, sourceUUID, networkUUID)
    const json = yield call([cx, 'json'])

    yield put({ type: NETWORK_FETCH_SUCCEEDED, cx: json })
  } catch (error) {
    yield put({ type: NETWORK_FETCH_FAILED, error })
  }
}

function* fetchSource(action) {
  try {
    const sources = yield call(cySearchApi.getSource, null)
    const json = yield call([sources, 'json'])
    const orderedSources = json.results
    yield put({ type: FIND_SOURCE_SUCCEEDED, sources: orderedSources })
  } catch (error) {
    yield put({ type: FIND_SOURCE_FAILED, error })
  }
}

const filterGenes = resultList => {
  const uniqueGeneMap = new Map()
  const notFound = []

  let len = resultList.length
  while (len--) {
    const entry = resultList[len]
    if (entry.notfound) {
      notFound.push(entry.query)
    } else {
      uniqueGeneMap.set(entry.query, entry)
    }
  }

  return {
    uniqueGeneMap,
    notFound
  }
}
