import axios from 'axios'
import React from 'react'
import config from './../config'
import FormFieldAlert from '../components/FormFieldAlert'
import FormFieldRow from '../components/FormFieldRow'
import FormFieldTypeaheadRow from '../components/FormFieldTypeaheadRow'
import FormFieldValidator from '../components/FormFieldValidator'
import ErrorHandler from '../components/ErrorHandler'
import { Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons'

library.add(faPlus, faTrash)

const requiredFieldMissingError = 'Required field.'

const nonblankRegex = /(.|\s)*\S(.|\s)*/

class AddSubmission extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      name: '',
      contentUrl: '',
      thumbnailUrl: '',
      description: '',
      tags: [],
      tag: '',
      tagNames: [],
      showRemoveModal: false,
      isRequestFailed: false,
      requestFailedMessage: '',
      isValidated: false
    }

    if (!this.props.isLoggedIn) {
      window.location.href = '/LogIn/AddSubmission'
    }

    this.handleOnChange = this.handleOnChange.bind(this)
    this.handleOnFieldBlur = this.handleOnFieldBlur.bind(this)
    this.isAllValid = this.isAllValid.bind(this)
    this.handleOnSubmit = this.handleOnSubmit.bind(this)
    this.handleOnClickAddTag = this.handleOnClickAddTag.bind(this)
    this.handleOnClickRemoveTag = this.handleOnClickRemoveTag.bind(this)
  }

  validURL (str) {
    const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', 'i') // fragment locator
    return !!pattern.test(str)
  }

  handleOnChange (field, value) {
    // parent class change handler is always called with field name and value
    this.setState({ [field]: value, isValidated: false })
  }

  handleOnFieldBlur (field, value) {
    if (field === 'thumbnailUrl' || field === 'contentUrl') {
      if (value.trim().length <= 0) {
        this.setState({ name: '', isValidated: false })
        this.setState({ description: '', isValidated: false })
      } else if (this.validURL(value.trim())) {
        axios.post(config.api.getUriPrefix() + '/pagemetadata', { url: value.trim() })
          .then(res => {
            this.setState({ name: res.data.data.og.title, isValidated: false })
            this.setState({ description: res.data.data.og.description, isValidated: false })
          })
          .catch(err => {
            this.setState({ isRequestFailed: true, requestFailedMessage: ErrorHandler(err) })
          })
      }
    }
  }

  isAllValid () {
    if (!this.state.isValidated) {
      this.setState({ isValidated: true })
    }

    return true
  }

  handleOnSubmit (event) {
    if (!this.isAllValid()) {
      event.preventDefault()
      return
    }

    const request = {
      name: this.state.name,
      contentUrl: this.state.contentUrl,
      thumbnailUrl: this.state.thumbnailUrl,
      description: this.state.description,
      tags: this.state.tags.join(',')
    }

    let validatedPassed = true
    if (!this.validURL(request.contentUrl)) {
      this.setState({ isRequestFailed: true, requestFailedMessage: ErrorHandler({ response: { data: { message: 'Invalid content url' } } }) })
      validatedPassed = false
    }

    console.log(request.thumbnailUrl)
    if (request.thumbnailUrl && !this.validURL(request.thumbnailUrl)) {
      this.setState({ isRequestFailed: true, requestFailedMessage: ErrorHandler({ response: { data: { message: 'Invalid thumbnail url' } } }) })
      validatedPassed = false
    }

    if (validatedPassed) {
      axios.post(config.api.getUriPrefix() + '/submission', request)
        .then(res => {
          window.location.href = '/Submissions'
        })
        .catch(err => {
          this.setState({ isRequestFailed: true, requestFailedMessage: ErrorHandler(err) })
        })
    }
    event.preventDefault()
  }

  handleOnClickAddTag () {
    const tags = this.state.tags
    if (tags.indexOf(this.state.tag) < 0) {
      tags.push(this.state.tag)
      this.setState({ tags: tags, tag: '' })
    }
  }

  handleOnClickRemoveTag (tag) {
    const tags = this.state.tags
    tags.splice(tags.indexOf(tag), 1)
    this.setState({ tags: tags })
  }

  componentDidMount () {
    const tagNamesRoute = config.api.getUriPrefix() + '/tag/names'
    axios.get(tagNamesRoute)
      .then(res => {
        const tags = [...res.data.data]
        this.setState({ isRequestFailed: false, requestFailedMessage: '', tagNames: tags })
      })
      .catch(err => {
        this.setState({ isRequestFailed: true, requestFailedMessage: ErrorHandler(err) })
      })
  }

  render () {
    return (
      <div id='metriq-main-content' className='container'>
        <header><h4>Add Submission</h4></header>
        <form onSubmit={this.handleOnSubmit}>
          <div className='row'>
            <div className='col-md-3' />
            <div className='col-md-6'>
              <b>
                <p>If you have an article, code repository, or any URL constituting or presenting a "method" for quantum applications, use this form to create a unique page for it.</p>
                <p>If you have independently recreated or validated the results of another submission on Metriq, you can add your new results to its page.</p>
              </b>
            </div>
            <div className='col-md-3' />
          </div>
          <FormFieldRow
            inputName='contentUrl' inputType='text' label='Content URL'
            validatorMessage={requiredFieldMissingError}
            onChange={this.handleOnChange}
            onBlur={this.handleOnFieldBlur}
            validRegex={nonblankRegex}
          />
          <FormFieldAlert>
            <b>The external content URL points to the full content of the submission.<br />(This could be a link to arXiv, for example.)<br /><i>This cannot be changed after hitting "Submit."</i></b>
          </FormFieldAlert>
          <FormFieldRow
            inputName='name' inputType='text' label='Submission Name'
            validatorMessage={requiredFieldMissingError}
            onChange={this.handleOnChange}
            validRegex={nonblankRegex}
            value={this.state.name}
          />
          <FormFieldAlert>
            <b>The submission name must be unique.</b>
          </FormFieldAlert>
          <FormFieldRow
            inputName='description' inputType='textarea' label='Description'
            placeholder='Explain the content of the submission URL at a high level, as one would with a peer-reviewed research article abstract...'
            onChange={this.handleOnChange}
            value={this.state.description}
          />
          <FormFieldAlert>
            <b>We encourage using an abstract, for the submission description.</b>
          </FormFieldAlert>
          <FormFieldRow
            inputName='thumbnailUrl' inputType='text' label='Image URL' imageUrl
            onChange={this.handleOnChange}
          />
          <FormFieldAlert>
            <b>The image URL is loaded as a thumbnail, for the submission.<br />(For free image hosting, see <a href='https://imgbb.com/' target='_blank' rel='noreferrer'>https://imgbb.com/</a>, for example.)</b>
          </FormFieldAlert>
          <div className='row'>
            <div className='col-md-12'>
              <FormFieldTypeaheadRow
                inputName='tag' label='Tags' buttonLabel='Add tag'
                onChange={this.handleOnChange}
                options={this.state.tagNames.map(item => item.name)}
                onClickButton={this.handleOnClickAddTag}
              />
            </div>
          </div>
          <div className='row'>
            <div className='col-md-3' />
            <div className='col-md-6'>
              {(this.state.tags.length > 0) &&
                <div className='text-left'>
                  {this.state.tags.map((tag, index) => <span key={index}>{index > 0 && <span> • </span>}<Button variant='danger' onClick={() => this.handleOnClickRemoveTag(tag)}><FontAwesomeIcon icon='trash' /> {tag}</Button></span>)}
                </div>}
              {(this.state.tags.length === 0) &&
                <div className='card bg-light'>
                  <div className='card-body'>There are no associated tags, yet.</div>
                </div>}
            </div>
            <div className='col-md-3' />
          </div>
          <FormFieldAlert>
            <b>"Tags" are a set of descriptive labels.<br />(Tags can contain spaces.)</b>
          </FormFieldAlert>
          <div className='row'>
            <div className='col-md-3' />
            <div className='col-md-6'>
              <FormFieldValidator invalid={this.state.isRequestFailed} message={this.state.requestFailedMessage} />
            </div>
            <div className='col-md-3' />
          </div>
          <div className='row'>
            <div className='col-md-12 text-center'>
              <input className='btn btn-primary' type='submit' value='Submit' disabled={!this.state.isValidated && !this.isAllValid()} />
            </div>
          </div>
        </form>
      </div>
    )
  }
}

export default AddSubmission
