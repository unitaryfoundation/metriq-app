import React from 'react'
import { Link } from 'react-router-dom'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faThumbsUp, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'

library.add(faThumbsUp, faExternalLinkAlt)

class TaskMethodBox extends React.Component {
  render () {
    return (
      <tr>
        <td>
          <Link to={((this.props.type === 'task') ? '/Task/' : '/Method/') + this.props.item._id}>
            <div className='submission-heading'>{this.props.item.name}</div>
          </Link>
        </td>
        <td className='task-method-item-spacer' />
        <td>
          <OverlayTrigger placement='top' overlay={props => <Tooltip {...props}>Count of submissions, with task</Tooltip>}>
            <span><FontAwesomeIcon icon={faExternalLinkAlt} />: {this.props.item.submissionCount}</span>
          </OverlayTrigger>&nbsp;
          <OverlayTrigger placement='top' overlay={props => <Tooltip {...props}>Count of upvotes, for all submissions with task</Tooltip>}>
            <span><FontAwesomeIcon icon={faThumbsUp} />: {this.props.item.upvoteTotal}</span>
          </OverlayTrigger>
        </td>
      </tr>
    )
  }
}

export default TaskMethodBox
