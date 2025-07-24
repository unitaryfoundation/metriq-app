import React from 'react';
import axios from 'axios';
import config from '../config';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import '../tree.css';

/* ------------------------------------------------------------------ */
/*  Recursive tree node                                               */
/* ------------------------------------------------------------------ */
const TreeNode = ({ item, level = 0, isLast = false, ancestorLast = [] }) => {
  const [expanded, setExpanded] = React.useState(false);
  const [loading,  setLoading]  = React.useState(false);
  const [children, setChildren] = React.useState(null);   // null = not fetched

  const hasPotentialKids = children === null;             // might have children
  const hasLoadedKids    = children && children.length > 0;
  const isExpandable     = hasPotentialKids || hasLoadedKids;

  /* --- Toggle handler --------------------------------------------- */
  const toggle = () => {
    if (!isExpandable) return;          // ignore clicks on true leaves

    /* expand ------------------------------------------------------- */
    if (!expanded) {
      // first time we click a still‑unloaded node -> fetch children
      if (children === null) {
        setLoading(true);
        axios
          .get(`${config.api.getUriPrefix()}/method/${item.id}`)
          .then(res => {
            const method = res.data.data || res.data.body || {};
            setChildren(Array.isArray(method.childMethods) ? method.childMethods : []);
            setExpanded(true);
          })
          .catch(() => setChildren([])) // treat error as “no kids”
          .finally(() => setLoading(false));
      } else {
        setExpanded(true);
      }
    /* collapse ----------------------------------------------------- */
    } else {
      setExpanded(false);
    }
  };

  /* --- Build ASCII prefix (│ ├── └──) ----------------------------- */
  const parts = ancestorLast.map(last => (last ? '    ' : '│   '));
  parts.push(isLast ? '└── ' : '├── ');
  const prefix = parts.join('').replace(/ /g, '\u00A0');   // keep spaces

  return (
    <li className="tree-node">
      {/*   + / − toggle or blank spacer                               */}
      {isExpandable ? (
        <span className="tree-toggle" onClick={toggle}>
          {expanded ? '−' : '+'}
        </span>
      ) : (
        <span className="tree-toggle-placeholder" />
      )}

      {/*   ASCII lines                                               */}
      <span className="tree-prefix">{prefix}</span>

      {/*   Clickable method name                                     */}
      <Link className="tree-label" to={`/Method/${item.id}`}>
        {item.name}
      </Link>

      {loading && <span className="tree-loading"> loading…</span>}

      {/*   Recursively render children                               */}
      {expanded && hasLoadedKids && (
        <ul>
          {children.map((child, idx) => (
            <TreeNode
              key={child.id}
              item={child}
              level={level + 1}
              isLast={idx === children.length - 1}
              ancestorLast={[...ancestorLast, isLast]}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

TreeNode.propTypes = {
  item: PropTypes.object.isRequired,
  level: PropTypes.number,
  isLast: PropTypes.bool,
  ancestorLast: PropTypes.array
};

/* ------------------------------------------------------------------ */
/*  Top‑level MethodTree component                                    */
/* ------------------------------------------------------------------ */
const MethodTree = () => {
  const [roots,   setRoots]   = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    axios
      .get(`${config.api.getUriPrefix()}/method/submissionCount`)
      .then(res => {
        const data = res.data.data || res.data.body || [];
        setRoots(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="method-tree">
      <h4>Method Hierarchy</h4>

      {loading && <p>Loading hierarchy…</p>}

      {!loading && (
        <ul className="tree-root">
          {roots.map((root, idx) => (
            <TreeNode
              key={root.id}
              item={root}
              level={0}
              isLast={idx === roots.length - 1}
              ancestorLast={[]}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default MethodTree;
