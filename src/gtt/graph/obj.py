from narwhals import Boolean
from neomodel import (
    UniqueIdProperty,
    StringProperty,
    BooleanProperty,
    JSONProperty,
    AsyncStructuredNode,
    AsyncStructuredRel,
    RegexProperty,
    AsyncRelationshipFrom,
    AsyncRelationshipTo,
)
from neomodel.contrib import AsyncSemiStructuredNode

from pydantic import BaseModel
from typing import cast, Any

from gtt.utils import GTT_COLORS


class NodeGroup(BaseModel):
    id: str
    code: str


class TTNodeType(BaseModel):
    id: str
    label: str
    groups: list[NodeGroup] = []
    trl_current: str | None = None
    trl_projected_5_10_years: str | None = None
    description: str | None = None
    detailedDescription: str | None = None
    references: list[str] = []
    infact_analysis: dict | None = None
    infact_analysis_html_content: str | None = None
    infact_status: str | None = None


class TTEdgeType(BaseModel):
    source: str
    target: str


#=== Relationships ===

class ParentRel(AsyncStructuredRel):
    """Node Parent relationship"""
    pass

#=== Nodes ===

class TTNodeGroup(AsyncStructuredNode):
    """
    Tech tree node group
    """
    uid = UniqueIdProperty()
    name = RegexProperty(
        required=True,
        # Start with a letter, then allow alphanumeric, dash, underscore, dot, etc.
        regex=r"^[a-zA-Z][a-zA-Z0-9\s\-_.,|()\[\]]*$",
    )
    code = RegexProperty(
        unique_index=True,
        required=True,
        regex=r"^[a-zA-Z][a-zA-Z0-9\-_]*$",
    )
    description = StringProperty()
    color = StringProperty(
        default=GTT_COLORS["blue"],
    )
    hidden = BooleanProperty(default=False)

    def __init__(self, *args: Any, **kwargs: Any):
        # If code is not given, lowercase the name
        if "code" not in kwargs:
            # Replace basically everything with underscores
            code = kwargs["name"].lower().replace(" ", "_")
            code = code.replace("-", "_")
            code = code.replace(".", "_")
            code = code.replace("[", "_")
            code = code.replace("(", "_")
            code = code.replace("]", "_")
            code = code.replace(")", "_")
            code = code.replace("|", "_")
            code = code.replace(",", "_")
            kwargs["code"] = code

        color = kwargs.get("color", None)
        if color in GTT_COLORS:
            kwargs["color"] = GTT_COLORS[color]

        super().__init__(*args, **kwargs)


class TTNode(AsyncSemiStructuredNode):
    """
    Tech tree node

    The AsyncSemiStructuredNode class allows for flexible property creation
    We avoid defining a 'label' property, since that has a particular connotation in neo4j
    Indeed, in neo4j a 'label' is the node type, which neomodel automatically assigns as the py class name,
    in this case, "TTNode"
    """
    uid = UniqueIdProperty()
    code = StringProperty()
    groups = JSONProperty(default=[])

    parents = AsyncRelationshipFrom("TTNode", "PARENT_OF", model=ParentRel)
    children = AsyncRelationshipTo("TTNode", "PARENT_OF", model=ParentRel)

    trl_current = StringProperty()
    trl_projected_5_10_years = StringProperty()
    description = StringProperty()
    detailed_description = StringProperty()
    references = JSONProperty(default=[])
    infact_analysis = JSONProperty()
    infact_analysis_html_content = StringProperty()
    infact_status = StringProperty()

    # Directed relationship representing dependencies
    depends_on = AsyncRelationshipTo("Node", "DEPENDS_ON")
    s_on = AsyncRelationshipTo("Node", "DEPENDS_ON")

    def to_pydantic(self) -> TTNodeType:
        """Convert to Pydantic model for API responses."""
        return TTNodeType(
            id=self.node_id,
            label=self.label,
            groups=[NodeGroup(**g) for g in (self.groups or [])],
            trl_current=self.trl_current,
            trl_projected_5_10_years=self.trl_projected_5_10_years,
            description=self.description,
            detailedDescription=self.detailed_description,
            references=self.references or [],
            infact_analysis=self.infact_analysis,
            infact_analysis_html_content=self.infact_analysis_html_content,
            infact_status=self.infact_status,
        )

    def to_dict(self):
        """Standard dictionary representation for internal logic."""
        return {
            "id": self.node_id,
            "label": self.label,
            "groups": self.groups,
            "trl_current": self.trl_current,
            "trl_projected_5_10_years": self.trl_projected_5_10_years,
            "description": self.description,
            "detailedDescription": self.detailed_description,
            "references": self.references,
            "infact_analysis": self.infact_analysis,
            "infact_analysis_html_content": self.infact_analysis_html_content,
            "infact_status": self.infact_status,
        }

    def add_parents(self, parent_nodes: list["TTNode"]):
        """Add parent relationships to this node."""
        for parent in parent_nodes:
            self.parents.connect(parent)

    def set_parents(self, parent_nodes: list["TTNode"]):
        """Set parent relationships to this node, replacing existing ones."""
        self.parents.disconnect_all()
        for parent in parent_nodes:
            self.parents.connect(parent)

    def remove_parent(self, parent_node: "TTNode"):
        """Remove a specific parent relationship from this node."""
        self.parents.disconnect(parent_node)

    def add_child(self, child_node: "TTNode"):
        """Add a child relationship to this node."""
        self.children.connect(child_node)

    def set_children(self, child_nodes: list["TTNode"]):
        """Set child relationships to this node, replacing existing ones."""
        self.children.disconnect_all()
        for child in child_nodes:
            self.children.connect(child)

    def remove_child(self, child_node: "TTNode"):
        """Remove a specific child relationship from this node."""
        self.children.disconnect(child_node)



class TTEdge:
    """
    Directed edge in the tech tree.

    Supports either a single target (target) or multiple targets (targets) to
    match the heterogeneous input formats seen in the data. Use targets_list()
    to iterate over resolved target IDs.
    """
    source: str
    target: str | None = None
    targets: list[str] | None = None

    def targets_list(self) -> list[str]:
        """
        Get a list of target IDs.

        :returns:   List of target strings
        """
        if self.targets:
            return [t for t in self.targets if t]
        return [self.target] if self.target else []
