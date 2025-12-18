from neomodel import (
    AsyncStructuredNode,
    StringProperty,
    JSONProperty,
    AsyncRelationshipTo,
)
from pydantic import BaseModel


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
