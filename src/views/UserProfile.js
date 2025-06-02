import axios from 'axios'
import React from 'react'
import { Link, useParams } from 'react-router-dom'
import config from '../config'
import ErrorHandler from '../components/ErrorHandler'
import FieldRow from '../components/FieldRow'
import FormFieldValidator from '../components/FormFieldValidator'
import FormFieldAlertRow from '../components/FormFieldAlertRow'
import ViewHeader from '../components/ViewHeader'
import { Card, Tab, Tabs } from 'react-bootstrap'

function withParams (Component) {
  return props => <Component {...props} params={useParams()} />
}

class UserProfile extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      userId: this.props.params.id,
      data: {
        username: '',
        usernameNormal: '',
        name: '',
        affiliation: '',
        twitterHandle: '',
        createdAt: '',
        recentTaskSubs: [],
        recentUpvotes: []
      },
      requestFailedMessage: ''
    }

    this.fetchData = this.fetchData.bind(this)
  }

  fetchData (id) {
    const route = `${config.api.getUriPrefix()}/user/${id}`
    axios.get(route, { withCredentials: true })
      .then(res => this.setState({ data: res.data.data, requestFailedMessage: '' }))
      .catch(err => this.setState({ requestFailedMessage: ErrorHandler(err) }))
  }

  componentDidMount () {
    const { userId } = this.props.params
    this.setState({ userId })
    this.fetchData(userId)
  }

  componentDidUpdate () {
    const { userId } = this.props.params
    if (this.state.userId !== userId) {
      this.setState({ userId })
      this.fetchData(userId)
    }
  }

  renderUserInfo () {
    const { username, usernameNormal, name, affiliation, twitterHandle, createdAt } = this.state.data

    return (
      <Card className='mb-4 shadow-sm border-0'>
        <Card.Body>
          <FieldRow fieldName='username' label='Username' value={username} />
          <FieldRow fieldName='usernameNormal' label='Normalized Username' value={usernameNormal} />
          <FieldRow fieldName='affiliation' label='Affiliation' value={affiliation} />
          <FieldRow fieldName='twitterHandle' label='Twitter Handle' value={twitterHandle} />
          <FieldRow fieldName='name' label='Name' value={name} />
          <FieldRow fieldName='createdAt' label='Date Joined' value={createdAt} />
        </Card.Body>
      </Card>
    )
  }

  renderTabs () {
    const { recentTaskSubs, recentUpvotes } = this.state.data
    if (recentTaskSubs.length === 0 && recentUpvotes.length === 0) return null

    return (
      <Tabs
        variant='tabs'
        id='user-activity-tabs'
        className='mb-3 user-activity-tabs'
        defaultActiveKey={recentTaskSubs.length > 0 ? 'tasks' : 'upvotes'}
      >
        {recentTaskSubs.length > 0 && (
          <Tab eventKey='tasks' title={`Recent Subscribed Tasks (${recentTaskSubs.length})`}>
            <ul className='list-unstyled pt-3'>
              {recentTaskSubs.map(task => (
                <li key={task.id} className='pb-2'>
                  <Link to={`/Task/${task.id}`}>{task.name}</Link>
                </li>
              ))}
            </ul>
          </Tab>
        )}
        {recentUpvotes.length > 0 && (
          <Tab eventKey='upvotes' title={`Recent Upvotes (${recentUpvotes.length})`}>
            <ul className='list-unstyled pt-3'>
              {recentUpvotes.map(sub => (
                <li key={sub.id} className='pb-2'>
                  <Link to={`/Submission/${sub.id}`}>{sub.name}</Link>
                </li>
              ))}
            </ul>
          </Tab>
        )}
      </Tabs>
    )
  }

  render () {
    return (
      <div id='metriq-main-content' className='container'>
        <ViewHeader>User Profile</ViewHeader>
        <br />
        {this.renderUserInfo()}
        <FormFieldAlertRow>
          <FormFieldValidator
            invalid={!!this.state.requestFailedMessage}
            message={this.state.requestFailedMessage}
          />
        </FormFieldAlertRow>
        {this.renderTabs()}
      </div>
    )
  }
}

export default withParams(UserProfile)
