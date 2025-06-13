import axios from 'axios'
import { useEffect, useState } from 'react'
import config from '../config'
import ErrorHandler from '../components/ErrorHandler'
import ViewHeader from '../components/ViewHeader'
import CategoryItemBox from '../components/CategoryItemBox'
import FormFieldWideRow from '../components/FormFieldWideRow'
import FormFieldAlertRow from '../components/FormFieldAlertRow'
import FormFieldValidator from '../components/FormFieldValidator'

const MyFollows = () => {
  const [tasks, setTasks] = useState([])
  const [requestFailedMessage, setRequestFailedMessage] = useState('')

  useEffect(() => { window.scrollTo(0, 0) }, [])
  useEffect(() => {
    axios.get(config.api.getUriPrefix() + '/user/follows/tasks')
      .then(res => {
        const followedTasks = res.data.data.map((task) => ({
          ...task,
          isSubscribed: true
        }))
        setTasks(followedTasks)
        setRequestFailedMessage('')
      })
      .catch(err => {
        setRequestFailedMessage(ErrorHandler(err))
      })
  }, [])

  return (
    <div id='metriq-main-content' className='container'>
      <ViewHeader>Your Followed Tasks</ViewHeader>
      <br />
      {tasks.length === 0 &&
        <p><b>You aren't following any tasks yet. Visit a Task page to follow one.</b></p>}
      {tasks.map((item, index) =>
        <FormFieldWideRow key={index}>
          <CategoryItemBox item={item} type='task' isLoggedIn />
        </FormFieldWideRow>)}
      <FormFieldAlertRow>
        <FormFieldValidator invalid={!!requestFailedMessage} message={requestFailedMessage} />
      </FormFieldAlertRow>
    </div>
  )
}

export default MyFollows
