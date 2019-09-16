import React, { useEffect, useState } from 'react'
import CytoscapeComponent from 'react-cytoscapejs'
import { CxToJs, CyNetworkUtils } from 'cytoscape-cx2js'
import Cytoscape from 'cytoscape'
import CyCanvas from 'cytoscape-canvas'
import { CxToCyCanvas } from 'cyannotation-cx2js'
import Warning from './Warning'
import { CONCENTRIC_LAYOUT, COSE_LAYOUT, PRESET_LAYOUT } from './LayoutSettings'

import './style.css'

export const MAX_NETWORK_SIZE = 5000

Cytoscape.use(CyCanvas)
let cyInstance = null

/**
 *
 * Simple wrapper for cytoscape.js react component
 *
 * @param props
 * @returns {*}
 * @constructor
 */
const CytoscapeViewer = props => {
  const { highlights } = props.uiState
  const { fit } = props.network

  /*
    Node/Edge Selections
   */
  useEffect(() => {
    // Event handler can be set only when Cytoscape.js instance is available.
    if (cyInstance === undefined || cyInstance === null) {
      return
    }

    // Event handlers

    // Background tapped: Remove selection
    // (This is the standard Cytosape UX)
    cyInstance.on('tap', function() {
      try {
        props.networkActions.unselectEdges()
        props.networkActions.unselectNodes()
      } catch (e) {
        console.warn(e)
      }
    })

    const selectEdge = () => {
      setTimeout(() => {
        const edges = []
        const selectedEdges = cyInstance.$('edge:selected')
        selectedEdges.forEach(element => {
          edges.push(element.data())
        })
        if (edges.length === 0) {
          props.networkActions.unselectEdges()
        } else {
          props.networkActions.selectEdges(edges)
        }
      }, 1)
    }

    const selectNode = () => {
      setTimeout(() => {
        const nodes = []
        const selectedNodes = cyInstance.$('node:selected')
        selectedNodes.forEach(element => {
          if (element.data().name !== '') {
            nodes.push(element.data())
          }
        })
        if (nodes.length === 0) {
          props.networkActions.unselectNodes()
        } else {
          props.networkActions.selectNodes(nodes)
        }
      }, 1)
    }

    cyInstance.on('tap', 'node', function() {
      try {
        cyInstance.nodes().removeClass('connected')
      } catch (e) {
        console.warn(e)
      }
      selectNode()
    })

    cyInstance.on('tap', 'edge', function() {
      try {
        cyInstance.nodes().removeClass('connected')
        const selected = this.data()
        const { source, target } = selected
        cyInstance.$('#' + source + ', #' + target).addClass('connected')
      } catch (e) {
        console.warn(e)
      }
      selectEdge()
    })

    cyInstance.on('boxend', function(event) {
      selectEdge()
      selectNode()
    })

    // Reset the UI state (highlight)
    if (highlights) {
      cyInstance.elements().addClass('faded')
      const query = cyInstance.filter('node[querynode = "true"]')
      query.addClass('highlight')
    } else {
      cyInstance
        .elements()
        .removeClass('faded')
        .removeClass('highlight')
    }

    return () => {
      console.log('Network viewer unmounted')
    }
  }, [])

  useEffect(() => {
    if (cyInstance === undefined || cyInstance === null) {
      return
    }

    const targets = props.search.selectedGenes
    if (targets === null || targets === undefined) {
      return
    }

    const selected = cyInstance.elements('node[name = "' + targets[0] + '"]')

    if (selected.length !== 0) {
      cyInstance.animate(
        {
          zoom: 2,
          center: {
            eles: selected[0]
          }
        },
        {
          duration: 500
        }
      )
    }

    if (targets.length === 0) {
      cyInstance.animate(
        {
          fit: {
            eles: cyInstance.elements(),
            padding: 6
          }
        },
        {
          duration: 500
        }
      )
    }
  }, [props.search.selectedGenes])

  useEffect(() => {
    if (cyInstance === undefined || cyInstance === null) {
      return
    }
    if (fit) {
      cyInstance.animate(
        {
          fit: {
            eles: cyInstance.elements(),
            padding: 6
          }
        },
        {
          duration: 500
        }
      )
      props.networkActions.fitNetworkView(false)
    }
  }, [fit])

  // Check network size and show warning if it's too big for this renderer
  const numObjects = props.network.nodeCount + props.network.edgeCount
  if (numObjects > MAX_NETWORK_SIZE) {
    return <Warning {...props} />
  }

  // Render actual network
  const cyjs = props.network.network
  if (cyjs === null || cyjs === undefined) {
    return null
  }

  const networkAreaStyle = {
    width: '100%',
    height: '100%',
    background: props.network.backgroundColor
  }

  const isLayoutAvailable = cyjs.isLayout

  let layout = PRESET_LAYOUT
  if (!isLayoutAvailable && cyjs.elements.length < 500) {
    layout = COSE_LAYOUT
  } else if (!isLayoutAvailable) {
    layout = CONCENTRIC_LAYOUT
  }

  if (cyInstance !== null) {
    cyInstance.resize()
    if(layout === COSE_LAYOUT) {
      layout.stop = () => {
        setTimeout(()=> {
          cyInstance.fit()
        }, 200)
      }

    }

    if (highlights) {
      cyInstance.elements().addClass('faded')
      const query = cyInstance.filter('node[querynode = "true"]')
      query.addClass('highlight')
    } else {
      cyInstance
        .elements()
        .removeClass('faded')
        .removeClass('highlight')
    }
  }

  return (
    <CytoscapeComponent
      elements={cyjs.elements}
      layout={layout}
      style={networkAreaStyle}
      stylesheet={cyjs.style}
      cy={cy => {
        cyInstance = cy
        console.log("network background color:" + props.network.backgroundColor)
        if (props.network.backgroundColor) {
          const backgroundLayer = cyInstance.cyCanvas({
            zIndex: -2
          })
          const canvas = backgroundLayer.getCanvas()
          const ctx = backgroundLayer.getCanvas().getContext('2d')

          cyInstance.on('render cyCanvas.resize', function() {
            console.log('resize CyCanvas', props.network.backgroundColor)
            ctx.fillStyle = props.network.backgroundColor
            ctx.fillRect(0, 0, canvas.width, canvas.height)
          })
        }

        const utils = new CyNetworkUtils();
        const niceCX = utils.rawCXtoNiceCX(props.network.originalCX);

        if (niceCX) {
          const annotations = new CxToCyCanvas(CxToJs)
          annotations.drawAnnotationsFromNiceCX(cyInstance, niceCX)
        }
      }}
    />
  )
}

export default CytoscapeViewer