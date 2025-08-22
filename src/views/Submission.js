import axios from 'axios'
import React, { Suspense } from 'react'
import { useParams, Link } from 'react-router-dom'
import config from './../config'
import ErrorHandler from './../components/ErrorHandler'
import EditButton from '../components/EditButton'
import TooltipTrigger from '../components/TooltipTrigger'
import { Button, Modal } from 'react-bootstrap'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faLink, faHeart, faMobileAlt, faStickyNote, faSuperscript, faBell, faBellSlash, faCode, faDownload } from '@fortawesome/free-solid-svg-icons'
import logo from './../images/metriq_logo_secondary_blue.png'
import FormFieldWideRow from '../components/FormFieldWideRow'
import SocialShareIcons from '../components/SocialShareIcons'
import { metricValueRegex, nonblankRegex } from '../components/ValidationRegex'
import ResultsTable from '../components/ResultsTable'
import FormFieldAlertRow from '../components/FormFieldAlertRow'
import SubscribeButton from '../components/SubscribeButton'
import ViewHeader from '../components/ViewHeader'
import SortingTable from '../components/SortingTable'
import { renderLatex } from '../components/RenderLatex'
const FormFieldRow = React.lazy(() => import('../components/FormFieldRow'))
const FormFieldTypeaheadRow = React.lazy(() => import('../components/FormFieldTypeaheadRow'))
const SubmissionRefsAddModal = React.lazy(() => import('../components/SubmissionRefsAddModal'))
const SubmissionRefsDeleteModal = React.lazy(() => import('../components/SubmissionRefsDeleteModal'))
const ResultsAddModal = React.lazy(() => import('../components/ResultsAddModal'))

library.add(faEdit, faLink, faHeart, faMobileAlt, faStickyNote, faSuperscript, faBell, faBellSlash, faCode, faDownload)

function withParams (Component) {
  return props => <Component {...props} params={useParams()} />
}

