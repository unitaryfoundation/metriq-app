import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "../styles/HierarchyTree.css";

const HierarchyTree = ({
  data,
  onNodeClick,
  onNodeExpand,
  searchTerm = "",
}) => {
  const svgRef = useRef();
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  useEffect(() => {
    if (!data || !svgRef.current) return;

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    // Set up dimensions with dynamic sizing
    const margin = { top: 20, right: 120, bottom: 30, left: 120 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = svgRef.current.clientHeight - margin.top - margin.bottom;

    // Create the SVG container with zoom support
    const svg = d3
      .select(svgRef.current)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr(
        "viewBox",
        [
          0,
          0,
          width + margin.left + margin.right,
          height + margin.top + margin.bottom,
        ].join(" ")
      );

    // Add zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 2])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create the tree layout
    const tree = d3.tree().size([height, width]).nodeSize([50, 150]);

    // Create the root node and process the data
    const root = d3.hierarchy(data);

    // Function to update node visibility based on expanded state
    const updateNodes = (node) => {
      if (!node.children && node._children) {
        node.children = node._children;
        node._children = null;
      } else if (node.children && !expandedNodes.has(node.data.id)) {
        node._children = node.children;
        node.children = null;
      }
      if (node.children) {
        node.children.forEach(updateNodes);
      }
    };

    // Process the nodes
    updateNodes(root);

    // Assigns the x and y position for the nodes
    const treeData = tree(root);

    // Compute the new tree layout
    const nodes = treeData.descendants();
    const links = treeData.links();

    // Create the transition
    const transition = d3.transition().duration(750);

    // Define the curve for the links
    const diagonal = d3
      .linkHorizontal()
      .x((d) => d.y)
      .y((d) => d.x);

    // Add the links
    g.selectAll(".link")
      .data(links)
      .join(
        (enter) =>
          enter
            .append("path")
            .attr("class", "link")
            .attr("d", diagonal)
            .style("opacity", 0)
            .transition(transition)
            .style("opacity", 1),
        (update) => update.transition(transition).attr("d", diagonal),
        (exit) => exit.transition(transition).style("opacity", 0).remove()
      );

    // Add the nodes
    const node = g
      .selectAll(".node")
      .data(nodes)
      .join(
        (enter) =>
          enter
            .append("g")
            .attr("class", "node")
            .attr("transform", (d) => `translate(${d.y},${d.x})`)
            .style("opacity", 0)
            .transition(transition)
            .style("opacity", 1),
        (update) =>
          update
            .transition(transition)
            .attr("transform", (d) => `translate(${d.y},${d.x})`),
        (exit) => exit.transition(transition).style("opacity", 0).remove()
      );

    // Add circles for the nodes
    node
      .append("circle")
      .attr("r", 10)
      .attr("class", (d) => {
        const classes = [`node-circle ${d.data.type || ""}`];
        if (
          searchTerm &&
          d.data.name.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          classes.push("node--matched");
        }
        return classes.join(" ");
      })
      .on("click", function (event, d) {
        event.stopPropagation();
        if (d.children || d._children) {
          const isExpanded = expandedNodes.has(d.data.id);
          const newExpandedNodes = new Set(expandedNodes);
          if (isExpanded) {
            newExpandedNodes.delete(d.data.id);
          } else {
            newExpandedNodes.add(d.data.id);
          }
          setExpandedNodes(newExpandedNodes);
          if (onNodeExpand) {
            onNodeExpand(d.data, !isExpanded);
          }
        }
      });

    // Add icons based on node type
    node
      .append("text")
      .attr("class", "node-icon")
      .attr("dy", "0.3em")
      .attr("x", -5)
      .html((d) => {
        switch (d.data.type) {
          case "task":
            return "📋";
          case "method":
            return "⚙️";
          case "device":
            return "💻";
          default:
            return "📁";
        }
      });

    // Add labels for the nodes
    node
      .append("text")
      .attr("dy", ".35em")
      .attr("x", (d) => (d.children || d._children ? -30 : 20))
      .attr("text-anchor", (d) => (d.children || d._children ? "end" : "start"))
      .text((d) => d.data.name)
      .attr("class", (d) => {
        const classes = ["node-label"];
        if (
          searchTerm &&
          d.data.name.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          classes.push("node--matched");
        }
        return classes.join(" ");
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        if (onNodeClick) onNodeClick(d.data);
      });

    // Add expand/collapse indicators
    node
      .filter((d) => d.children || d._children)
      .append("text")
      .attr("class", "node-toggle")
      .attr("dy", "0.3em")
      .attr("x", (d) => (d.children || d._children ? -20 : 20))
      .text((d) => (d.children ? "−" : "+"))
      .on("click", function (event, d) {
        event.stopPropagation();
        const isExpanded = expandedNodes.has(d.data.id);
        const newExpandedNodes = new Set(expandedNodes);
        if (isExpanded) {
          newExpandedNodes.delete(d.data.id);
        } else {
          newExpandedNodes.add(d.data.id);
        }
        setExpandedNodes(newExpandedNodes);
        if (onNodeExpand) {
          onNodeExpand(d.data, !isExpanded);
        }
      });

    // Add tooltips
    node.append("title").text((d) => {
      const type = d.data.type ? `Type: ${d.data.type}\n` : "";
      const description = d.data.description ? `${d.data.description}\n` : "";
      return `${d.data.name}\n${type}${description}Click to ${
        d.children || d._children ? "expand/collapse" : "view details"
      }`;
    });

    // Add zoom controls
    const zoomControls = svg
      .append("g")
      .attr("class", "zoom-controls")
      .attr(
        "transform",
        `translate(${width + margin.right - 60}, ${height - 80})`
      );

    zoomControls
      .append("rect")
      .attr("width", 40)
      .attr("height", 80)
      .attr("rx", 5)
      .attr("fill", "white")
      .attr("stroke", "#ccc");

    zoomControls
      .append("text")
      .attr("x", 20)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .attr("class", "zoom-button")
      .text("+")
      .on("click", () => zoom.scaleBy(svg.transition().duration(750), 1.3));

    zoomControls
      .append("text")
      .attr("x", 20)
      .attr("y", 65)
      .attr("text-anchor", "middle")
      .attr("class", "zoom-button")
      .text("−")
      .on("click", () => zoom.scaleBy(svg.transition().duration(750), 1 / 1.3));
  }, [data, expandedNodes, onNodeClick, onNodeExpand, searchTerm]);

  return (
    <div className="hierarchy-tree-container">
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default HierarchyTree;
