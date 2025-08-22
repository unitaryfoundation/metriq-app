import axios from 'axios'
import React, { Suspense } from 'react'
import config from './../config'
import FormFieldAlertRow from '../components/FormFieldAlertRow'
import FormFieldRow from '../components/FormFieldRow'
import FormFieldRowDeleter from '../components/FormFieldRowDeleter'
import FormFieldTypeaheadRow from '../components/FormFieldTypeaheadRow'
import FormFieldValidator from '../components/FormFieldValidator'
import ErrorHandler from '../components/ErrorHandler'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import FormFieldWideRow from '../components/FormFieldWideRow'
import ViewHeader from '../components/ViewHeader'
import { Redirect } from 'react-router-dom'
import { blankOrurlValidRegex, nonblankRegex, urlValidRegex } from '../components/ValidationRegex'
import SubmissionRefsAddModal from '../components/SubmissionRefsAddModal'
import { Button } from 'react-bootstrap'
import ResultsTable from '../components/ResultsTable'
import ResultsAddModal from '../components/ResultsAddModal'
import SubmissionRefsDeleteModal from '../components/SubmissionRefsDeleteModal'
import TooltipTrigger from '../components/TooltipTrigger'

library.add(faPlus)

const requiredFieldMissingError = 'Required field.'
const invalidUrlError = 'Invalid URL.'

