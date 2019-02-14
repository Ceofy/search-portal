import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import Empty from './Empty'
import Ndex from './Ndex'
import GeneDetails from './GeneDetails'

const styles = theme => ({
  tabs: {
    width: '100%',
    backgroundColor: '#FFFFFF'
  }
})

class Results extends React.Component {
  state = {
    value: 1
  }

  handleChange = (event, value) => {
    this.setState({ value })
  }

  render() {
    const { classes, ...others } = this.props
    const { value } = this.state

    const searchResult = this.props.search.results

    // Display message panel if no result is available
    if (searchResult === null) {
      return <Empty />
    }

    return (
      <div className="results-container">
        <div className="results-wrapper">
          <Tabs value={value} onChange={this.handleChange}>
            <Tab
              label={'NDEx (' + this.props.search.results.ndex.numFound + ')'}
            />
            <Tab label="Enrichment (22)" />
            <Tab label="Interactome (102)" />
          </Tabs>
          {value === 1 && <Ndex {...others} />}
          {value === 2 && <h2>Enrichment</h2>}
          {value === 3 && <h2>Interactome</h2>}
        </div>
      </div>
    )
  }
}

export default withStyles(styles)(Results)
