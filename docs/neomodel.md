# OGM with `neomodel`

`neomodel` is an **Object Graph Mapper** (OGM) that allows object-style python development for a Graph database.
Django for a graph DB.

Note that some cli commands use a `--db` argument to the bolt url.
You can omit this to default to the `NEO4J_BOLT_URL` variable if set.
You may want to export this:
```bash
export NEO4J_BOLT_URL="bolt://neo4j:test@localhost:7687"
```

## Updating your schema

After any update to the schema, run the following neomodel script

```bash
$ neomodel_install_labels [<somemodels.py>] [<some.models>] ... 
```

## Clearing the schema

I guess this resets the schema or something?
```bash
$ neomodel_remove_labels
```

See [docs](https://neomodel.readthedocs.io/en/latest/getting_started.html#remove-existing-constraints-and-indexes)

## Debugging and Inspection

You can inspect the database with

```bash
$ neomodel_inspect_database --write-to data/diagnostics/neomodel_dump.py
```

# Viewing

You can generate a class diagram of your models using the `neomodel_generate_diagram` command:

```bash
neomodel_generate_diagram models/my_models.py --file-type arrows --write-to-dir img
```

You must specify a directory in which to lookup neomodel classes (nodes and rels). 
Typing `.` will search in your whole directory.

You have the option to generate the diagram in different file types using `--file-type: arrows, puml` (which uses the dot notation).

Omitting the `--write-to-dir` option will default to the current directory.

> Property types and the presence of indexes, constraints and required rules will be displayed on the nodes.
> Relationship properties are not supported in the diagram generation.


## Special Notes

### Style Guide

Let's follow neo4j and Cypher's style guide with an exception on property keys:

- Labels are capitalized and should be CamelCase (e.g., `Person`, `Movie`, `ImdbUser`).
  - These are the python class names, which `neomodel` will translate to labels.
- Relationship types are written with all capital letters and an underscore character as a separator (e.g., `DIRECTED`, `ACTED_IN`).
- Neo4j/Cypher style for properties suggests `camelCase`, but we will opt for Pythonic `snake_case`.

### For Builder

From the "Getting Started" section:

> If you have a need to attach “ad-hoc” properties to nodes that have not been specified at its definition, then consider deriving from the [SemiStructuredNode](https://neomodel.readthedocs.io/en/latest/module_documentation_sync.html#semistructurednode-doc) class.