class AddSubmission extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      submission: { id: 0, results: [], tasks: [], methods: [], platforms: [] },
      draftedAt: (new Date()).toLocaleTimeString(),
      isAlreadyInDatabase: false,
      name: '',
      contentUrl: '',
      codeUrl: '',
      supplementUrl: '',
      thumbnailUrl: '',
      description: '',
      tasks: [],
      task: '',
      taskNames: [],
      methods: [],
      method: '',
      methodNames: [],
      platforms: [],
      platform: '',
      platformNames: [],
      tags: [],
      tag: '',
      tagNames: [],
      result: {
        id: '',
        task: '',
        method: '',
        platform: '',
        metricName: '',
        metricValue: 0,
        isHigherBetter: false,
        evaluatedDate: new Date()
      },
      allNames: [],
      showAddRefsModal: false,
      showAddModal: false,
      showRemoveModal: false,
      requestFailedMessage: '',
      isValidated: false
    }

    this.handleOnChange = this.handleOnChange.bind(this)
    this.handleOnFieldBlur = this.handleOnFieldBlur.bind(this)
    this.isAllValid = this.isAllValid.bind(this)
    this.handleOnSubmit = this.handleOnSubmit.bind(this)
    this.handleOnClickRemoveTag = this.handleOnClickRemoveTag.bind(this)
    this.handleOnClickAddTag = this.handleOnClickAddTag.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleOnClickRemoveTask = this.handleOnClickRemoveTask.bind(this)
    this.handleOnClickAddTask = this.handleOnClickAddTask.bind(this)
    this.handleOnClickNewTask = this.handleOnClickNewTask.bind(this)
    this.handleOnClickRemoveMethod = this.handleOnClickRemoveMethod.bind(this)
    this.handleOnClickAddMethod = this.handleOnClickAddMethod.bind(this)
    this.handleOnClickNewMethod = this.handleOnClickNewMethod.bind(this)
    this.handleOnClickRemovePlatform = this.handleOnClickRemovePlatform.bind(this)
    this.handleOnClickAddPlatform = this.handleOnClickAddPlatform.bind(this)
    this.handleOnClickNewPlatform = this.handleOnClickNewPlatform.bind(this)
    this.handleOnClickRemoveResult = this.handleOnClickRemoveResult.bind(this)
    this.handleOnClickNewResult = this.handleOnClickNewResult.bind(this)
    this.handleOnClickEditResult = this.handleOnClickEditResult.bind(this)
    this.handleModalRefSubmit = this.handleModalRefSubmit.bind(this)
    this.handleModalResultAddNew = this.handleModalResultAddNew.bind(this)
    this.handleModalRefAddNew = this.handleModalRefAddNew.bind(this)
  }

  handleModalRefAddNew (ref) {
    const mode = this.state.modalMode
    let allNames = []
    let names = []

    if (mode === 'Task') {
      allNames = this.state.taskNames
      names = this.state.tasks
      allNames.push(ref)
      names.push(ref)
    } else if (mode === 'Method') {
      allNames = this.state.methodNames
      names = this.state.methods
      allNames.push(ref)
      names.push(ref)
    } else if (mode === 'Platform') {
      allNames = this.state.platformNames
      names = this.state.platforms
      allNames.push(ref)
      names.push(ref)
    } else {
      return
    }

    this.handleSortNames(allNames)

    if (mode === 'Task') {
      this.setState({ showAddRefsModal: false, taskNames: allNames, tasks: names })
    } else if (mode === 'Method') {
      this.setState({ showAddRefsModal: false, methodNames: allNames, methods: names })
    } else if (mode === 'Platform') {
      this.setState({ showAddRefsModal: false, platformNames: allNames, platforms: names })
    }
  }

  handleOnChange (field, value) {
    // parent class change handler is always called with field name and value
    this.setState({ [field]: value, isValidated: false })
    this.handleOnFieldBlur(field, value)
  }

  handleOnFieldBlur (field, value) {
    if (!urlValidRegex.test((value.trim()))) {
      return
    }
    if (field === 'contentUrl') {
      axios.post(config.api.getUriPrefix() + '/pagemetadata', { url: value.trim() })
        .then(res => {
          const edid = res.data.data.ExistingDraftId
          if (edid && (window.confirm('You have an existing draft with this URL. Press "OK" to be redirected to this draft.') === true)) {
            this.props.history.push('/Submission/' + edid)
          }
          this.setState({ name: res.data.data.og.title, description: res.data.data.og.description.replace(/\n/g, ' '), isAlreadyInDatabase: res.data.data.isAlreadyInDatabase, isValidated: false })
        })
        .catch(err => {
          this.setState({ requestFailedMessage: ErrorHandler(err) })
        })
    }
  }

  isAllValid () {
    this.setState({ isValidated: true })

    let validatedPassed = true
    if (!urlValidRegex.test((this.state.contentUrl.trim()))) {
      this.setState({ requestFailedMessage: ErrorHandler({ response: { data: { message: 'Invalid content url' } } }) })
      validatedPassed = false
    }

    if (this.state.thumbnailUrl && !urlValidRegex.test(this.state.thumbnailUrl.trim())) {
      this.setState({ requestFailedMessage: ErrorHandler({ response: { data: { message: 'Invalid thumbnail url' } } }) })
      validatedPassed = false
    }

    if (this.state.isAlreadyInDatabase) {
      this.setState({ requestFailedMessage: ErrorHandler({ response: { data: { message: 'URL is already in database!' } } }) })
      validatedPassed = false
    }

    return validatedPassed
  }

  handleOnSubmit (event, isDraft, callback) {
    if (!this.isAllValid()) {
      if (event) {
        event.preventDefault()
      } else {
        window.alert('Please fill required fields with valid values, first.')
      }
      return false
    }

    if (this.state.contentUrl.toLowerCase().startsWith('https://arxiv.org/')) {
      const urlTail = this.state.contentUrl.substring(22)
      axios.get('https://export.arxiv.org/api/query?id_list=' + urlTail)
        .then((response) => {
          const html = response.data.toString()
          const noHead = html.split('<published>')[1]
          const noTail = noHead.split('</published>')[0]
          this.setState({ result: { ...this.state.result, evaluatedDate: new Date(noTail).toISOString().split('T')[0] } })
        })
        .catch(err => {
          this.setState({ requestFailedMessage: ErrorHandler(err) })
        })
    }

    const request = {
      name: this.state.name,
      contentUrl: this.state.contentUrl,
      codeUrl: this.state.codeUrl,
      supplementUrl: this.state.supplementUrl,
      thumbnailUrl: this.state.thumbnailUrl,
      description: this.state.description,
      tags: this.state.tags.join(','),
      tasks: this.state.tasks.map(x => x.id).join(','),
      methods: this.state.methods.map(x => x.id).join(','),
      platforms: this.state.platforms.map(x => x.id).join(','),
      isPublished: !isDraft
    }

    let url = ''
    if (this.state.submission.id) {
      url = config.api.getUriPrefix() + '/Submission/' + this.state.submission.id
    } else {
      url = config.api.getUriPrefix() + '/Submission'
    }

    axios.post(url, request)
      .then(res => {
        if (isDraft) {
          this.setState({ requestFailedMessage: '', submission: res.data.data, draftedAt: (new Date()).toLocaleTimeString() })
          if (callback) {
            callback()
          }
        } else {
          this.props.history.push('/Submissions/Latest')
        }
      })
      .catch(err => {
        this.setState({ requestFailedMessage: ErrorHandler(err) })
      })

    if (event) {
      event.preventDefault()
    }

    return true
  }

  handleOnClickAddTask (taskItem) {
    if (!taskItem) {
      return
    }
    const tasks = this.state.tasks
    const task = this.state.taskNames.find(x => x.id === taskItem.id)
    if (task && tasks.indexOf(task) < 0) {
      tasks.push(task)
      this.setState({ tasks, task: {} })
    }
  }

  handleOnClickNewTask (name) {
    if (!this.state.submission.id) {
      this.handleOnSubmit(null, true, () => this.setState({ showAddRefsModal: true, modalMode: 'Task', allNames: this.state.taskNames, refName: name }))
    } else {
      this.setState({ showAddRefsModal: true, modalMode: 'Task', allNames: this.state.taskNames, refName: name })
    }
  }

  handleOnClickRemoveTask (taskId) {
    const tasks = this.state.tasks
    const task = tasks.find(x => x.id === taskId)
    tasks.splice(tasks.indexOf(task), 1)
    this.setState({ tasks })
  }

  handleOnClickAddMethod (methodItem) {
    if (!methodItem) {
      return
    }
    const methods = this.state.methods
    const method = this.state.methodNames.find(x => x.id === methodItem.id)
    if (method && methods.indexOf(method) < 0) {
      methods.push(method)
      this.setState({ methods, method: {} })
    }
  }

  handleOnClickNewMethod (name) {
    if (!this.state.submission.id) {
      this.handleOnSubmit(null, true, () => this.setState({ showAddRefsModal: true, modalMode: 'Method', allNames: this.state.methodNames, refName: name }))
    } else {
      this.setState({ showAddRefsModal: true, modalMode: 'Method', allNames: this.state.methodNames, refName: name })
    }
  }

  handleOnClickRemoveMethod (methodId) {
    const methods = this.state.methods
    const method = methods.find(x => x.id === methodId)
    methods.splice(methods.indexOf(method), 1)
    this.setState({ methods })
  }

  handleOnClickAddPlatform (platformItem) {
    if (!platformItem) {
      return
    }
    const platforms = this.state.platforms
    const platform = this.state.platformNames.find(x => x.id === platformItem.id)
    if (platform && platforms.indexOf(platform) < 0) {
      platforms.push(platform)
      this.setState({ platforms, platform: {} })
    }
  }

  handleOnClickNewPlatform (name) {
    if (!this.state.submission.id) {
      this.handleOnSubmit(null, true, () => this.setState({ showAddRefsModal: true, modalMode: 'Platform', allNames: this.state.platformNames, refName: name }))
    } else {
      this.setState({ showAddRefsModal: true, modalMode: 'Platform', allNames: this.state.platformNames, refName: name })
    }
  }

  handleOnClickRemovePlatform (platformId) {
    const platforms = this.state.platforms
    const platform = platforms.find(x => x.id === platformId)
    platforms.splice(platforms.indexOf(platform), 1)
    this.setState({ platforms })
  }

  handleOnClickAddTag () {
    if (!this.state.tag) {
      return
    }
    const tags = this.state.tags
    if (tags.indexOf(this.state.tag) < 0) {
      tags.push(this.state.tag)
      this.setState({ tags, tag: '' })
    }
  }

  handleKeyDown (e) {
    if (!this.state.tag) {
      return
    }
    const tags = this.state.tags
    if (e.keyCode === 13) {
      e.preventDefault()
      tags.push(this.state.tag)
      this.setState({ tags, tag: '' })
    }
  }

  handleOnClickRemoveTag (tag) {
    const tags = this.state.tags
    tags.splice(tags.indexOf(tag), 1)
    this.setState({ tags })
  }

  handleOnClickRemoveResult () {
    this.setState({ showRemoveModal: true })
  }

  handleOnClickEditResult (resultId) {
    let nResult = {}
    for (let i = 0; i < this.state.submission.results.length; i++) {
      if (this.state.submission.results[i].id === resultId) {
        const result = { ...this.state.submission.results[i] }
        result.submissionId = this.state.submission.id
        if (result.task.id !== undefined) {
          result.task = result.task.id
        }
        if (result.method.id !== undefined) {
          result.method = result.method.id
        }
        if ((result.platform !== null) && (result.platform.id !== undefined)) {
          result.platform = result.platform.id
        }
        nResult = result
        break
      }
    }
    this.setState({ result: nResult, showAddModal: true, modalMode: 'Result' })
  }

  handleModalResultAddNew (submission) {
    this.setState({ showAddModal: false, submission, requestFailedMessage: '' })
  }

  handleOnClickNewResult () {
    const result = {
      id: '',
      task: '',
      method: '',
      platform: '',
      metricName: '',
      metricValue: 0,
      isHigherBetter: false,
      evaluatedDate: new Date()
    }
    this.handleOnSubmit(null, true, () => {
      this.setState({ result, showAddModal: true, modalMode: 'Result' })
    })
  }

  handleModalRefSubmit (submission) {
    this.setState({ submission, requestFailedMessage: '' })
  }

  handleSortNames (names) {
    names.sort(function (a, b) {
      if (a.name.toLowerCase() < b.name.toLowerCase()) return -1
      if (a.name.toLowerCase() > b.name.toLowerCase()) return 1
      return 0
    })
  }

  componentDidMount () {
    const taskNamesRoute = config.api.getUriPrefix() + '/task/names'
    axios.get(taskNamesRoute)
      .then(res => {
        const tasks = res.data.data
        this.handleSortNames(tasks)
        this.setState({ requestFailedMessage: '', taskNames: tasks })
      })
      .catch(err => {
        this.setState({ requestFailedMessage: ErrorHandler(err) })
      })

    const methodNamesRoute = config.api.getUriPrefix() + '/method/names'
    axios.get(methodNamesRoute)
      .then(res => {
        const methods = res.data.data
        this.handleSortNames(methods)
        this.setState({ requestFailedMessage: '', methodNames: methods })
      })
      .catch(err => {
        this.setState({ requestFailedMessage: ErrorHandler(err) })
      })

    const platformNamesRoute = config.api.getUriPrefix() + '/platform/names'
    axios.get(platformNamesRoute)
      .then(res => {
        const platforms = res.data.data
        this.handleSortNames(platforms)
        this.setState({ requestFailedMessage: '', platformNames: platforms })
      })
      .catch(err => {
        this.setState({ requestFailedMessage: ErrorHandler(err) })
      })

    const tagNamesRoute = config.api.getUriPrefix() + '/tag/names'
    axios.get(tagNamesRoute)
      .then(res => {
        const tags = res.data.data
        this.setState({ requestFailedMessage: '', tagNames: tags })
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

  render () {
    return ((!this.props.isLoggedIn && <Redirect to='/LogIn/AddSubmission' />) ||
      (this.props.isLoggedIn &&
        <div id='metriq-main-content' className='container'>
          <ViewHeader>Add Submission</ViewHeader>
          <form onSubmit={this.handleOnSubmit}>
            <FormFieldAlertRow>
              <b>
                <p>If you have an article, code repository, or any URL constituting or presenting a "method" for quantum applications, use this form to create a unique page for it.</p>
                <p>If you have independently recreated or validated the results of another submission on Metriq, you can add your new results to its page.</p>
              </b>
            </FormFieldAlertRow>
            <FormFieldRow
              inputName='contentUrl' inputType='text' label='Content URL'
              validatorMessage={this.state.isAlreadyInDatabase ? 'URL is already in database!' : requiredFieldMissingError}
              onChange={this.handleOnChange}
              onBlur={this.handleOnFieldBlur}
              validRegex={this.state.isAlreadyInDatabase ? /^$/ : urlValidRegex}
              isValidatedOnStart
            />
            <FormFieldAlertRow>
              <b>The external content URL points to the full content of the submission.<br />(This could be a link to arXiv, for example.)<br /><i>This cannot be changed after hitting "Submit."</i></b>
            </FormFieldAlertRow>
            <FormFieldRow
              inputName='codeUrl' inputType='text' label='Code URL'
              onChange={this.handleOnChange}
              validRegex={blankOrurlValidRegex}
              value={this.state.codeUrl}
            />
            <FormFieldAlertRow>
              <b>(Optional) A URL that points to relevant code, (like a GitHub repository).</b>
            </FormFieldAlertRow>
            <FormFieldRow
              inputName='supplementUrl' inputType='text' label='Supplement URL'
              onChange={this.handleOnChange}
              validRegex={blankOrurlValidRegex}
              value={this.state.supplementUrl}
            />
            <FormFieldAlertRow>
              <b>(Optional) A URL that points to relevant supplemental materials, (like a DOI).</b>
            </FormFieldAlertRow>
            <FormFieldRow
              inputName='name' inputType='text' label='Submission Name'
              validatorMessage={requiredFieldMissingError}
              onChange={this.handleOnChange}
              validRegex={nonblankRegex}
              value={this.state.name}
              isValidatedOnStart
            />
            <FormFieldAlertRow>
              <b>The submission name must be unique.</b>
            </FormFieldAlertRow>
            <FormFieldRow
              inputName='description' inputType='textarea' label='Description'
              placeholder='Explain the content of the submission URL at a high level, as one would with a peer-reviewed research article abstract...'
              onChange={this.handleOnChange}
              value={this.state.description}
            />
            <FormFieldAlertRow>
              <b>We encourage using an abstract, for the submission description.</b>
            </FormFieldAlertRow>
            <FormFieldRow
              inputName='thumbnailUrl' inputType='text' label='Image URL' imageUrl
              validatorMessage={invalidUrlError}
              onChange={this.handleOnChange}
              validRegex={blankOrurlValidRegex}
              value={this.state.thumbnailUrl}
              isValidatedOnStart
            />
            <FormFieldAlertRow>
              <b>The image URL is loaded as a thumbnail, for the submission.<br />(For free image hosting, see <a href='https://imgbb.com/' target='_blank' rel='noreferrer'>https://imgbb.com/</a>, for example.)</b>
            </FormFieldAlertRow>
            <br />
            <FormFieldTypeaheadRow
              inputName='task' label='Tasks' labelKey='name'
              onChange={this.handleOnChange}
              options={this.state.taskNames}
              onSelect={this.handleOnClickAddTask} isClearedOnSelect
              onClickNew={this.handleOnClickNewTask}
              disabled={!urlValidRegex.test(this.state.contentUrl)}
            />
            <FormFieldRowDeleter options={this.state.tasks} onClickRemove={this.handleOnClickRemoveTask} emptyMessage='There are no associated tasks, yet.' />
            <FormFieldAlertRow>
              <b>"Tasks" are practical workloads of interest.</b>
            </FormFieldAlertRow>
            <br />
            <FormFieldTypeaheadRow
              inputName='method' label='Methods' labelKey='name'
              onChange={this.handleOnChange}
              options={this.state.methodNames}
              onSelect={this.handleOnClickAddMethod} isClearedOnSelect
              onClickNew={this.handleOnClickNewMethod}
              disabled={!urlValidRegex.test(this.state.contentUrl)}
            />
            <FormFieldRowDeleter options={this.state.methods} onClickRemove={this.handleOnClickRemoveMethod} emptyMessage='There are no associated methods, yet.' />
            <FormFieldAlertRow>
              <b>"Methods" are algorithms, techniques, or hardware to perform "tasks."</b>
            </FormFieldAlertRow>
            <br />
            <FormFieldTypeaheadRow
              inputName='platform' label='Platforms' labelKey='name'
              onChange={this.handleOnChange}
              options={this.state.platformNames}
              onSelect={this.handleOnClickAddPlatform} isClearedOnSelect
              onClickNew={this.handleOnClickNewPlatform}
              disabled={!urlValidRegex.test(this.state.contentUrl)}
            />
            <FormFieldRowDeleter options={this.state.platforms} onClickRemove={this.handleOnClickRemovePlatform} emptyMessage='There are no associated platforms, yet.' />
            <FormFieldAlertRow>
              <b>"Platforms" track all metadata in common between distinct "methods."</b>
            </FormFieldAlertRow>
            <br />
            <FormFieldTypeaheadRow
              inputName='tag' label='Tags'
              onChange={this.handleOnChange}
              options={this.state.tagNames.map(item => item.name)}
              onClickAdd={this.handleOnClickAddTag}
              onKeyDown={this.handleKeyDown}
              disabled={!urlValidRegex.test(this.state.contentUrl)}
            />
            <FormFieldRowDeleter options={this.state.tags.map((item) => { return { name: item } })} onClickRemove={this.handleOnClickRemoveTag} emptyMessage='There are no associated tags, yet.' />
            <FormFieldAlertRow>
              <b>"Tags" are a set of descriptive labels.<br />(Tags can contain spaces.)</b>
            </FormFieldAlertRow>
            <br />
            <FormFieldAlertRow>
              <ResultsTable
                results={this.state.submission.results}
                onClickAdd={this.handleOnClickNewResult}
                onClickRemove={this.handleOnClickRemoveResult}
                onClickEdit={this.handleOnClickEditResult}
                disabled={!urlValidRegex.test(this.state.contentUrl)}
              />
            </FormFieldAlertRow>
            <br />
            <FormFieldAlertRow>
              <FormFieldValidator invalid={!!this.state.requestFailedMessage} message={this.state.requestFailedMessage} />
            </FormFieldAlertRow>
            {!!this.state.submission.id &&
              <FormFieldAlertRow className='text-center'>
                <i>Draft saved at {this.state.draftedAt}</i>
              </FormFieldAlertRow>}
            <FormFieldWideRow className='text-center'>
              <TooltipTrigger message="Draft is saved under 'My Submissions'">
                <Button variant='light' className='submission-ref-button' onClick={() => this.handleOnSubmit(null, true, null)} disabled={!this.state.isValidated && !this.isAllValid()}>Save draft</Button>
              </TooltipTrigger>
              <input className='btn btn-primary submission-ref-button' type='submit' value='Submit' disabled={!this.state.isValidated && !this.isAllValid()} />
            </FormFieldWideRow>
          </form>
          <Suspense fallback={<span />}>
            <SubmissionRefsAddModal
              show={this.state.showAddRefsModal}
              onHide={() => this.setState({ showAddRefsModal: false })}
              modalMode={this.state.modalMode}
              refName={this.state.refName}
              submissionId={this.state.submission.id}
              allNames={this.state.allNames}
              filteredNames={this.state.allNames}
              onAddNew={this.handleModalRefAddNew}
              isNewOnly
            />
            <ResultsAddModal
              show={this.state.showAddModal}
              onHide={() => this.setState({ showAddModal: false })}
              submission={this.state.submission}
              result={this.state.result}
              metricNames={this.state.metricNames}
              onAddOrEdit={this.handleModalResultAddNew}
            />
            <SubmissionRefsDeleteModal
              show={this.state.showRemoveModal}
              onHide={() => this.setState({ showRemoveModal: false })}
              modalMode='Result'
              submission={this.state.submission}
              onSubmit={this.handleModalRefSubmit}
            />
          </Suspense>
        </div>
      )
    )
  }
}

export default AddSubmission
