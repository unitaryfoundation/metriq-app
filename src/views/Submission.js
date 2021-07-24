import axios from 'axios'
import React from 'react'
import config from './../config'
import ErrorHandler from './../components/ErrorHandler'
import EditButton from '../components/EditButton'
import FormFieldRow from '../components/FormFieldRow'
import FormFieldTypeaheadRow from '../components/FormFieldTypeaheadRow'
import FormFieldTextArea from '../components/FormFieldTextArea'
import { Accordion, Card, Modal, Button, ButtonGroup, Dropdown, DropdownButton } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const dateRegex = /^\d{4}-\d{2}-\d{2}$/
const metricNameRegex = /.{1,}/
const metricValueRegex = /^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$/

class Submission extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      item: {},
      taskNames: [],
      parentTasks: [],
      attachedTasks: [],
      metricNames: [],
      showAddModal: false,
      showRemoveModal: false,
      modalMode: '',
      result: {
        submission: this.props.match.params.id,
        metricName: '',
        metricValue: 0,
        isHigherBetter: false,
        evaluatedDate: new Date()
      },
      task: {
        submission: this.props.match.params.id,
        taskName: '',
        attachedTask: '',
        parentTask: ''
      }
    }

    this.handleOnClickAdd = this.handleOnClickAdd.bind(this)
    this.handleOnClickRemove = this.handleOnClickRemove.bind(this)
    this.handleHideAddModal = this.handleHideAddModal.bind(this)
    this.handleHideRemoveModal = this.handleHideRemoveModal.bind(this)
    this.handleAddModalSubmit = this.handleAddModalSubmit.bind(this)
    this.handleRemoveModalDone = this.handleRemoveModalDone.bind(this)
    this.handleOnResultChange = this.handleOnResultChange.bind(this)
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

  handleHideAddModal () {
    this.setState({ showAddModal: false })
  }

  handleHideRemoveModal () {
    this.setState({ showRemoveModal: false })
  }

  handleAddModalSubmit () {
    this.setState({ showAddModal: false })
    if (this.state.mode === 'Result') {
      const resultRoute = config.api.getUriPrefix() + '/result'
      axios.post(resultRoute, this.state.result)
        .then(res => {
          this.setState({ isRequestFailed: false, requestFailedMessage: '', item: res.data.data })
        })
        .catch(err => {
          this.setState({ isRequestFailed: true, requestFailedMessage: ErrorHandler(err) })
        })
    }
  }

  handleRemoveModalDone () {
    this.setState({ showRemoveModal: false })
  }

  handleOnResultChange (field, value) {
    // parent class change handler is always called with field name and value
    this.setState({ result: { [field]: value } })
  }

  componentDidMount () {
    const submissionRoute = config.api.getUriPrefix() + '/submission/' + this.props.match.params.id
    axios.get(submissionRoute)
      .then(res => {
        this.setState({ isRequestFailed: false, requestFailedMessage: '', item: res.data.data })
      })
      .catch(err => {
        this.setState({ isRequestFailed: true, requestFailedMessage: ErrorHandler(err) })
      })
    const metricNamesRoute = config.api.getUriPrefix() + '/result/metricNames'
    axios.get(metricNamesRoute)
      .then(res => {
        this.setState({ isRequestFailed: false, requestFailedMessage: '', metricNames: res.data.data })
      })
      .catch(err => {
        this.setState({ isRequestFailed: true, requestFailedMessage: ErrorHandler(err) })
      })
    const taskNamesRoute = config.api.getUriPrefix() + '/result/taskNames'
    axios.get(taskNamesRoute)
      .then(res => {
        this.setState({ isRequestFailed: false, requestFailedMessage: '', taskNames: res.data.data })
      })
      .catch(err => {
        this.setState({ isRequestFailed: true, requestFailedMessage: ErrorHandler(err) })
      })
    const attachedTasksRoute = config.api.getUriPrefix() + '/result/attachedTasks'
    axios.get(attachedTasksRoute)
      .then(res => {
        this.setState({ isRequestFailed: false, requestFailedMessage: '', attachedTasks: res.data.data })
      })
      .catch(err => {
        this.setState({ isRequestFailed: true, requestFailedMessage: ErrorHandler(err) })
      })
    const parentTasksRoute = config.api.getUriPrefix() + '/result/parentTasks'
    axios.get(parentTasksRoute)
      .then(res => {
        this.setState({ isRequestFailed: false, requestFailedMessage: '', parentTasks: res.data.data })
      })
      .catch(err => {
        this.setState({ isRequestFailed: true, requestFailedMessage: ErrorHandler(err) })
      })
  }

  render () {
    return (
      <div className='container submission-detail-container'>
        <header>{this.state.item.name}</header>
        <br />
        <div className='row'>
          <div className='col-md-12'>
            <div><h1>{this.state.item.submissionName}</h1></div>
            <div className='submission-description'>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec commodo est. Nunc mollis nunc ac ante vestibulum, eu consectetur magna porttitor. Proin ac tortor urna. Aliquam ac ante eu nunc aliquam convallis et in sem. Donec volutpat tincidunt tincidunt. Aliquam at risus non diam imperdiet vestibulum eget a orci. In ultricies, arcu vel semper lobortis, lorem orci placerat nisi, id fermentum purus odio ut nulla. Duis quis felis a erat mattis venenatis id sit amet purus. Aenean a risus dui.
            </div>
          </div>
        </div>
        <br />
        <div className='row'>
          <div className='col-md-6'>
            <div>
              <h2>Tasks
                <EditButton
                  className='float-right edit-button btn'
                  onClickAdd={() => this.handleOnClickAdd('Task')}
                  onClickRemove={() => this.handleOnClickRemove('Task')}
                />
              </h2>
              <hr />
            </div>
            <div className='card bg-light'>
              <div className='card-body'>Lorem ipsum</div>
            </div>
          </div>
          <div className='col-md-6'>
            <div>
              <h2>Methods
                <EditButton
                  className='float-right edit-button btn'
                  onClickAdd={() => this.handleOnClickAdd('Method')}
                  onClickRemove={() => this.handleOnClickRemove('Method')}
                />
              </h2>
              <hr />
            </div>
            <div className='card bg-light'>
              <div className='card-body'>Lorem ipsum</div>
            </div>
          </div>
        </div>
        <br />
        <div className='row'>
          <div className='col-md-12'>
            <div>
              <h2>Results
                <EditButton
                  className='float-right edit-button btn'
                  onClickAdd={() => this.handleOnClickAdd('Result')}
                  onClickRemove={() => this.handleOnClickRemove('Result')}
                />
              </h2>
              <hr />
            </div>
            <div className='card bg-light'>
              <div className='card-body'>Lorem ipsum</div>
            </div>
          </div>
        </div>
        <Modal show={this.state.showAddModal} onHide={this.handleHideAddModal}>
          {(this.state.modalMode === 'Login') &&
            <Modal.Header closeButton>
              <Modal.Title>Add</Modal.Title>
            </Modal.Header>}
          {(this.state.modalMode !== 'Login') &&
            <Modal.Header closeButton>
              <Modal.Title>Add {this.state.modalMode}</Modal.Title>
            </Modal.Header>}
          <Modal.Body>
            {(this.state.modalMode === 'Login') &&
              <span>
                Please <Link to='/Login'>login</Link> before editing.
              </span>}
            {(this.state.modalMode === 'Task') &&
              <span>
                <b>Attached tasks:</b><br></br>
                <ButtonGroup vertical>
                  {this.state.attachedTasks.map((e, key) => {
                    return <Button key={key} value={e.value}>{e.name}</Button>
                  })}
                </ButtonGroup><br></br>
                Add:
                <DropdownButton id="dropdown-task-button" title="Tasks">
                  {this.state.taskNames.map((e, key) => {
                    return <Dropdown.Item key={key} value={e.value}>{e.name}</Dropdown.Item>
                  })}
                </DropdownButton><br></br>
                Not in the list?<br></br>
                <Accordion defaultActiveKey="0">
                  <Card>
                    <Card.Header>
                      <Accordion.Toggle as={Button} variant="link" eventKey="1">
                        + Create a new task.
                      </Accordion.Toggle>
                    </Card.Header>
                    <Accordion.Collapse eventKey="1">
                      <Card.Body>
                        <FormFieldTypeaheadRow
                          inputName='taskName' label='New task name'
                          onChange={this.handleOnResultChange}
                          validRegex={metricNameRegex}
                          options={this.state.metricNames}
                          value=''
                        /><br />
                        <DropdownButton id="dropdown-parent-task-button" title="Parent task (if any)">
                          {this.state.parentTasks.map((e, key) => {
                            return <Dropdown.Item key={key} value={e.value}>{e.name}</Dropdown.Item>
                          })}
                        </DropdownButton><br></br>
                        <FormFieldTextArea
                          inputName='description' label='Description'
                          onChange={this.handleOnResultChange}
                          validRegex={metricNameRegex}
                          options={this.state.metricNames}
                          value=''
                        /><br />
                      </Card.Body>
                    </Accordion.Collapse>
                  </Card>
                </Accordion>
              </span>}
            {(this.state.modalMode === 'Result') &&
              <span>
                <FormFieldTypeaheadRow
                  inputName='metricName' label='Metric name'
                  onChange={this.handleOnResultChange}
                  validRegex={metricNameRegex}
                  options={this.state.metricNames}
                  value=''
                /><br />
                <FormFieldRow
                  inputName='metricValue' inputType='number' label='Metric value'
                  validRegex={metricValueRegex}
                  onChange={this.handleOnResultChange}
                /><br />
                <FormFieldRow
                  inputName='evalutedDate' inputType='date' label='Evaluated'
                  validRegex={dateRegex}
                  onChange={this.handleOnResultChange}
                /><br />
                <FormFieldRow
                  inputName='isHigherBetter' inputType='checkbox' label='Is higher better?'
                  onChange={this.handleOnResultChange}
                />
              </span>}
            {(this.state.modalMode !== 'Login' && this.state.modalMode !== 'Result') &&
              <span>
                <br /><br />Mode: {this.state.modalMode}
              </span>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant='primary' onClick={this.handleAddModalSubmit}>
              {(this.state.modalMode === 'Login') ? 'Cancel' : 'Submit'}
            </Button>
          </Modal.Footer>
        </Modal>
        <Modal show={this.state.showRemoveModal} onHide={this.handleHideRemoveModal}>
          <Modal.Header closeButton>
            <Modal.Title>Remove</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {(this.state.modalMode === 'Login') &&
              <span>
                Please <Link to='/Login'>login</Link> before editing.
              </span>}
            {(this.state.modalMode !== 'Login') &&
              <span>
                Woohoo, you're reading this text in a modal!<br /><br />Mode: {this.state.modalMode}
              </span>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant='primary' onClick={this.handleRemoveModalDone}>
              {(this.state.modalMode === 'Login') ? 'Cancel' : 'Done'}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}

export default Submission