class Submission extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      submissionId: this.props.params.id,
      isValidated: false,
      requestFailedMessage: '',
      isArxiv: false,
      vanityUrl: '',
      bibtexUrl: '',
      thumbnailUrl: '',
      codeUrl: '',
      supplementUrl: '',
      evaluatedAt: '',
      authors: [],
      item: { id: this.props.params.id, isUpvoted: false, upvotesCount: 0, tags: [], tasks: [], methods: [], dataSets: [], platforms: [], results: [], user: [] },
      allNames: [],
      filteredNames: [],
      metricNames: [],
      methodNames: [],
      taskNames: [],
      tagNames: [],
      allMethodNames: [],
      allTaskNames: [],
      allTagNames: [],
      allDataSetNames: [],
      allPlatformNames: [],
      showAddRefsModal: false,
      showAddModal: false,
      showRemoveModal: false,
      showEditModal: false,
      showAccordion: false,
      modalMode: '',
      modalTextMode: '',
      submission: {
        description: '',
        thumbnailUrl: '',
        codeUrl: '',
        supplementUrl: ''
      },
      moderationReport: {
        description: ''
      },
      result: {
        id: '',
        task: '',
        method: '',
        dataSet: '',
        platform: '',
        metricName: '',
        metricValue: 0,
        isHigherBetter: false,
        evaluatedAt: ''
      },
      task: {
        name: '',
        fullName: '',
        parentTask: '',
        description: '',
        submissions: this.props.match.params.id
      },
      method: {
        name: '',
        fullName: '',
        description: '',
        submissions: this.props.match.params.id
      },
      dataSet: {
        name: '',
        fullName: '',
        parentPlatform: '',
        description: '',
        submissions: this.props.match.params.id
      },
      platform: {
        name: '',
        fullName: '',
        parentPlatform: '',
        description: '',
        submissions: this.props.match.params.id
      },
      taskId: '',
      methodId: '',
      dataSetId: '',
      platformId: '',
      tag: ''
    }

    this.fetchData = this.fetchData.bind(this)
    this.handleEditSubmissionDetails = this.handleEditSubmissionDetails.bind(this)
    this.handleSubscribe = this.handleSubscribe.bind(this)
    this.handleModerationReport = this.handleModerationReport.bind(this)
    this.handleHideEditModal = this.handleHideEditModal.bind(this)
    this.handleEditModalDone = this.handleEditModalDone.bind(this)
    this.handleAccordionToggle = this.handleAccordionToggle.bind(this)
    this.handleUpVoteOnClick = this.handleUpVoteOnClick.bind(this)
    this.handleOnClickAdd = this.handleOnClickAdd.bind(this)
    this.handleOnClickAddRef = this.handleOnClickAddRef.bind(this)
    this.handleOnClickRemove = this.handleOnClickRemove.bind(this)
    this.handleOnClickAddResult = this.handleOnClickAddResult.bind(this)
    this.handleOnClickEditResult = this.handleOnClickEditResult.bind(this)
    this.handleHideAddModal = this.handleHideAddModal.bind(this)
    this.handleHideRemoveModal = this.handleHideRemoveModal.bind(this)
    this.handleAddModalSubmit = this.handleAddModalSubmit.bind(this)
    this.handleModalRefSubmit = this.handleModalRefSubmit.bind(this)
    this.handleRemoveModalDone = this.handleRemoveModalDone.bind(this)
    this.handleModalRefAddNew = this.handleModalRefAddNew.bind(this)
    this.handleModalResultAddNew = this.handleModalResultAddNew.bind(this)
    this.handleOnChange = this.handleOnChange.bind(this)
    this.handleSortNames = this.handleSortNames.bind(this)
    this.handleTrimTasks = this.handleTrimTasks.bind(this)
    this.handleTrimParentTasks = this.handleTrimParentTasks.bind(this)
    this.handleTrimMethods = this.handleTrimMethods.bind(this)
    this.handleTrimDataSets = this.handleTrimDataSets.bind(this)
    this.handleTrimPlatforms = this.handleTrimPlatforms.bind(this)
    this.handleTrimTags = this.handleTrimTags.bind(this)
    this.isAllValid = this.isAllValid.bind(this)
    this.handleLoginRedirect = this.handleLoginRedirect.bind(this)
    this.handlePublishOnClick = this.handlePublishOnClick.bind(this)
  }

  handleLoginRedirect () {
    this.props.history.push('/Login/' + encodeURIComponent('Submission/' + this.props.match.params.id))
  }

  handleEditSubmissionDetails () {
    let mode = 'Edit'
    if (!this.props.isLoggedIn) {
      mode = 'Login'
    }
    const submission = {
      thumbnailUrl: this.state.item.thumbnailUrl,
      description: this.state.item.description,
      codeUrl: this.state.item.codeUrl,
      supplementUrl: this.state.item.supplementUrl
    }
    this.setState({ showEditModal: true, modalMode: mode, submission })
  }

  handleSubscribe () {
    if (this.props.isLoggedIn) {
      axios.post(config.api.getUriPrefix() + '/submission/' + this.props.match.params.id + '/subscribe', {})
        .then(res => {
          this.setState({ item: res.data.data })
        })
        .catch(err => {
          window.alert('Error: ' + ErrorHandler(err) + '\nSorry! Check your connection and login status, and try again.')
        })
    } else {
      this.handleLoginRedirect()
    }
  }

  handleModerationReport () {
    let mode = 'Moderation'
    const modalTextMode = 'Moderation'
    if (!this.props.isLoggedIn) {
      mode = 'Login'
    }
    const submission = {
      thumbnailUrl: this.state.item.thumbnailUrl,
      description: this.state.item.description,
      codeUrl: this.state.item.codeUrl,
      supplementUrl: this.state.item.supplementUrl
    }
    this.setState({ showEditModal: true, modalMode: mode, modalTextMode, submission })
  }

  handleHideEditModal () {
    this.setState({ showEditModal: false })
  }

  handleEditModalDone () {
    if (!this.props.isLoggedIn) {
      this.handleLoginRedirect()
      return
    }

    const isModerationReport = (this.state.modalMode === 'Moderation')

    const reqBody = {}
    if (isModerationReport) {
      reqBody.description = this.state.moderationReport.description
    } else {
      reqBody.thumbnailUrl = this.state.submission.thumbnailUrl
      reqBody.codeUrl = this.state.submission.codeUrl
      reqBody.supplementUrl = this.state.submission.supplementUrl
      reqBody.description = this.state.submission.description
    }

    let requestUrl = config.api.getUriPrefix() + '/submission/' + this.props.match.params.id
    if (isModerationReport) {
      requestUrl = requestUrl + '/report'
    }

    axios.post(requestUrl, reqBody)
      .then(res => {
        if (isModerationReport) {
          window.alert('Thank you, your report has been submitted to the moderators. They will contact you via your Metriq account email, if further action is necessary.')
          this.setState({ showEditModal: false })
        } else {
          this.setState({ item: res.data.data, showEditModal: false })
        }
      })
      .catch(err => {
        window.alert('Error: ' + ErrorHandler(err) + '\nSorry! Check your connection and login status, and try again.')
      })
  }

  handleAccordionToggle () {
    this.setState({ showAccordion: !this.state.showAccordion, isValidated: false })
  }

  handleOnChange (key1, key2, value) {
    if (!value && value !== false && value !== 0) {
      value = null
    }
    if (key1) {
      const k1 = this.state[key1]
      k1[key2] = value
      this.setState({ [key1]: k1, isValidated: false })
    } else {
      this.setState({ [key2]: value, isValidated: false })
    }
  }

  handleUpVoteOnClick (event) {
    if (this.props.isLoggedIn) {
      axios.post(config.api.getUriPrefix() + '/submission/' + this.props.match.params.id + '/upvote', {})
        .then(res => {
          this.setState({ item: res.data.data })
        })
        .catch(err => {
          window.alert('Error: ' + ErrorHandler(err) + '\nSorry! Check your connection and login status, and try again.')
        })
    } else {
      this.handleLoginRedirect()
    }
    event.preventDefault()
  }

  handleOnClickAddRef (mode) {
    let allNames = []
    let filteredNames = []
    if (!this.props.isLoggedIn) {
      mode = 'Login'
    } else if (mode === 'Task') {
      allNames = this.state.allTaskNames
      filteredNames = this.state.taskNames
    } else if (mode === 'Method') {
      allNames = this.state.allMethodNames
      filteredNames = this.state.methodNames
    } else if (mode === 'Data Set') {
      allNames = this.state.allDataSetNames
      filteredNames = this.state.dataSetNames
    } else if (mode === 'Platform') {
      allNames = this.state.allPlatformNames
      filteredNames = this.state.platformNames
    }
    this.setState({ showAddRefsModal: true, modalMode: mode, allNames, filteredNames })
  }

  handleModalRefAddNew (ref) {
    const mode = this.state.modalMode
    let allNames = []
    const item = this.state.item

    if (mode === 'Task') {
      allNames = this.state.allTaskNames
      allNames.push(ref)
      item.tasks.push(ref)
    } else if (mode === 'Method') {
      allNames = this.state.allMethodNames
      allNames.push(ref)
      item.methods.push(ref)
    } else if (mode === 'Data Set') {
      allNames = this.state.allDataSetNames
      allNames.push(ref)
      item.platforms.push(ref)
    } else if (mode === 'Platform') {
      allNames = this.state.allPlatformNames
      allNames.push(ref)
      item.platforms.push(ref)
    } else {
      return
    }

    this.handleSortNames(allNames)
    const filteredNames = [...allNames]

    if (mode === 'Task') {
      this.handleTrimTasks(this.state.item, filteredNames)
      this.setState({ showAddRefsModal: false, item, allTaskNames: allNames, taskNames: filteredNames })
    } else if (mode === 'Method') {
      this.handleTrimMethods(this.state.item, filteredNames)
      this.setState({ showAddRefsModal: false, item, allMethodNames: allNames, methodNames: filteredNames })
    } else if (mode === 'Data Set') {
      this.handleTrimDataSets(this.state.item, filteredNames)
      this.setState({ showAddRefsModal: false, item, allDataSetNames: allNames, dataSetNames: filteredNames })
    } else if (mode === 'Platform') {
      this.handleTrimPlatforms(this.state.item, filteredNames)
      this.setState({ showAddRefsModal: false, item, allPlatformNames: allNames, platformNames: filteredNames })
    }
  }

  handleModalResultAddNew (submission) {
    this.setState({ showAddModal: false, item: submission, requestFailedMessage: '' })
  }

  handleModalRefSubmit (submission) {
    this.setState({ showAddRefsModal: false, item: submission, requestFailedMessage: '' })
  }

  handleOnClickAdd (mode) {
    if (!this.props.isLoggedIn) {
      mode = 'Login'
    }
    this.setState({ showAddModal: true, modalMode: mode })
  }

  handleOnClickRemove (mode) {
    if (!this.props.isLoggedIn) {
      mode = 'Login'
    }
    this.setState({ showRemoveModal: true, modalMode: mode })
  }

  handleOnClickAddResult () {
    let mode = 'Result'
    if (!this.props.isLoggedIn) {
      mode = 'Login'
    }
    const result = {
      id: '',
      task: '',
      method: '',
      dataSet: '',
      platform: '',
      metricName: '',
      metricValue: 0,
      isHigherBetter: false,
      evaluatedAt: ''
    }
    this.setState({ result, showAddModal: true, modalMode: mode, showEditModal: mode === 'Login' })
  }

  handleOnClickEditResult (resultId) {
    let mode = 'Result'
    if (!this.props.isLoggedIn) {
      mode = 'Login'
    }
    let nResult = {}
    for (let i = 0; i < this.state.item.results.length; i++) {
      if (this.state.item.results[i].id === resultId) {
        const result = { ...this.state.item.results[i] }
        result.submissionId = this.state.item.id
        result.task = result.task.id
        result.method = result.method.id
        if (result.dataSet) {
          result.dataSet = result.dataSet.id
        }
        if (result.platform) {
          result.platform = result.platform.id
        }
        nResult = result
        break
      }
    }
    this.setState({ result: nResult, showAddModal: true, modalMode: mode, showEditModal: mode === 'Login' })
  }

  handleHideAddModal () {
    this.setState({ showAddModal: false })
  }

  handleHideRemoveModal () {
    this.setState({ showRemoveModal: false })
  }

  handleAddModalSubmit () {
    if (!this.props.isLoggedIn) {
      this.handleLoginRedirect()
      return
    }

    axios.post(config.api.getUriPrefix() + '/submission/' + this.props.match.params.id + '/tag/' + this.state.tag, {})
      .then(res => {
        const submission = res.data.data
        const tags = [...this.state.tagNames]
        for (let j = 0; j < tags.length; j++) {
          if (this.state.tag === tags[j].name) {
            tags.splice(j, 1)
            break
          }
        }
        this.setState({ requestFailedMessage: '', tagNames: tags, item: submission })
      })
      .catch(err => {
        window.alert('Error: ' + ErrorHandler(err) + '\nSorry! Check your connection and login status, and try again.')
      })

    this.setState({ showAddModal: false })
  }

  handleRemoveModalDone () {
    this.setState({ showRemoveModal: false })
  }

  handleSortNames (names) {
    names.sort(function (a, b) {
      if (a.name.toLowerCase() < b.name.toLowerCase()) return -1
      if (a.name.toLowerCase() > b.name.toLowerCase()) return 1
      return 0
    })
  }

  handleTrimTasks (submission, tasks) {
    this.handleTrimParentTasks(tasks)
    for (let i = 0; i < submission.tasks.length; i++) {
      for (let j = 0; j < tasks.length; j++) {
        if (submission.tasks[i].id === tasks[j].id) {
          tasks.splice(j, 1)
          break
        }
      }
    }
  }

  handleTrimParentTasks (tasks) {
    for (let j = 0; j < tasks.length; j++) {
      if (tasks[j].top) {
        tasks.splice(j, 1)
        --j
      }
    }
  }

  handleTrimMethods (submission, methods) {
    for (let i = 0; i < submission.methods.length; i++) {
      for (let j = 0; j < methods.length; j++) {
        if (submission.methods[i].id === methods[j].id) {
          methods.splice(j, 1)
          break
        }
      }
    }
  }

  handleTrimDataSets (submission, dataSets) {
    for (let i = 0; i < submission.dataSets.length; i++) {
      for (let j = 0; j < dataSets.length; j++) {
        if (submission.dataSets[i].id === dataSets[j].id) {
          dataSets.splice(j, 1)
          break
        }
      }
    }
  }

  handleTrimPlatforms (submission, platforms) {
    for (let i = 0; i < submission.platforms.length; i++) {
      for (let j = 0; j < platforms.length; j++) {
        if (submission.platforms[i].id === platforms[j].id) {
          platforms.splice(j, 1)
          break
        }
      }
    }
  }

  handleTrimTags (submission, tags) {
    for (let i = 0; i < submission.tags.length; i++) {
      for (let j = 0; j < tags.length; j++) {
        if (submission.tags[i].id === tags[j].id) {
          tags.splice(j, 1)
          break
        }
      }
    }
  }

  isAllValid () {
    if (this.state.modalMode === 'Result') {
      if (!nonblankRegex.test(this.state.result.metricName)) {
        return false
      }
      if (!metricValueRegex.test(this.state.result.metricValue)) {
        return false
      }
    }

    return true
  }

  handlePublishOnClick (event) {
    const confirmBool = window.confirm('To publish your submission, hit "OK." (You can\'t "unpublish" your submission after that point, only delete it.)\n')
    if (confirmBool) {
      const submission = { ...(this.state.item) }
      submission.isPublished = true
      submission.tags = undefined
      submission.tasks = undefined
      submission.methods = undefined
      submission.dataSets = undefined
      submission.platforms = undefined
      axios.post(config.api.getUriPrefix() + '/submission/' + this.state.item.id, submission)
        .then(res => {
          window.alert('This submission has now been published! Thank you!')
          this.setState({ item: res.data.data })
        })
        .catch(err => {
          window.alert('Error: ' + ErrorHandler(err) + '\nSorry! Check your connection and login status, and try again.')
        })
    } else {
      window.alert('The submission was not published. (Please enter the correct submission name, to publish.)')
    }
    event.preventDefault()
  }

  fetchData (id) {
    window.scrollTo(0, 0)

    const submissionRoute = config.api.getUriPrefix() + '/submission/' + id
    axios.get(submissionRoute)
      .then(subRes => {
        const submission = subRes.data.data

        let isArxiv = false
        let vanityUrl = ''
        let bibtexUrl = ''
        const thumbnailUrl = submission.thumbnailUrl
        const codeUrl = submission.codeUrl
        const supplementUrl = submission.supplementUrl
        const url = submission.contentUrl
        if (url.toLowerCase().startsWith('https://arxiv.org/')) {
          isArxiv = true
          let urlTail = url.substring(18)
          vanityUrl = 'https://www.arxiv-vanity.com/' + urlTail
          urlTail = urlTail.substring(4)
          bibtexUrl = 'https://arxiv.org/bibtex/' + urlTail

          axios.get('https://export.arxiv.org/api/query?id_list=' + urlTail)
            .then((response) => {
              const html = response.data.toString()
              const noHead = html.split('<published>')[1]
              const noTail = noHead.split('</published>')[0]
              const authorsSection = noHead.split('<author>')
              const authors = []
              for (let i = 1; i < authorsSection.length; ++i) {
                const name = (((authorsSection[i].split('<name>'))[1]).split('</name>'))[0]
                authors.push(name)
              }
              this.setState({ evaluatedAt: (new Date(noTail).toISOString().split('T')[0]), authors })
            })
            .catch(err => {
              this.setState({ requestFailedMessage: ErrorHandler(err) })
            })
        }

        // Just get the view populated as quickly as possible, before we "trim."
        this.setState({
          requestFailedMessage: '',
          item: submission,
          isArxiv,
          vanityUrl,
          thumbnailUrl,
          bibtexUrl,
          codeUrl,
          supplementUrl
        })

        const taskNamesRoute = config.api.getUriPrefix() + '/task/names'
        axios.get(taskNamesRoute)
          .then(res => {
            this.handleSortNames(res.data.data)
            const tasks = [...res.data.data]
            this.handleTrimTasks(submission, tasks)

            let defTask = ''
            if (tasks.length) {
              defTask = tasks[0].id
            }

            this.setState({ requestFailedMessage: '', allTaskNames: res.data.data, taskNames: tasks, taskId: defTask })
          })
          .catch(err => {
            this.setState({ requestFailedMessage: ErrorHandler(err) })
          })

        const methodNamesRoute = config.api.getUriPrefix() + '/method/names'
        axios.get(methodNamesRoute)
          .then(res => {
            this.handleSortNames(res.data.data)
            const methods = [...res.data.data]
            this.handleTrimMethods(submission, methods)

            let defMethod = ''
            if (methods.length) {
              defMethod = methods[0].id
            }

            this.setState({ requestFailedMessage: '', allMethodNames: res.data.data, methodNames: methods, methodId: defMethod })
          })
          .catch(err => {
            this.setState({ requestFailedMessage: ErrorHandler(err) })
          })

        const dataSetNamesRoute = config.api.getUriPrefix() + '/dataSet/names'
        axios.get(dataSetNamesRoute)
          .then(res => {
            this.handleSortNames(res.data.data)
            const dataSets = [...res.data.data]
            this.handleTrimDataSets(submission, dataSets)

            let defDataSet = ''
            if (dataSets.length) {
              defDataSet = dataSets[0].id
            }

            this.setState({ requestFailedMessage: '', allDataSetNames: res.data.data, dataSetNames: dataSets, dataSetId: defDataSet })
          })
          .catch(err => {
            this.setState({ requestFailedMessage: ErrorHandler(err) })
          })

        const platformNamesRoute = config.api.getUriPrefix() + '/platform/names'
        axios.get(platformNamesRoute)
          .then(res => {
            this.handleSortNames(res.data.data)
            const platforms = [...res.data.data]
            this.handleTrimPlatforms(submission, platforms)

            let defPlatform = ''
            if (platforms.length) {
              defPlatform = platforms[0].id
            }

            this.setState({ requestFailedMessage: '', allPlatformNames: res.data.data, platformNames: platforms, platformId: defPlatform })
          })
          .catch(err => {
            this.setState({ requestFailedMessage: ErrorHandler(err) })
          })

        const tagNamesRoute = config.api.getUriPrefix() + '/tag/names'
        axios.get(tagNamesRoute)
          .then(res => {
            const tags = [...res.data.data]
            this.handleTrimTags(submission, tags)

            this.setState({ requestFailedMessage: '', allTagNames: res.data.data, tagNames: tags })
          })
          .catch(err => {
            this.setState({ requestFailedMessage: ErrorHandler(err) })
          })
      })
      .catch(err => {
        this.setState({ requestFailedMessage: ErrorHandler(err) })
      })

    const metricNameRoute = config.api.getUriPrefix() + '/result/metricNames'
    axios.get(metricNameRoute)
      .then(subRes => {
        const metricNames = subRes.data.data
        this.setState({ metricNames })
      })
      .catch(err => {
        this.setState({ requestFailedMessage: ErrorHandler(err) })
      })
  }

  componentDidMount () {
    const { id } = this.props.params
    this.setState({ submissionId: id })
    this.fetchData(id)
  }

  componentDidUpdate (prevProps) {
    const { id } = this.props.params
    if (this.state.submissionId !== id) {
      this.setState({ submissionId: id })
      this.fetchData(id)
    }
  }

  render () {
    return (
      <div id='metriq-main-content' className='container submission-detail-container'>
        <FormFieldWideRow>
          <ViewHeader>{this.state.item.name}</ViewHeader>
        </FormFieldWideRow>
        <div className='text-center'>
          <a href={this.state.item.contentUrl}>
            <img src={this.state.item.thumbnailUrl ? this.state.item.thumbnailUrl : logo} alt='Submission thumbnail' className='submission-detail-image' />
          </a>
        </div>
        <FormFieldWideRow>
          <div className='submission-description'>
            <b>Submitted by <Link to={'/User/' + this.state.item.userId + '/Submissions'}>{this.state.item.user.username}</Link> on {(this.state.item.createdAt ? new Date(this.state.item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '') + (this.state.isArxiv ? ', arXiv:' + this.state.item.contentUrl.split('/abs/')[1] + ', authored by ' + this.state.authors.join(', ') : '')}</b>
          </div>
        </FormFieldWideRow>
        <FormFieldWideRow>
          <div className='submission-description'>
            {this.state.item.description
              ? renderLatex(this.state.item.description)
              : <div className='card bg-light'><div className='card-body'><i>(No description provided.)</i><button className='btn btn-link' onClick={this.handleEditSubmissionDetails}>Add one.</button></div></div>}
          </div>
        </FormFieldWideRow>
        <FormFieldWideRow>
          <TooltipTrigger message='Upvote submission'>
            <Button className='submission-button' variant={this.state.item.isUpvoted ? 'primary' : 'secondary'} aria-label={(this.state.item.isUpvoted ? 'Cancel like' : 'Like')} onClick={this.handleUpVoteOnClick}><FontAwesomeIcon icon='heart' /> {this.state.item.upvotesCount}</Button>
          </TooltipTrigger>
          <TooltipTrigger message='Submission link'>
            <Button className='submission-button' variant='secondary' aria-label='Visit submission link' onClick={() => { if (/^https?:\/\//i.test(this.state.item.contentUrl)) { window.open(this.state.item.contentUrl, '_blank', 'noopener,noreferrer') } }}><FontAwesomeIcon icon={faLink} /></Button>
          </TooltipTrigger>
          {this.state.isArxiv &&
            <span>
              <TooltipTrigger message='Mobile view preprint'>
                <Button className='submission-button' variant='secondary' aria-label='Visit submission mobile view link' onClick={() => { if (/^https?:\/\//i.test(this.state.vanityUrl)) { window.open(this.state.vanityUrl, '_blank', 'noopener,noreferrer') } }}><FontAwesomeIcon icon={faMobileAlt} /></Button>
              </TooltipTrigger>
              <TooltipTrigger message='BibTex reference'>
                <Button className='submission-button' variant='secondary' aria-label='Get arXiv BibTex reference' onClick={() => { if (/^https?:\/\//i.test(this.state.bibtexUrl)) { window.open(this.state.bibtexUrl, '_blank', 'noopener,noreferrer') } }}><FontAwesomeIcon icon={faSuperscript} /></Button>
              </TooltipTrigger>
            </span>}
          {this.state.codeUrl &&
            <TooltipTrigger message='Code link'>
              <Button className='submission-button' variant='secondary' aria-label='Visit code link' onClick={() => { if (/^https?:\/\//i.test(this.state.codeUrl)) { window.open(this.state.codeUrl, '_blank', 'noopener,noreferrer') } }}><FontAwesomeIcon icon={faCode} /></Button>
            </TooltipTrigger>}
          {this.state.supplementUrl &&
            <TooltipTrigger message='Supplement link'>
              <Button className='submission-button' variant='secondary' aria-label='Visit code link' onClick={() => { if (/^https?:\/\//i.test(this.state.supplementUrl)) { window.open(this.state.supplementUrl, '_blank', 'noopener,noreferrer') } }}><FontAwesomeIcon icon={faDownload} /></Button>
            </TooltipTrigger>}
          <TooltipTrigger message='Edit submission'>
            <Button className='submission-button' variant='secondary' aria-label='Edit submission' onClick={this.handleEditSubmissionDetails}><FontAwesomeIcon icon='edit' /></Button>
          </TooltipTrigger>
          <SubscribeButton isSubscribed={this.state.item.isSubscribed} type='submission' item={this.state.item} isLoggedIn={this.props.isLoggedIn} />
          {!this.state.item.publishedAt &&
            <TooltipTrigger message='Publish submission'>
              <Button className='submission-button' variant='danger' aria-label='Publish submission' onClick={this.handlePublishOnClick}>Publish</Button>
            </TooltipTrigger>}
          <SocialShareIcons url={config.web.getUriPrefix() + '/submission/' + this.props.match.params.id} />
        </FormFieldWideRow>
        <br />
        <div className='row'>
          <div className='col-md-6'>
            <div className='card taxonomy-card'>
              <div className='card-title'>
                <h5>Methods
                  <EditButton
                    className='float-end edit-button btn'
                    onClickAdd={() => this.handleOnClickAddRef('Method')}
                    onClickRemove={() => this.handleOnClickRemove('Method')}
                  />
                </h5>
                <small><i>Methods can be techniques, protocols, or procedures</i></small>
                <hr />
              </div>
              <div className='card-text'>
                {(this.state.item.methods.length > 0) &&
                  <SortingTable
                    columns={[{
                      title: 'Method',
                      key: 'name',
                      width: 700
                    }]}
                    data={this.state.item.methods.map(row =>
                      ({
                        key: row.id,
                        name: row.name
                      }))}
                    onRowClick={(record) => this.props.history.push('/Method/' + record.key)}
                    tableLayout='auto'
                    rowClassName='link'
                    showHeader={false}
                  />}
                {(this.state.item.methods.length === 0) &&
                  <div className='card bg-light'>
                    <div className='card-body'>There are no associated methods, yet.</div>
                  </div>}
              </div>
            </div>
            <div className='card taxonomy-card'>
              <div className='card-title'>
                <h5>Platforms
                  <EditButton
                    className='float-end edit-button btn'
                    onClickAdd={() => this.handleOnClickAddRef('Platform')}
                    onClickRemove={() => this.handleOnClickRemove('Platform')}
                  />
                </h5>
                <small><i>Platforms refer to real or simulated hardware & software environments</i></small>
                <hr />
              </div>
              <div className='card-text'>
                {(this.state.item.platforms.length > 0) &&
                  <SortingTable
                    columns={[{
                      title: 'Platform',
                      key: 'name',
                      width: 700
                    }]}
                    data={this.state.item.platforms.map(row =>
                      ({
                        key: row.id,
                        name: row.name
                      }))}
                    onRowClick={(record) => this.props.history.push('/Platform/' + record.key)}
                    tableLayout='auto'
                    rowClassName='link'
                    showHeader={false}
                  />}
                {(this.state.item.platforms.length === 0) &&
                  <div className='card bg-light'>
                    <div className='card-body'>There are no associated platforms, yet.</div>
                  </div>}
              </div>
            </div>
          </div>
          <div className='col-md-6'>
            <div className='card taxonomy-card'>
              <div className='card-title'>
                <h5>Tasks
                  <EditButton
                    className='float-end edit-button btn'
                    onClickAdd={() => this.handleOnClickAddRef('Task')}
                    onClickRemove={() => this.handleOnClickRemove('Task')}
                  />
                </h5>
                <small><i>Tasks are the goal of a given benchmark, e.g., an end application</i></small>
                <hr />
              </div>
              <div className='card-text'>
                {(this.state.item.tasks.length > 0) &&
                  <SortingTable
                    columns={[{
                      title: 'Task',
                      key: 'name',
                      width: 700
                    }]}
                    data={this.state.item.tasks.map(row =>
                      ({
                        key: row.id,
                        name: row.name
                      }))}
                    onRowClick={(record) => this.props.history.push('/Task/' + record.key)}
                    tableLayout='auto'
                    rowClassName='link'
                    showHeader={false}
                  />}
                {(this.state.item.tasks.length === 0) &&
                  <div className='card bg-light'>
                    <div className='card-body'>There are no associated tasks, yet.</div>
                  </div>}
              </div>
            </div>
            <div className='card taxonomy-card'>
              <div className='card-title'>
                <h5>Data Sets
                  <EditButton
                    className='float-end edit-button btn'
                    onClickAdd={() => this.handleOnClickAddRef('Data Set')}
                    onClickRemove={() => this.handleOnClickRemove('Data Set')}
                  />
                </h5>
                <small><i>Data Sets refer to specific settings or data for the task</i></small>
                <hr />
              </div>
              <div className='card-text'>
                {(this.state.item.dataSets.length > 0) &&
                  <SortingTable
                    columns={[{
                      title: 'Data Set',
                      key: 'name',
                      width: 700
                    }]}
                    data={this.state.item.dataSets.map(row =>
                      ({
                        key: row.id,
                        name: row.name
                      }))}
                    onRowClick={(record) => this.props.history.push('/DataSet/' + record.key)}
                    tableLayout='auto'
                    rowClassName='link'
                    showHeader={false}
                  />}
                {(this.state.item.dataSets.length === 0) &&
                  <div className='card bg-light'>
                    <div className='card-body'>There are no associated data sets, yet.</div>
                  </div>}
              </div>
            </div>
            <div className='card taxonomy-card card-body'>
              <div className='card-title'>
                <h5>Tags
                  <EditButton
                    className='float-end edit-button btn'
                    onClickAdd={() => this.handleOnClickAdd('Tag')}
                    onClickRemove={() => this.handleOnClickRemove('Tag')}
                  />
                </h5>
                <small><i>Use tags to classify and discover the state of the art</i></small>
                <hr />
              </div>
              <div className='card-text'>
                {(this.state.item.tags.length > 0) &&
                    this.state.item.tags.map((tag, ind) => <span key={tag.id}>{ind > 0 && <span> • </span>}<Link to={'/Tag/' + tag.name}><span className='link'>{tag.name}</span></Link></span>)}
                {(this.state.item.tags.length === 0) &&
                  <div className='card bg-light'>
                    <div className='card-body'>There are no associated tags, yet.</div>
                  </div>}
              </div>
            </div>
          </div>
        </div>
        <ResultsTable
          results={this.state.item.results}
          onClickAdd={this.handleOnClickAddResult}
          onClickRemove={() => this.handleOnClickRemove('Result')}
          onClickEdit={this.handleOnClickEditResult}
        />
        <br />
        <FormFieldWideRow>
          <hr />
          <div className='text-center'>
            Notice something about this submission that needs moderation? <span className='link' onClick={this.handleModerationReport}>Let us know.</span>
          </div>
        </FormFieldWideRow>
        <Suspense fallback={<span />}>
          <SubmissionRefsAddModal
            show={this.state.showAddRefsModal}
            onHide={() => this.setState({ showAddRefsModal: false })}
            modalMode={this.state.modalMode}
            submissionId={this.props.match.params.id}
            allNames={this.state.allNames}
            filteredNames={this.state.filteredNames}
            onAddExisting={this.handleModalRefSubmit}
            onAddNew={this.handleModalRefAddNew}
          />
          <SubmissionRefsDeleteModal
            show={this.state.showRemoveModal}
            onHide={this.handleHideRemoveModal}
            modalMode={this.state.modalMode}
            submission={this.state.item}
            onSubmit={this.handleModalRefSubmit}
          />
          <ResultsAddModal
            show={this.state.showAddModal && (this.state.modalMode === 'Result')}
            onHide={this.handleHideAddModal}
            submission={this.state.item}
            result={this.state.result}
            evaluatedAt={this.state.evaluatedAt}
            metricNames={this.state.metricNames}
            onAddOrEdit={this.handleModalResultAddNew}
          />
        </Suspense>
        <Modal
          show={this.state.showAddModal && ((this.state.modalMode === 'Tag') || (this.state.modalMode === 'Login'))}
          onHide={this.handleHideAddModal}
          size='lg'
          aria-labelledby='contained-modal-title-vcenter'
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Add Tag</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {(this.state.modalMode === 'Login') &&
              <span>
                Please <Link to={'/Login/' + encodeURIComponent('Submission/' + this.props.submissionId)}>login</Link> before editing.
              </span>}
            {(this.state.modalMode !== 'Login') &&
              <Suspense fallback={<div>Loading...</div>}>
                <FormFieldTypeaheadRow
                  inputName='tag' label='Tag'
                  onChange={(field, value) => this.handleOnChange('', field, value)}
                  validRegex={nonblankRegex}
                  options={this.state.tagNames.map(item => item.name)}
                  tooltip='A "tag" can be any string that loosely categorizes a submission by relevant topic.'
                />
              </Suspense>}
            <br />
            <div className='text-center'><br /><b>(Mouse-over or tap labels for explanation.)</b></div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant='primary' onClick={this.handleAddModalSubmit} disabled={!this.state.isValidated && !this.isAllValid()}>Add</Button>
          </Modal.Footer>
        </Modal>
        <Modal
          show={this.state.showEditModal}
          onHide={this.handleHideEditModal}
          size='lg'
          aria-labelledby='contained-modal-title-vcenter'
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>{this.state.modalTextMode === 'Moderation' ? 'Report' : 'Edit'} Submission</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {(this.state.modalMode === 'Login') &&
              <span>
                Please <Link to={'/Login/' + encodeURIComponent('Submission/' + this.props.match.params.id)}>login</Link> before {this.state.modalTextMode === 'Moderation' ? 'filing a report' : 'editing'}.
              </span>}
            {(this.state.modalMode !== 'Login') &&
              <span>
                {(this.state.modalMode === 'Moderation') &&
                  <div>
                    <div>
                      <b>Remember that any logged in user can edit any submission. However, if editing won't address the issue, please describe for a moderator what's wrong.</b>
                    </div>
                    <br />
                  </div>}
                <Suspense fallback={<div>Loading...</div>}>
                  {(this.state.modalMode === 'Moderation') &&
                    <FormFieldRow
                      inputName='description' inputType='textarea' label='Description' rows='12'
                      value={this.state.moderationReport.description}
                      onChange={(field, value) => this.handleOnChange('moderationReport', field, value)}
                    />}
                  {(this.state.modalMode !== 'Moderation') &&
                    <div>
                      <FormFieldRow
                        inputName='thumbnailUrl' inputType='text' label='Image URL' imageUrl
                        value={this.state.submission.thumbnailUrl}
                        onChange={(field, value) => this.handleOnChange('submission', field, value)}
                      />
                      <FormFieldAlertRow className='text-center'>
                        <b>The image URL is loaded as a thumbnail, for the submission. (For free image hosting, see <a href='https://imgbb.com/' target='_blank' rel='noreferrer'>https://imgbb.com/</a>, for example.)</b>
                      </FormFieldAlertRow>
                      <FormFieldRow
                        inputName='codeUrl' inputType='text' label='Code URL'
                        value={this.state.submission.codeUrl}
                        onChange={(field, value) => this.handleOnChange('submission', field, value)}
                      />
                      <FormFieldAlertRow className='text-center'>
                        <b>The code URL is for any code associated with the submission.</b>
                      </FormFieldAlertRow>
                      <FormFieldRow
                        inputName='supplementUrl' inputType='text' label='Supplement URL'
                        value={this.state.submission.supplementUrl}
                        onChange={(field, value) => this.handleOnChange('submission', field, value)}
                      />
                      <FormFieldAlertRow className='text-center'>
                        <b>The supplement URL is for any supplemental materials associated with the submission, (such as a DOI).</b>
                      </FormFieldAlertRow>
                      <FormFieldRow
                        inputName='description' inputType='textarea' label='Description' rows='12'
                        value={this.state.submission.description}
                        onChange={(field, value) => this.handleOnChange('submission', field, value)}
                      />
                    </div>}
                </Suspense>
              </span>}
          </Modal.Body>
          <Modal.Footer>
            {(this.state.modalMode === 'Login') && <Button variant='primary' onClick={this.handleHideEditModal}>Cancel</Button>}
            {(this.state.modalMode !== 'Login') && <Button variant='primary' onClick={this.handleEditModalDone}>Submit</Button>}
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}

export default withParams(Submission)
