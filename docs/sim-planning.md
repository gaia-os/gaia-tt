# Simulator Tool

## Questions

1. Granularity. Do we want to guide granularity in construction or be more hands-off? I think the answer will become more apparent as we define model structures
2. How much do we want the simulation tools to be exposed to the user and how much do we want the system to be run via natural language?

## Glossary and Terms

### The Interpreter

Language model with special prompting that interprets the query.
It is to be seen how much of the runs will be parsed from natural language vs exposed tooling, but anyway.

- The interpreter establishes which nodes are involved, what attributes to use, and prepares a final, sanitized simulation request to be passed along.
- It should probably also spec. the creation of new models/components for the simulation, and potentially whether such pieces are ephemeral or not.

This final prompt is also passed into the Engine, where it will guide the simulation construction.

### The Runner

"Where" simulations are run. Intakes the loaded components and run config parameters.

### The Engine

In between the Builder and the Runner.
The Engine **initializes** and strings together the different pieces for the simulation run,
and sends the prepared package into the Runner.

### The Builder

- This is where new models are built
- It also **composes** such models from stored models in the library

#### Thinking

The Builder has to do be capable of some careful thinking when it comes to constructing these statistical models.

- It should be allowed to perform actor-critic and research style loops to evaluate the quality of its proposed builds. 
  - This is especially relevant as builds become more advanced.

### The Library / Repo

Where constructed models are stored for retrieval.

- What should be ephemeral and what should be stored? 
  - Well, things that are 'static', models of tech nodes should persist
  - These sorts of models can be constructed during document upload/AI research phases, and queued as side processes.
    - e.g. "X enabling tech produces between a-b TWh"
    - or as an llm interprets a tech, the TRL is surmised and recorded as part of its world model as well (assigned as attribute).

### Attributes

Data attached to a node

#### Scratch

Okay, there are several modules here LLMs jumping in and out
