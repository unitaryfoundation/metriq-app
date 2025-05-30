import axios from 'axios'
import React from 'react'
import { useParams } from 'react-router-dom'
import config from '../config'
import FieldRow from '../components/FieldRow'
import FormFieldAlertRow from '../components/FormFieldAlertRow'
import FormFieldValidator from '../components/FormFieldValidator'
import ErrorHandler from '../components/ErrorHandler'
import ViewHeader from '../components/ViewHeader'

function withParams(Component) {
  return props => <Component {...props} params={useParams()} />
}

class User extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      userId: this.props.params.userId,
      data: {
        username: '',
        usernameNormal: '',
        name: '',
        affiliation: '',
        twitterHandle: '',
        websiteUrl: '',
        createdAt: ''
      },
      requestFailedMessage: ''
    }

    this.fetchData = this.fetchData.bind(this)
  }

  fetchData (id) {
    axios.get(config.api.getUriPrefix() + '/user/' + id)
      .then(res => {
        this.setState({ data: res.data.data, requestFailedMessage: '' })
      })
      .catch(err => {
        this.setState({ requestFailedMessage: ErrorHandler(err) })
      })
  }

  componentDidMount () {
    const { userId } = this.props.params
    this.setState({ userId })
    this.fetchData(userId)
  }

  componentDidUpdate (prevProps) {
    const { userId } = this.props.params
    if (userId !== this.state.userId) {
      this.setState({ userId })
      this.fetchData(userId)
    }
  }

  render () {
    return (
      <div id='metriq-main-content' className='container'>
        <ViewHeader>User Profile</ViewHeader>
        <br />
        <FieldRow fieldName='username' label='Username' value={this.state.data.username} />
        <FieldRow fieldName='name' label='Name' value={this.state.data.name} />
        <FieldRow fieldName='affiliation' label='Affiliation' value={this.state.data.affiliation} />
        <FieldRow fieldName='twitterHandle' label='Twitter Handle' value={this.state.data.twitterHandle} />
        <FieldRow fieldName='websiteUrl' label='Website' value={this.state.data.websiteUrl} />
        <FieldRow fieldName='createdAt' label='Date Joined' value={this.state.data.createdAt} />
        <FormFieldAlertRow>
          <FormFieldValidator invalid={!!this.state.requestFailedMessage} message={this.state.requestFailedMessage} />
        </FormFieldAlertRow>
      </div>
    )
  }
}

export default withParams(User)
