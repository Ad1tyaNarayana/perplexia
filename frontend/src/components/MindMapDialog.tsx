import { Dialog, DialogContent } from "./ui/dialog";
import ReactFlow, {
  Node,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { useCallback, useState, useEffect, useRef } from "react";

interface MindmapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mindmap: any;
}

// Main component that wraps the ReactFlow implementation with provider
export function MindmapDialog({
  open,
  onOpenChange,
  mindmap,
}: MindmapDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-full min-h-full max-w-[95vw] max-h-[95vh] bg-slate-900 text-slate-100 border-slate-800">
        <ReactFlowProvider>
          <MindmapContent mindmap={mindmap} />
        </ReactFlowProvider>
      </DialogContent>
    </Dialog>
  );
}

// Inner component that uses ReactFlow hooks
function MindmapContent({ mindmap }: { mindmap: any }) {
  const [layoutCalculated, setLayoutCalculated] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowRef = useRef(null);

  // Process the mindmap data and build normalized nodes with improved positioning
  const processInitialNodes = useCallback(() => {
    if (!mindmap?.nodes) return [];

    // First pass: create nodes with initial positions
    const processedNodes: Node[] = mindmap.nodes.map((node: any) => {
      // Use provided position from AI model's JSON
      const position = node.position || { x: 0, y: 0 };
      const nodeStyle = node.style || {};

      // Calculate node width based on label length
      const labelLength = node.label?.length || 0;
      const extraWidth = Math.max(0, labelLength - 15) * 10;
      const nodeWidth = nodeStyle.width || 180 + extraWidth;
      const nodeHeight = nodeStyle.height || 80;

      // Set background color based on node type if not specified
      let backgroundColor = nodeStyle.backgroundColor || "";
      if (!backgroundColor || backgroundColor.toLowerCase() === "#ffffff") {
        if (node.type === "central") {
          backgroundColor = "#2563eb";
        } else if (node.type === "topic") {
          backgroundColor = "#0891b2";
        } else if (node.type === "subtopic") {
          backgroundColor = "#334155";
        } else {
          backgroundColor = "#1e293b";
        }
      }

      // Create node with calculated properties
      return {
        id: node.id,
        data: {
          label: node.label,
          level: node.level || 0,
          type: node.type || "default",
        },
        position,
        type: "default",
        style: {
          background: backgroundColor,
          color: nodeStyle.textColor || "white",
          border: `1px solid ${nodeStyle.borderColor || "#334155"}`,
          borderRadius: "8px",
          padding: "10px",
          width: node.type === "central" ? Math.max(220, nodeWidth) : nodeWidth,
          height: nodeHeight,
          textAlign: "center",
          fontSize:
            nodeStyle.fontSize || (node.type === "central" ? "16px" : "14px"),
          fontWeight:
            nodeStyle.fontWeight ||
            (node.type === "central"
              ? "bold"
              : node.type === "topic"
              ? "600"
              : "normal"),
          zIndex: 10,
        },
      };
    });

    return processedNodes;
  }, [mindmap]);

  // Build ReactFlow edges
  const processInitialEdges = useCallback(() => {
    if (!mindmap?.links) return [];

    return mindmap.links.map((link: any) => {
      const linkStyle = link.style || {};

      // Determine edge style based on relationship type
      const isHierarchy = link.type === "hierarchy";
      const strokeColor =
        linkStyle.strokeColor || (isHierarchy ? "#334155" : "#64748b");
      const strokeWidth = linkStyle.strokeWidth || (isHierarchy ? 2 : 1);

      return {
        id: `${link.source}-${link.target}`,
        source: link.source,
        target: link.target,
        animated: linkStyle.animated || false,
        style: {
          stroke: strokeColor,
          strokeWidth: strokeWidth,
        },
        // Use a curved edge type for better visualization
        type: "smoothstep",
        label: link.description,
        labelStyle: { fill: "#94a3b8", fontSize: 12 },
        markerEnd: {
          type: "arrowclosed",
          width: 15,
          height: 15,
          color: strokeColor,
        },
      };
    });
  }, [mindmap]);

  // Update nodes and edges when mindmap changes
  useEffect(() => {
    if (mindmap) {
      setNodes(processInitialNodes());
      setEdges(processInitialEdges());
      setLayoutCalculated(true);
    }
  }, [mindmap, processInitialEdges, processInitialNodes, setEdges, setNodes]);

  // Fit view when the layout is calculated
  useEffect(() => {
    if (layoutCalculated && reactFlowRef.current) {
      setTimeout(() => {
        if (reactFlowRef.current) {
          // @ts-ignore - ReactFlow instance has fitView method
          reactFlowRef.current.fitView({
            padding: 0.3,
            includeHiddenNodes: false,
          });
        }
      }, 100);
    }
  }, [layoutCalculated]);

  const onInit = useCallback(
    (reactFlowInstance: any) => {
      reactFlowRef.current = reactFlowInstance;
      if (layoutCalculated) {
        setTimeout(() => {
          reactFlowInstance.fitView({ padding: 0.4 });
        }, 200); // Slightly longer timeout for better rendering
      }
    },
    [layoutCalculated]
  );

  return (
    <div className="w-full h-full flex flex-col">
      <div className="text-xl font-semibold text-center">
        {mindmap?.title || "Mindmap"}
      </div>
      <div className="flex-1 w-full h-[calc(100%-3rem)]">
        {mindmap && (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onInit={onInit}
            fitViewOptions={{ padding: 0.4, includeHiddenNodes: false }}
            minZoom={0.1}
            maxZoom={1.5}
            attributionPosition="bottom-right"
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            zoomOnScroll={true}
            zoomOnPinch={true}
            panOnScroll={true}
            edgesFocusable={false}
            edgesUpdatable={false}
            defaultEdgeOptions={{
              zIndex: -1,
              style: { zIndex: -1 },
            }}
          >
            <Controls position="bottom-right" />
            <Background color="#334155" gap={16} />
            <MiniMap
              nodeStrokeColor="#334155"
              nodeColor={(node) =>
                (node.style?.background as string) || "#1e293b"
              }
              maskColor="rgba(15, 23, 42, 0.6)"
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
