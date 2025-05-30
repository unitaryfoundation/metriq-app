import axios from "axios";
import React from "react";
import config from "./../config";
import ErrorHandler from "../components/ErrorHandler";
import FormFieldValidator from "../components/FormFieldValidator";
import FormFieldTypeaheadRow from "../components/FormFieldTypeaheadRow";
import CategoryScroll from "../components/CategoryScroll";
import FormFieldAlertRow from "../components/FormFieldAlertRow";
import FormFieldWideRow from "../components/FormFieldWideRow";
import ViewHeader from "../components/ViewHeader";
import HierarchyTree from "../components/HierarchyTree";
import { sortAlphabetical } from "../components/SortFunctions";
import { withRouter } from "react-router-dom";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faHeart,
  faExternalLinkAlt,
  faChartLine,
  faSearch,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

library.add(faHeart, faExternalLinkAlt, faChartLine, faSearch, faSpinner);

class Tasks extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      alphabetical: [],
      allNames: [],
      filterId: null,
      requestFailedMessage: "",
      hierarchyData: null,
      viewMode: "list", // 'list' or 'tree'
      tasks: [],
      methods: [],
      devices: [],
      searchTerm: "",
      selectedNode: null,
      isLoadingDetails: false,
    };

    this.handleOnFilter = this.handleOnFilter.bind(this);
    this.handleOnSelect = this.handleOnSelect.bind(this);
    this.handleNodeClick = this.handleNodeClick.bind(this);
    this.handleNodeExpand = this.handleNodeExpand.bind(this);
    this.toggleViewMode = this.toggleViewMode.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.buildHierarchyData = this.buildHierarchyData.bind(this);
    this.setupWebSocket = this.setupWebSocket.bind(this);
    this.handleDataUpdate = this.handleDataUpdate.bind(this);
  }

  handleOnFilter(value) {
    if (value) {
      this.setState({ filterId: value.id });
    }
  }

  handleOnSelect(value) {
    if (value) {
      this.setState({ selectedNode: value });
    }
  }

  handleNodeClick(nodeData) {
    this.setState({ selectedNode: nodeData, isLoadingDetails: true });

    // Fetch detailed information based on node type
    const endpoint =
      nodeData.type === "method"
        ? "method"
        : nodeData.type === "device"
        ? "platform"
        : "task";

    axios
      .get(`${config.api.getUriPrefix()}/${endpoint}/${nodeData.id}`)
      .then((res) => {
        this.setState({
          selectedNode: { ...nodeData, details: res.data.data },
          isLoadingDetails: false,
        });
      })
      .catch((err) => {
        this.setState({
          requestFailedMessage: ErrorHandler(err),
          isLoadingDetails: false,
        });
      });
  }

  handleNodeExpand(nodeData, isExpanded) {
    if (isExpanded) {
      // Fetch related data based on node type
      const promises = [];

      if (nodeData.type === "task") {
        promises.push(
          axios.get(`${config.api.getUriPrefix()}/task/${nodeData.id}/methods`),
          axios.get(
            `${config.api.getUriPrefix()}/task/${nodeData.id}/platforms`
          )
        );
      } else if (nodeData.type === "method") {
        promises.push(
          axios.get(`${config.api.getUriPrefix()}/method/${nodeData.id}/tasks`),
          axios.get(
            `${config.api.getUriPrefix()}/method/${nodeData.id}/platforms`
          )
        );
      } else if (nodeData.type === "device") {
        promises.push(
          axios.get(
            `${config.api.getUriPrefix()}/platform/${nodeData.id}/tasks`
          ),
          axios.get(
            `${config.api.getUriPrefix()}/platform/${nodeData.id}/methods`
          )
        );
      }

      Promise.all(promises)
        .then((results) => {
          const newData = results.reduce((acc, res) => {
            return [...acc, ...res.data.data];
          }, []);

          this.setState((prevState) => ({
            hierarchyData: this.buildHierarchyData([
              ...prevState.tasks,
              ...prevState.methods,
              ...prevState.devices,
              ...newData,
            ]),
          }));
        })
        .catch((err) => {
          this.setState({ requestFailedMessage: ErrorHandler(err) });
        });
    }
  }

  toggleViewMode() {
    this.setState((prevState) => ({
      viewMode: prevState.viewMode === "list" ? "tree" : "list",
    }));
  }

  handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    this.setState({ searchTerm });
  }

  buildHierarchyData(items) {
    // Create nodes for each type
    const taskNodes = this.state.tasks.map((task) => ({
      ...task,
      type: "task",
      children: [],
    }));

    const methodNodes = this.state.methods.map((method) => ({
      ...method,
      type: "method",
      children: [],
    }));

    const deviceNodes = this.state.devices.map((device) => ({
      ...device,
      type: "device",
      children: [],
    }));

    // Create maps for quick lookup
    const taskMap = new Map(taskNodes.map((node) => [node.id, node]));
    const methodMap = new Map(methodNodes.map((node) => [node.id, node]));
    const deviceMap = new Map(deviceNodes.map((node) => [node.id, node]));

    // Build relationships
    items.forEach((item) => {
      if (item.parentTaskId) {
        const parent = taskMap.get(item.parentTaskId);
        if (parent) {
          parent.children.push(item);
        }
      }
      // Add other relationships based on your data structure
    });

    // Create root node
    return {
      name: "Quantum Computing Hierarchy",
      type: "root",
      children: [
        {
          name: "Tasks",
          type: "category",
          children: taskNodes.filter((node) => !node.parentTaskId),
        },
        {
          name: "Methods",
          type: "category",
          children: methodNodes,
        },
        {
          name: "Devices",
          type: "category",
          children: deviceNodes,
        },
      ],
    };
  }

  setupWebSocket() {
    const wsUrl = config.api.getUriPrefix().replace("http", "ws");
    this.ws = new WebSocket(wsUrl + "/updates");

    this.ws.onmessage = (event) => {
      const update = JSON.parse(event.data);

      // Handle different types of updates
      switch (update.type) {
        case "task":
        case "method":
        case "device":
          this.handleDataUpdate(update);
          break;
        default:
          console.warn("Unknown update type:", update.type);
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      // Attempt to reconnect after a delay
      setTimeout(() => this.setupWebSocket(), 5000);
    };

    this.ws.onclose = () => {
      console.log("WebSocket connection closed");
      // Attempt to reconnect after a delay
      setTimeout(() => this.setupWebSocket(), 5000);
    };
  }

  handleDataUpdate(update) {
    this.setState((prevState) => {
      // Create new arrays to trigger React updates
      const tasks =
        update.type === "task"
          ? [
              ...prevState.tasks.filter((t) => t.id !== update.data.id),
              update.data,
            ]
          : prevState.tasks;

      const methods =
        update.type === "method"
          ? [
              ...prevState.methods.filter((m) => m.id !== update.data.id),
              update.data,
            ]
          : prevState.methods;

      const devices =
        update.type === "device"
          ? [
              ...prevState.devices.filter((d) => d.id !== update.data.id),
              update.data,
            ]
          : prevState.devices;

      // Rebuild hierarchy with updated data
      return {
        tasks,
        methods,
        devices,
        hierarchyData: this.buildHierarchyData([
          ...tasks,
          ...methods,
          ...devices,
        ]),
      };
    });
  }

  componentDidMount() {
    // Fetch tasks
    axios
      .get(config.api.getUriPrefix() + "/task/all")
      .then((res) => {
        const tasks = res.data.data;
        this.setState({ tasks });
        return axios.get(config.api.getUriPrefix() + "/method/all");
      })
      .then((res) => {
        const methods = res.data.data;
        this.setState({ methods });
        return axios.get(config.api.getUriPrefix() + "/platform/all");
      })
      .then((res) => {
        const devices = res.data.data;
        this.setState((prevState) => ({
          devices,
          hierarchyData: this.buildHierarchyData([
            ...prevState.tasks,
            ...prevState.methods,
            devices,
          ]),
          isLoading: false,
        }));
      })
      .catch((err) => {
        this.setState({
          requestFailedMessage: ErrorHandler(err),
          isLoading: false,
        });
      });

    // Set up WebSocket connection
    this.setupWebSocket();
  }

  componentWillUnmount() {
    // Clean up WebSocket connection
    if (this.ws) {
      this.ws.close();
    }
  }

  render() {
    const { selectedNode, isLoadingDetails, searchTerm } = this.state;

    return (
      <div id="metriq-main-content">
        <ViewHeader>Quantum Computing Hierarchy</ViewHeader>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <button
              className={`btn ${
                this.state.viewMode === "list"
                  ? "btn-primary"
                  : "btn-outline-primary"
              } me-2`}
              onClick={this.toggleViewMode}
            >
              List View
            </button>
            <button
              className={`btn ${
                this.state.viewMode === "tree"
                  ? "btn-primary"
                  : "btn-outline-primary"
              }`}
              onClick={this.toggleViewMode}
            >
              Tree View
            </button>
          </div>

          <div className="search-container">
            <input
              type="text"
              className="form-control"
              placeholder="Search in tree..."
              value={searchTerm}
              onChange={this.handleSearch}
            />
          </div>
        </div>

        <div className="row">
          <div className={`col-${selectedNode ? "8" : "12"}`}>
            {this.state.viewMode === "list" ? (
              <FormFieldWideRow className="centered-tabs">
                <div className="col-lg-9 col">
                  <h3>Task Categories</h3>
                  {this.state.isLoading ? (
                    <div className="loading-overlay">
                      <div className="loading-spinner"></div>
                    </div>
                  ) : (
                    <div className="task-list">
                      {this.state.tasks
                        .filter((task) => !task.parentTaskId)
                        .map((task) => (
                          <div
                            key={task.id}
                            className="task-item"
                            onClick={() => this.handleNodeClick(task)}
                          >
                            <h4>{task.name}</h4>
                            {task.description && <p>{task.description}</p>}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </FormFieldWideRow>
            ) : (
              <div
                className="hierarchy-tree-wrapper"
                style={{ height: "600px" }}
              >
                {this.state.isLoading ? (
                  <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                  </div>
                ) : (
                  this.state.hierarchyData && (
                    <HierarchyTree
                      data={this.state.hierarchyData}
                      onNodeClick={this.handleNodeClick}
                      onNodeExpand={this.handleNodeExpand}
                      searchTerm={searchTerm}
                    />
                  )
                )}
              </div>
            )}
          </div>

          {selectedNode && (
            <div className="col-4">
              <div className="details-panel">
                {isLoadingDetails ? (
                  <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                  </div>
                ) : (
                  <>
                    <h3>{selectedNode.name}</h3>
                    <div className="type-badge">{selectedNode.type}</div>
                    {selectedNode.details && (
                      <div className="details-content">
                        <p>{selectedNode.details.description}</p>
                        {/* Add more details based on node type */}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <FormFieldAlertRow>
          <FormFieldValidator
            invalid={!!this.state.requestFailedMessage}
            message={this.state.requestFailedMessage}
          />
        </FormFieldAlertRow>
      </div>
    );
  }
}

export default withRouter(Tasks);
