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


## Special Notes

### For Builder

From the "Getting Started" section:

> If you have a need to attach “ad-hoc” properties to nodes that have not been specified at its definition, then consider deriving from the [SemiStructuredNode](https://neomodel.readthedocs.io/en/latest/module_documentation_sync.html#semistructurednode-doc) class.

