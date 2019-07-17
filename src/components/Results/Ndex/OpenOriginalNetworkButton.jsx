import React from 'react'
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core'
import Tooltip from '@material-ui/core/Tooltip'
import OpenInBrowserIcon from '@material-ui/icons/OpenInBrowser'
import { SERVICE_SERVER_URL } from '../../../api/apiConstants'

const styles = theme => ({
  buttonIcon: {
    padding: 0,
    margin: 0,
    paddingBottom: '0.1em'
  },
  button: {
    height: '3em',
    width: '4.3em',
    minWidth: '4.3em',
    marginLeft: '0.5em'
  }
})

/**
 * Simply open the parent network
 *
 * @param props
 * @returns {*}
 * @constructor
 */
const OpenOriginalNetworkButton = props => {
  const { classes, network } = props

  const disabled = !(network.uuid && network.uuid.length > 0)

  return (
    <Tooltip
      disableFocusListener
      title="Open original network in new browser window"
      placement="bottom"
    >
      <div>
        <Button
          color={'default'}
          className={classes.button}
          variant="outlined"
          disabled={disabled}
          onClick={() => handleOpen(network.uuid)}
        >
          <OpenInBrowserIcon
            color={disabled ? 'disabled' : 'inherit'}
            fontSize="large"
            className={classes.buttonIcon}
          />
        </Button>
      </div>
    </Tooltip>
  )
}

const handleOpen = uuid => {
  const url = SERVICE_SERVER_URL + '#/network/' + uuid

  console.log('Opening original network entry:', url)
  window.open(url, '_blank')
}

export default withStyles(styles)(OpenOriginalNetworkButton)