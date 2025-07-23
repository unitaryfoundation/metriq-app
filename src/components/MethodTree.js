import React from 'react'
import axios from 'axios'
import config from '../config'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import '../tree.css'

const TreeNode = ({ item }) => {
  const [expanded, setExpanded] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [children, setChildren] = React.useState(null) // null means not loaded

  const toggle = () => {
    if (!expanded) {
      if (children === null) {
        setLoading(true)
        axios.get(`${config.api.getUriPrefix()}/method/${item.id}`)
          .then(res => {
            const method = res.data.data || res.data.body || {}
            setChildren(method.childMethods || [])
            setExpanded(true)
          })
          .catch(() => {
            setChildren([])
          })
          .finally(() => setLoading(false))
      } else {
        setExpanded(true)
      }
    } else {
      setExpanded(false)
    }
  }

  return (
    <li className='tree-node'>
      {((children === null) || (children && children.length > 0)) && (
        <span className='tree-toggle' onClick={toggle} role='button'>
          {expanded ? '▼' : '▶'}
        </span>
      )}
      {(children !== null && children.length === 0) && (
        <span className='tree-toggle-placeholder' />
      )}
      <Link className='tree-label' to={`/Method/${item.id}`}>{item.name}</Link>
      {loading && <span className='tree-loading'> loading...</span>}
      {expanded && children.length > 0 && (
        <ul>
          {children.map(child => (
            <TreeNode key={child.id} item={child} />
          ))}
        </ul>
      )}
    </li>
  )
}

TreeNode.propTypes = {
  item: PropTypes.object.isRequired
}

const MethodTree = () => {
  const [roots, setRoots] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    axios.get(`${config.api.getUriPrefix()}/method/submissionCount`)
      .then(res => {
        setRoots(res.data.data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className='method-tree'>
      <h4>Method Hierarchy</h4>
      {loading && <p>Loading hierarchy...</p>}
      {!loading && (
        <ul className='tree-root'>
          {roots.map(root => (
            <TreeNode key={root.id} item={root} />
          ))}
        </ul>
      )}
    </div>
  )
}

export default MethodTree