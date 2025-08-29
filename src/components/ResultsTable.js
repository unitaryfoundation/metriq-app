import React, { Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import EditButton from './EditButton'
import FormFieldWideRow from './FormFieldWideRow'
import { canAppendToSubmission, isSubmissionRestricted } from '../utils/accessControl'
const SortingTable = React.lazy(() => import('../components/SortingTable'))
const TooltipTrigger = React.lazy(() => import('./TooltipTrigger'))


const ResultsTable = (props) => {
  const [effectiveDisabled, setEffectiveDisabled] = useState(!!props.disabled)
  const [restricted, setRestricted] = useState(false)

  useEffect(() => {
    let cancelled = false
    const compute = async () => {
      try {
        // Try to parse submission id from URL: /Submission/:id
        const match = (window.location && window.location.pathname || '').match(/\/Submission\/(\d+)/i)
        const submissionId = match ? Number(match[1]) : undefined

        const isRestricted = submissionId ? isSubmissionRestricted(submissionId) : false
        setRestricted(isRestricted)

        if (props.disabled) {
          setEffectiveDisabled(true)
          return
        }
        if (!isRestricted) {
          setEffectiveDisabled(false)
          return
        }
        if (!submissionId) {
          setEffectiveDisabled(true)
          return
        }
        const allowed = await canAppendToSubmission(submissionId)
        if (!cancelled) setEffectiveDisabled(!allowed)
      } catch (e) {
        if (!cancelled) setEffectiveDisabled(!!props.disabled)
      }
    }
    compute()
    return () => { cancelled = true }
  }, [props.disabled])

  return (
    <FormFieldWideRow>
      <div className='card taxonomy-card'>
        <div className='card-title'>
          <h5>Results{restricted && <span className='badge bg-warning text-dark ms-2'>Restricted</span>}
            <EditButton
              className='float-end edit-button btn'
              onClickAdd={props.onClickAdd}
              onClickRemove={props.onClickRemove}
              disabled={effectiveDisabled}
            />
          </h5>
          <small><i>Results are metric name/value pairs that can be extracted from Submissions (papers, codebases, etc.)</i></small>
          <hr />
        </div>
        <div className='card-text'>
          {(props.results.length > 0) &&
            <Suspense fallback={<div>Loading...</div>}>
              <SortingTable
                scrollX
                columns={[
                  {
                    title: 'Task',
                    key: 'taskName',
                    width: 150
                  },
                  {
                    title: 'Method',
                    key: 'methodName',
                    width: 150
                  },
                  {
                    title: 'Platform',
                    key: 'platformName',
                    width: 150
                  },
                  {
                    title: 'Metric',
                    key: 'metricName',
                    width: 150
                  },
                  {
                    title: 'Value',
                    key: 'metricValue',
                    width: 120
                  },
                  {
                    title: 'Qubits',
                    key: 'qubitCount',
                    width: 120
                  },
                  {
                    title: 'Depth',
                    key: 'circuitDepth',
                    width: 120
                  },
                  {
                    title: 'Shots',
                    key: 'shots',
                    width: 120
                  },
                  {
                    title: 'Notes',
                    key: 'notes',
                    width: 120

                  },
                  {
                    title: '',
                    key: 'edit',
                    width: 40
                  }
                ]}
                data={props.results.map(row =>
                  ({
                    key: row.id,
                    taskName: <Link to={'/Task/' + row.task.id}>{row.task.name}</Link>,
                    methodName: <Link to={'/Method/' + row.method.id}>{row.method.name}</Link>,
                    platformName: row.platform ? <Link to={'/Platform/' + row.platform.id}>{row.platform.name}</Link> : '(None)',
                    metricName: row.metricName,
                    metricValue: row.metricValue,
                    qubitCount: row.qubitCount,
                    circuitDepth: row.circuitDepth,
                    shots: row.shots,
                    notes: <div className='text-center'>{row.notes && <TooltipTrigger message={<span className='display-linebreak'>{row.notes}</span>}><div className='text-center'><FontAwesomeIcon icon='sticky-note' /></div></TooltipTrigger>}</div>,
                    edit: <div className='text-center'><FontAwesomeIcon icon='edit' onClick={() => props.onClickEdit(row.id)} /></div>
                  })
                )}
                tableLayout='auto'
              />
            </Suspense>}
          {(props.results.length === 0) &&
            <div className='card bg-light'>
              <div className='card-body'>There are no associated results, yet.</div>
            </div>}
        </div>
      </div>
    </FormFieldWideRow>
  )
}

export default ResultsTable
