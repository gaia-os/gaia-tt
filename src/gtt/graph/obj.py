from dataclasses import dataclass
from enum import Enum

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

