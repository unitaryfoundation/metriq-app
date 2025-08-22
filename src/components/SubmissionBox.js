import axios from 'axios'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import config from './../config'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import logo from './../images/metriq_logo_secondary_blue.png'
import ErrorHandler from './ErrorHandler'
import TooltipTrigger from './TooltipTrigger'
import { renderLatex } from './RenderLatex'

library.add(faExternalLinkAlt)

const SubmissionBox = (props) => {
  const description = !props.item.description
    ? ''
    : ((props.item.description.length > 500)
        ? (props.item.description.substring(0, 497) + '...')
        : props.item.description)
  const tags = props.item.tags ? props.item.tags.map((obj, ind) => obj.name) : []

  const [upvotes, setUpvotes] = useState(props.item.upvotesCount || 0)
  const [isUpvoted, setIsUpvoted] = useState(props.item.isUpvoted)

  const handleDeleteOnClick = (event) => {
    let confirmString = window.prompt('To delete your submission, type its name below, then hit "OK."\n\n' + props.item.name, '')
    if (confirmString) {
      confirmString = confirmString.trim().toLowerCase()
    }
    if (confirmString && (confirmString === props.item.nameNormal)) {
      axios.delete(config.api.getUriPrefix() + '/submission/' + props.item.id, {})
        .then(res => {
          window.location = '/Submissions'
        })
        .catch(err => {
          window.alert('Error: ' + ErrorHandler(err) + '\nSorry! Check your connection and login status, and try again.')
        })
    } else {
      window.alert('The submission was not deleted. (Please enter the correct submission name, to delete.)')
    }
    event.preventDefault()
  }

  const handlePublishOnClick = (event) => {
    let confirmString = window.prompt('To publish your submission, type its name below, then hit "OK." (You can\'t "unpublish" your submission after that point, only delete it.)\n\n' + props.item.name, '')
    if (confirmString) {
      confirmString = confirmString.trim().toLowerCase()
    }
    if (confirmString && (confirmString === props.item.nameNormal)) {
      const submission = { ...(props.item) }
      submission.isPublished = true
      axios.post(config.api.getUriPrefix() + '/submission/' + props.item.id, submission)
        .then(res => {
          window.location = '/Submissions'
        })
        .catch(err => {
          window.alert('Error: ' + ErrorHandler(err) + '\nSorry! Check your connection and login status, and try again.')
        })
    } else {
      window.alert('The submission was not published. (Please enter the correct submission name, to publish.)')
    }
    event.preventDefault()
  }

  const handleUpVoteOnClick = (event) => {
    if (props.isLoggedIn) {
      axios.post(config.api.getUriPrefix() + '/submission/' + props.item.id + '/upvote', {})
        .then(res => {
          setUpvotes(res.data.data.upvotesCount)
          setIsUpvoted(res.data.data.isUpvoted)
        })
        .catch(err => {
          window.alert('Error: ' + ErrorHandler(err) + '\nSorry! Check your connection and login status, and try again.')
        })
    } else {
      window.location = '/Login'
    }
    event.preventDefault()
  }

  const handleExternalLinkClick = (event) => {
    if (/^https?:\/\//i.test(props.item.contentUrl)) {
      window.open(props.item.contentUrl, '_blank', 'noopener,noreferrer')
    }
    event.preventDefault()
  }

  const parseContentUrl = () => {
    const urlStr = String(props.item.contentUrl)
    if (urlStr.includes('arxiv')) {
      return <span> <FontAwesomeIcon icon={faExternalLinkAlt} /> arXiv:{urlStr.split('/abs/')[1]} </span>
    } else if (urlStr.includes('github')) {
      return <span> <FontAwesomeIcon icon={faExternalLinkAlt} /> GitHub:{urlStr.split('.com/')[1]} </span>
    } else {
      return <span> <FontAwesomeIcon icon={faExternalLinkAlt} /> Link:{urlStr} </span>
    }
  }

  return (
    <div className='submission submission-large submission-shadow'>
      <Link to={'/Submission/' + props.item.id}>
        <div className='row h-100'>
          <div className='col-md-2 col-sm-12 h-100'>
            <img src={props.item.thumbnailUrl ? props.item.thumbnailUrl : logo} alt='Submission thumbnail' className='submission-image' />
          </div>
          <div className='col-md-8 col-sm-12 h-100'>
            <div className='submission-heading'>{props.item.name} {props.isEditView && ' - '} {props.isEditView && <b>{props.isDraft ? 'Unpublished draft' : props.isUnderReview ? 'Under Review' : 'Approved'}</b>}</div>
            <div className='submission-description'>
              {description
                ? renderLatex(description.replace(/\0.*$/g, '').split('. ')[0] + '.')
                : <i>(No description provided.)</i>}
            </div>
            {tags.length > 0 &&
              <div className='submission-description'>
                <b>Tags: </b>{tags.map((obj, ind) => <span key={obj}>{ind > 0 && <span> • </span>}<Link to={'/Tag/' + obj}><span className='link'>{obj}</span></Link></span>)}
              </div>}
          </div>
          <div className='col-md-2 col-sm-12 h-100' />
        </div>
      </Link>
      <hr />
      <div className='row submission-social-row'>
        <div className={props.isDraft ? 'col-md-7 h-100' : 'col-md-9 h-100'}>
          <div className='submission-subheading'>
            <TooltipTrigger message='User submissions link'>
              <Link to={'/User/' + props.item.userId + '/Submissions'}><span className='link'>Submitted by {props.item.username}</span></Link>
            </TooltipTrigger>&nbsp;•&nbsp;
            <TooltipTrigger message='Submission link'>
              <span>
                <span onClick={handleExternalLinkClick} className='link wrap'>
                  {parseContentUrl()}
                </span>&nbsp;•&nbsp;
                {props.item.createdAt ? new Date(props.item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
              </span>
            </TooltipTrigger>
          </div>
        </div>
        <div className={props.isDraft ? 'col-md-3 text-end' : 'col-md-1 text-end'}>
          {props.isDraft &&
            <TooltipTrigger message='Publish submission'>
              <span>{props.isEditView && <button className='delete-button btn btn-danger submission-ref-button' onClick={handlePublishOnClick}>Publish</button>}</span>
            </TooltipTrigger>}
          <TooltipTrigger message='Delete submission'>
            <span>{props.isEditView && <button className='delete-button btn btn-danger submission-ref-button' onClick={handleDeleteOnClick}>Delete</button>}</span>
          </TooltipTrigger>
        </div>
        <div className='col-md-2 text-center'>
          <TooltipTrigger message='Upvote submission'>
            <div>
              <div id={isUpvoted ? 'heart-full' : 'heart-empty'} onClick={handleUpVoteOnClick} />
              <span className='submission-like-count'>{upvotes}</span>
            </div>
          </TooltipTrigger>
        </div>
      </div>
    </div>
  )
}

export default SubmissionBox
