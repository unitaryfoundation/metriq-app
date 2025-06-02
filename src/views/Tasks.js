import React from "react";
import { withRouter } from "react-router-dom";
import axios from "axios";
import config from "../config";
import ErrorHandler from "../components/ErrorHandler";
import HierarchyTree from "../components/HierarchyTree";

class Tasks extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      tasks: [],
      methods: [],
      devices: [],
      hierarchyData: null,
      viewMode: "list",
      searchTerm: "",
      requestFailedMessage: "",
    };

    this.handleSearch = this.handleSearch.bind(this);
    this.toggleViewMode = this.toggleViewMode.bind(this);
    this.handleNodeClick = this.handleNodeClick.bind(this);
    this.handleNodeExpand = this.handleNodeExpand.bind(this);
  }

  componentDidMount() {
    this.setState({ isLoading: true });

    // Fetch data from the API
    Promise.all([
      axios.get(`${config.api.getUriPrefix()}/Data`),
      axios.get(`${config.api.getUriPrefix()}/Data/methods`),
      axios.get(`${config.api.getUriPrefix()}/Data/platforms`),
    ])
      .then(([tasksRes, methodsRes, platformsRes]) => {
        const tasks = tasksRes.data.data || [];
        const methods = methodsRes.data.data || [];
        const devices = platformsRes.data.data || [];

        // Build hierarchy data
        const hierarchyData = {
          name: "Quantum Computing",
          type: "root",
          children: [
            {
              name: "Tasks",
              type: "category",
              children: tasks.map((task) => ({
                id: task._id || task.id,
                name: task.name,
                type: "task",
                description: task.description,
                parentTaskId: task.parentTaskId,
              })),
            },
            {
              name: "Methods",
              type: "category",
              children: methods.map((method) => ({
                id: method._id || method.id,
                name: method.name,
                type: "method",
                description: method.description,
              })),
            },
            {
              name: "Devices",
              type: "category",
              children: devices.map((device) => ({
                id: device._id || device.id,
                name: device.name,
                type: "device",
                description: device.description,
              })),
            },
          ],
        };

        this.setState({
          tasks,
          methods,
          devices,
          hierarchyData,
          isLoading: false,
          requestFailedMessage: "",
        });
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        this.setState({
          isLoading: false,
          requestFailedMessage: ErrorHandler(err),
        });
      });
  }

  handleSearch(event) {
    this.setState({ searchTerm: event.target.value });
  }

  toggleViewMode() {
    this.setState((prevState) => ({
      viewMode: prevState.viewMode === "list" ? "tree" : "list",
    }));
  }

  handleNodeClick(node) {
    console.log("Node clicked:", node);
    // Implement node click handling if needed
  }

  handleNodeExpand(node, isExpanded) {
    console.log("Node expand:", node, isExpanded);
    // Implement node expansion handling if needed
  }

  render() {
    const {
      isLoading,
      requestFailedMessage,
      hierarchyData,
      viewMode,
      searchTerm,
    } = this.state;

    if (isLoading) {
      return (
        <div className="container mt-5">
          <div className="d-flex justify-content-center">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        </div>
      );
    }

    if (requestFailedMessage) {
      return (
        <div className="container mt-5">
          <div className="alert alert-danger" role="alert">
            {requestFailedMessage}
          </div>
        </div>
      );
    }

    return (
      <div className="container-fluid mt-4">
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <input
                type="text"
                className="form-control w-25"
                placeholder="Search..."
                value={searchTerm}
                onChange={this.handleSearch}
              />
              <button
                className="btn btn-outline-primary"
                onClick={this.toggleViewMode}
              >
                {viewMode === "list" ? "Show Tree View" : "Show List View"}
              </button>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            {viewMode === "tree" ? (
              <div style={{ height: "800px" }}>
                <HierarchyTree
                  data={hierarchyData}
                  onNodeClick={this.handleNodeClick}
                  onNodeExpand={this.handleNodeExpand}
                  searchTerm={searchTerm}
                />
              </div>
            ) : (
              <div className="list-view">
                {this.state.tasks.map((task) => (
                  <div key={task.id} className="card mb-3">
                    <div className="card-body">
                      <h5 className="card-title">{task.name}</h5>
                      {task.description && (
                        <p className="card-text">{task.description}</p>
                      )}
                      <span className="badge bg-primary">Task</span>
                    </div>
                  </div>
                ))}
                {this.state.methods.map((method) => (
                  <div key={method.id} className="card mb-3">
                    <div className="card-body">
                      <h5 className="card-title">{method.name}</h5>
                      {method.description && (
                        <p className="card-text">{method.description}</p>
                      )}
                      <span className="badge bg-success">Method</span>
                    </div>
                  </div>
                ))}
                {this.state.devices.map((device) => (
                  <div key={device.id} className="card mb-3">
                    <div className="card-body">
                      <h5 className="card-title">{device.name}</h5>
                      {device.description && (
                        <p className="card-text">{device.description}</p>
                      )}
                      <span className="badge bg-info">Device</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Tasks);
