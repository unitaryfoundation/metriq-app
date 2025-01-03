import axios from 'axios'
import React from 'react'
import config from './../config'
import ErrorHandler from '../components/ErrorHandler'
import FormFieldValidator from '../components/FormFieldValidator'
import FormFieldTypeaheadRow from '../components/FormFieldTypeaheadRow'
import CategoryScroll from '../components/CategoryScroll'
import FormFieldAlertRow from '../components/FormFieldAlertRow'
import FormFieldWideRow from '../components/FormFieldWideRow'
import ViewHeader from '../components/ViewHeader'
import SotaChart from '../components/SotaChart'
import { sortAlphabetical } from '../components/SortFunctions'
import { withRouter } from 'react-router-dom'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faHeart, faExternalLinkAlt, faChartLine } from '@fortawesome/free-solid-svg-icons'

library.add(faHeart, faExternalLinkAlt, faChartLine)

class Tasks extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      isLoading: true,
      alphabetical: [],
      allNames: [],
      featured: [34, 38, 159],
      filterId: null,
      requestFailedMessage: ''
    }

    this.handleOnFilter = this.handleOnFilter.bind(this)
    this.handleOnSelect = this.handleOnSelect.bind(this)
  }

  handleOnFilter (value) {
    if (value) {
      this.setState({ filterId: value.id })
    }
  }

  handleOnSelect (value) {
    if (value) {
      this.props.history.push('/Task/' + value.id)
    }
  }

  componentDidMount () {
    axios.get(config.api.getUriPrefix() + '/task/submissionCount')
      .then(res => {
        const alphabetical = res.data.data
        alphabetical.sort(sortAlphabetical)
        this.setState({ alphabetical, isLoading: false })
      })
      .catch(err => {
        this.setState({ requestFailedMessage: ErrorHandler(err) })
      })

    axios.get(config.api.getUriPrefix() + '/task/names')
      .then(res => {
        this.setState({
          requestFailedMessage: '',
          allNames: res.data.data
        })
      })
      .catch(err => {
        this.setState({ requestFailedMessage: ErrorHandler(err) })
      })
  }

  render () {
    return (
      <div id='metriq-main-content'>
        <ViewHeader>Tasks</ViewHeader>
        <FormFieldTypeaheadRow
          className='search-bar'
          innerClassName='search-accent'
          options={this.state.allNames}
          labelKey='name'
          inputName='name'
          value=''
          placeholder='🔎'
          onChange={(field, value) => this.handleOnFilter(value)}
          onSelect={this.handleOnSelect}
          alignLabelRight
          isRow
        />
        <br />
        <h4 align='left'>Tasks are workloads of interest performed on a quantum computer.</h4>
        <p className='text-start'>Search the task hierarchy to see charts of comparative performance across methods or click into the parent/child task hierarchy through top-level task categories.</p>
        <br />
        <div className='row'>
          <div className='col'>
            <h4 align='left'>Featured Tasks</h4>
          </div>
        </div>
        <div className='row'>
          <div className='col-md-12'>
            {this.state.featured.map((taskId, index) =>
              <span key={index}>
                <SotaChart
                  chartId={index}
                  taskId={taskId}
                  isLog={index < 2}
                  logBase={(index === 0) ? '2' : '10'}
                  isHideSubset
                />
                <br />
              </span>
            )}
          </div>
        </div>
        <br />
        <FormFieldWideRow className='centered-tabs'>
          <CategoryScroll className='col-lg-9 col' type='task' isLoading={this.state.isLoading} items={this.state.alphabetical} isLoggedIn={this.props.isLoggedIn} heading='Top-level task categories' />
        </FormFieldWideRow>
        <br />
        <FormFieldAlertRow>
          <FormFieldValidator invalid={!!this.state.requestFailedMessage} message={this.state.requestFailedMessage} />
        </FormFieldAlertRow>
      </div>
    )
  }
}

export default withRouter(Tasks)
