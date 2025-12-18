from dataclasses import dataclass
from enum import Enum


from neomodel import (
    AsyncStructuredNode,
    StringProperty,
    JSONProperty,
    AsyncRelationshipTo,
)
from pydantic import BaseModel

class Node:
    """
    A node in the tech tree graph.

    Represents milestones, enabling technologies, and reactor concepts with
    optional TRL metadata used to estimate initial time and risk.
    """
    id: str
    label: str
    type: str
    trl_current: str | None = None
    trl_projected_5_10_years: str | None = None


class Edge:
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
        if self.targets:
            return [t for t in self.targets if t]
        return [self.target] if self.target else []


class Graph:
    """
    Graph object

    Avoid global GTT specifics, since we will probably be instantiating subgraphs etc.
    """
    name: str



class NodeSchema(BaseModel):
    id: str
    label: str
    type: str
    category: str | None = None
    subtype: str | None = None
    trl_current: str | None = None
    trl_projected_5_10_years: str | None = None
    description: str | None = None
    detailedDescription: str | None = None
    references: list[str] = []
    infact_analysis: dict | None = None
    infact_analysis_html_content: str | None = None
    infact_status: str | None = None


class EdgeSchema(BaseModel):
    source: str
    target: str


class TechNode(AsyncStructuredNode):
    """
    Asynchronous neomodel representing a node in the Tech Tree.
    """
    node_id = StringProperty(unique_index=True, required=True)
    label = StringProperty()
    node_type = StringProperty()  # 'Milestone', 'EnablingTechnology', 'ReactorConcept'
    category = StringProperty()
    subtype = StringProperty()
    trl_current = StringProperty()
    trl_projected_5_10_years = StringProperty()
    description = StringProperty()
    detailed_description = StringProperty()
    references = JSONProperty(default=[])
    infact_analysis = JSONProperty()
    infact_analysis_html_content = StringProperty()
    infact_status = StringProperty()

    # Directed relationship representing dependencies
    depends_on = AsyncRelationshipTo("TechNode", "DEPENDS_ON")

    def to_dict(self):
        """Standard dictionary representation for internal logic."""
        return {
            "id": self.node_id,
            "label": self.label,
            "type": self.node_type,
            "category": self.category,
            "subtype": self.subtype,
            "trl_current": self.trl_current,
            "trl_projected_5_10_years": self.trl_projected_5_10_years,
            "description": self.description,
            "detailedDescription": self.detailed_description,
            "references": self.references,
            "infact_analysis": self.infact_analysis,
            "infact_analysis_html_content": self.infact_analysis_html_content,
            "infact_status": self.infact_status,
        }
